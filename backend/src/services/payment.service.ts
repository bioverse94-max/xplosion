import prisma from "../lib/db";
import { PassService } from "./pass.service";
import { APP_CONFIG } from "../lib/config";
import { AuditService } from "./audit.service";
import { EmailService } from "./email.service";

export interface PaymentVerificationInput {
  registrationId: string;
  gatewayOrderId?: string;
  gatewayPaymentId: string;
  gatewaySignature?: string;
  rawWebhookJson?: string;
  verifiedBy?: string;
  adminNotes?: string;
}

export interface SubmitUpiInput {
  registrationId: string;
  utrNumber: string;
  payerUpiId?: string;
}

export class PaymentService {
  static async submitUpiPayment(input: SubmitUpiInput): Promise<{
    success: boolean;
    status: string;
    message: string;
    passIds?: string[];
  }> {
    const { registrationId, utrNumber, payerUpiId } = input;
    const sanitizedUtr = utrNumber.trim().toUpperCase();

    if (!sanitizedUtr || sanitizedUtr.length < 6) {
      throw new Error("Invalid UPI Transaction Reference Number (UTR). Must be at least 6 characters.");
    }

    const existingUtrPayment = await prisma.payment.findFirst({
      where: {
        gatewayPaymentId: sanitizedUtr,
        registrationId: { not: registrationId },
        status: { in: ["SUCCESS", "PENDING_VERIFICATION", "INITIATED"] },
      },
    });

    if (existingUtrPayment) {
      throw new Error(
        `This Transaction ID / UTR (${sanitizedUtr}) has already been recorded. Each payment reference must be unique.`
      );
    }

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { payment: true, attendee: true },
    });

    if (!registration) {
      throw new Error("Registration record not found.");
    }

    if (registration.status === "CONFIRMED") {
      const passes = await prisma.pass.findMany({
        where: { registrationId: registration.id },
        select: { id: true },
      });
      return {
        success: true,
        status: "CONFIRMED",
        message: "Payment already verified.",
        passIds: passes.map((p) => p.id),
      };
    }

    if (APP_CONFIG.autoApprovePayments) {
      const res = await this.completePayment({
        registrationId: registration.id,
        gatewayOrderId: registration.payment?.gatewayOrderId || `ord_${registration.registrationNo}`,
        gatewayPaymentId: sanitizedUtr,
        gatewaySignature: "AUTO_VERIFIED_UPI_UTR",
        verifiedBy: "SYSTEM_AUTO_VERIFY",
        adminNotes: `Payer VPA: ${payerUpiId || "N/A"}`,
      });

      return {
        success: true,
        status: "SUCCESS",
        message: "UPI Payment verified and pass issued instantly!",
        passIds: res.passIds,
      };
    }

    await prisma.payment.update({
      where: { registrationId: registration.id },
      data: {
        gatewayPaymentId: sanitizedUtr,
        paymentMethod: "UPI_QR",
        payerUpiId: payerUpiId || null,
        status: "PENDING_VERIFICATION",
        paidAt: new Date(),
        adminNotes: `Submitted at ${new Date().toISOString()}`,
      },
    });

    return {
      success: true,
      status: "PENDING_VERIFICATION",
      message: "Transaction ID recorded securely in database. Pass will activate upon verification.",
    };
  }

  static async completePayment(input: PaymentVerificationInput): Promise<{ success: boolean; passIds: string[] }> {
    const { registrationId, gatewayOrderId, gatewayPaymentId, gatewaySignature, rawWebhookJson, verifiedBy, adminNotes } = input;

    const result = await prisma.$transaction(async (tx) => {
      const registration = await tx.registration.findUnique({
        where: { id: registrationId },
        include: {
          items: true,
          payment: true,
          attendee: true,
          event: true,
        },
      });

      if (!registration) {
        throw new Error("Registration record not found.");
      }

      if (registration.status === "CANCELLED" || registration.status === "EXPIRED") {
        throw new Error("This registration reservation has expired or was cancelled. Please book new passes.");
      }

      if (gatewayPaymentId) {
        const duplicatePayment = await tx.payment.findFirst({
          where: {
            gatewayPaymentId,
            registrationId: { not: registration.id },
            status: { in: ["SUCCESS", "PENDING_VERIFICATION"] },
          },
        });
        if (duplicatePayment) {
          throw new Error(`This transaction reference (${gatewayPaymentId}) has already been recorded.`);
        }
      }

      if (registration.status === "CONFIRMED") {
        const existingPasses = await tx.pass.findMany({
          where: { registrationId: registration.id },
          select: { id: true },
        });
        return { success: true, passIds: existingPasses.map((p) => p.id) };
      }

      // 1. Update Payment record to SUCCESS
      await tx.payment.update({
        where: { registrationId: registration.id },
        data: {
          gatewayPaymentId,
          gatewaySignature: gatewaySignature || "VERIFIED_SECURITY_MODULE",
          rawWebhookJson: rawWebhookJson || JSON.stringify({ verifiedAt: new Date().toISOString() }),
          status: "SUCCESS",
          paidAt: new Date(),
          verifiedBy: verifiedBy || "ADMIN_VERIFIED",
          verifiedAt: new Date(),
          adminNotes: adminNotes || undefined,
        },
      });

      // 2. Commit ticket inventory (decrement reservedCount with floor at 0, increment soldCount)
      for (const item of registration.items) {
        const ticket = await tx.ticketType.findUnique({ where: { id: item.ticketTypeId } });
        const newReserved = Math.max(0, (ticket?.reservedCount || 0) - item.quantity);
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: {
            reservedCount: newReserved,
            soldCount: { increment: item.quantity },
          },
        });
      }

      // 3. Update Registration status to CONFIRMED
      await tx.registration.update({
        where: { id: registration.id },
        data: {
          status: "CONFIRMED",
          expiresAt: null,
        },
      });

      // 4. Generate Cryptographic Passes
      const generatedPassIds: string[] = [];
      for (const item of registration.items) {
        const ticketType = await tx.ticketType.findUnique({
          where: { id: item.ticketTypeId },
        });

        for (let i = 0; i < item.quantity; i++) {
          const pass = await PassService.createPassInTx(tx, {
            eventId: registration.eventId,
            registrationId: registration.id,
            attendeeId: registration.attendeeId,
            ticketTypeName: ticketType?.name || "General Pass",
          });
          generatedPassIds.push(pass.id);
        }
      }

      return { success: true, passIds: generatedPassIds };
    });

    // Auto-send Pass & Bill email
    EmailService.sendPassAndBillEmail({ registrationId })
      .then((res) => console.log(`[Payment] Auto email confirmation dispatched:`, res.message))
      .catch((err) => console.error(`[Payment] Error dispatching email:`, err));

    return result;
  }

  static async rejectPayment(input: {
    registrationId: string;
    reason: string;
    adminId?: string;
  }): Promise<{ success: boolean; message: string }> {
    const { registrationId, reason, adminId } = input;

    await prisma.$transaction(async (tx) => {
      const registration = await tx.registration.findUnique({
        where: { id: registrationId },
        include: { items: true, payment: true },
      });

      if (!registration) {
        throw new Error("Registration not found.");
      }

      if (registration.status === "CONFIRMED") {
        throw new Error("Cannot reject an already confirmed registration.");
      }

      for (const item of registration.items) {
        const ticket = await tx.ticketType.findUnique({ where: { id: item.ticketTypeId } });
        const newReserved = Math.max(0, (ticket?.reservedCount || 0) - item.quantity);
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: {
            reservedCount: newReserved,
          },
        });
      }

      if (registration.payment) {
        await tx.payment.update({
          where: { registrationId: registration.id },
          data: {
            status: "FAILED",
            adminNotes: `Rejected: ${reason} (by ${adminId || "Admin"})`,
          },
        });
      }

      await tx.registration.update({
        where: { id: registration.id },
        data: {
          status: "CANCELLED",
        },
      });
    });

    await AuditService.log({
      adminId,
      action: "REJECT_PAYMENT",
      entityType: "Payment",
      entityId: registrationId,
      details: { reason },
    });

    return { success: true, message: "Transaction rejected and reserved inventory released." };
  }
}
