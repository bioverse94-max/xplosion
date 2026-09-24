import prisma from "@/lib/db";
import { PassService } from "./pass.service";
import { APP_CONFIG } from "@/lib/config";
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
  /**
   * Submits a UPI UTR / Transaction ID for a registration.
   * Performs strict anti-fraud duplication checks before recording into the database.
   */
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

    // 1. Anti-Duplication Security Check: Check if UTR is already in use by another successful/pending payment
    const existingUtrPayment = await prisma.payment.findFirst({
      where: {
        gatewayPaymentId: sanitizedUtr,
        registrationId: { not: registrationId },
        status: { in: ["SUCCESS", "PENDING_VERIFICATION", "INITIATED"] },
      },
      include: {
        registration: {
          select: { registrationNo: true },
        },
      },
    });

    if (existingUtrPayment) {
      throw new Error(
        `This Transaction ID / UTR (${sanitizedUtr}) has already been recorded in the database. Each payment reference must be unique.`
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

    // If auto-approve is enabled, directly complete payment; otherwise mark PENDING_VERIFICATION
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

    // Update or insert payment record to PENDING_VERIFICATION
    await prisma.payment.upsert({
      where: { registrationId: registration.id },
      update: {
        gatewayPaymentId: sanitizedUtr,
        paymentMethod: "UPI_QR",
        payerUpiId: payerUpiId || null,
        status: "PENDING_VERIFICATION",
        paidAt: new Date(),
        adminNotes: `Submitted at ${new Date().toISOString()}`,
      },
      create: {
        registrationId: registration.id,
        gatewayOrderId: `ord_${registration.registrationNo}`,
        gatewayPaymentId: sanitizedUtr,
        paymentMethod: "UPI_QR",
        payerUpiId: payerUpiId || null,
        status: "PENDING_VERIFICATION",
        paidAt: new Date(),
        amount: registration.totalAmount,
        currency: "INR",
        adminNotes: `Submitted at ${new Date().toISOString()}`,
      },
    });

    // Record audit log for security
    await AuditService.log({
      action: "SUBMIT_UPI_TRANSACTION",
      entityType: "Payment",
      entityId: registration.id,
      details: {
        registrationNo: registration.registrationNo,
        utr: sanitizedUtr,
        payerUpiId: payerUpiId || null,
        attendeeEmail: registration.attendee.email,
        amount: registration.totalAmount,
      },
    });

    return {
      success: true,
      status: "PENDING_VERIFICATION",
      message: "Transaction ID recorded securely in database. Pass will activate upon verification.",
    };
  }

  /**
   * Processes verified payment, transitions registration to CONFIRMED, commits ticket counts, and generates secure passes.
   */
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

      // Check for duplicate payment transaction ID
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

      // Idempotency check: If already confirmed, return existing pass IDs
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

      // 4. Generate Cryptographic Passes for each ticket item
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
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    // Automatically send Pass & Transaction Bill to attendee's registered email
    EmailService.sendPassAndBillEmail({ registrationId })
      .then((res) => console.log(`[Payment] Auto email confirmation dispatched:`, res.message))
      .catch((err) => console.error(`[Payment] Error dispatching email:`, err));

    return result;
  }

  /**
   * Rejects an unverified or fraudulent payment, releases held tickets, and cancels the registration.
   */
  static async rejectPayment(input: {
    registrationId: string;
    reason: string;
    adminId?: string;
    adminName?: string;
  }): Promise<{ success: boolean; message: string }> {
    const { registrationId, reason, adminId, adminName } = input;

    await prisma.$transaction(async (tx) => {
      const registration = await tx.registration.findUnique({
        where: { id: registrationId },
        include: { items: true, payment: true },
      });

      if (!registration) {
        throw new Error("Registration not found.");
      }

      if (registration.status === "CONFIRMED") {
        throw new Error("Cannot reject an already confirmed registration. Process a refund or revoke passes instead.");
      }

      // Revert reserved counts with floor at 0
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

      // Update payment
      if (registration.payment) {
        await tx.payment.update({
          where: { registrationId: registration.id },
          data: {
            status: "FAILED",
            adminNotes: `Rejected: ${reason} (by ${adminName || adminId || "Admin"})`,
          },
        });
      }

      // Update registration
      await tx.registration.update({
        where: { id: registration.id },
        data: {
          status: "CANCELLED",
        },
      });
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    await AuditService.log({
      adminId: adminId || undefined,
      action: "REJECT_PAYMENT",
      entityType: "Payment",
      entityId: registrationId,
      details: { reason, adminName: adminName || adminId },
    });

    return { success: true, message: "Transaction rejected and reserved inventory released." };
  }
}
