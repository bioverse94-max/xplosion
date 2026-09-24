import prisma from "@/lib/db";
import { CheckoutReservationInput, CheckoutReservationResult } from "@/types";
import { generateRegistrationNo } from "@/lib/utils";
import { APP_CONFIG } from "@/lib/config";
import { OtpService } from "./otp.service";

export class TicketService {
  /**
   * Atomically reserves ticket inventory and generates a pending registration with a 10-minute hold window.
   */
  static async reserveTickets(input: CheckoutReservationInput): Promise<CheckoutReservationResult> {
    const { eventId, attendee, items } = input;

    if (!items || items.length === 0) {
      throw new Error("At least one ticket must be selected.");
    }

    // Trigger cleanup of expired reservations asynchronously in the background so it never slows down checkout
    this.cleanupExpiredReservations().catch((e) => console.warn("[TicketService] Background cleanup warning:", e));

    // 1. Verify event status outside the transaction
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event || !event.isActive) {
      throw new Error("Event is not currently active for ticket sales.");
    }

    // 2. Validate Phone & Enforce OTP Verification
    const phoneCheck = OtpService.normalizeTarget(attendee.phone, "PHONE");
    if (!phoneCheck.isValid) {
      throw new Error(phoneCheck.error || "Please enter a valid 10-digit Indian mobile number.");
    }
    const cleanPhone = phoneCheck.normalized;

    if (!attendee.phoneVerificationToken) {
      throw new Error("Mobile phone OTP verification is required. Please verify your 10-digit mobile number before reserving passes.");
    }
    const isPhoneTokenValid = OtpService.validateProofToken(cleanPhone, "PHONE", attendee.phoneVerificationToken);
    if (!isPhoneTokenValid) {
      throw new Error("Phone OTP verification has expired or is invalid. Please verify your mobile number again.");
    }
    const isPhoneVerified = true;

    // Validate Personal Email (Mandatory for pass delivery & receipts)
    if (!attendee.personalEmail || !attendee.personalEmail.trim()) {
      throw new Error("Personal email address is required for digital pass delivery and tax invoices.");
    }
    const emailCheck = OtpService.normalizeTarget(attendee.personalEmail, "EMAIL");
    if (!emailCheck.isValid) {
      throw new Error(emailCheck.error || "Please enter a valid personal email address (e.g. name@gmail.com).");
    }
    const cleanPersonalEmail = emailCheck.normalized;

    // Optional email verification proof token
    let isEmailVerified = false;
    if (attendee.emailVerificationToken) {
      const isEmailTokenValid = OtpService.validateProofToken(cleanPersonalEmail, "EMAIL", attendee.emailVerificationToken);
      if (isEmailTokenValid) {
        isEmailVerified = true;
      }
    }

    const cleanEmail = attendee.email.trim().toLowerCase();

    const existingByEmail = await prisma.attendee.findUnique({ where: { email: cleanEmail } });
    const existingByPhone = await prisma.attendee.findUnique({ where: { phone: cleanPhone } });

    if (existingByEmail && existingByPhone && existingByEmail.id !== existingByPhone.id) {
      throw new Error("The provided email and phone number belong to different registered accounts. Please verify your details.");
    }

    const existingAttendee = existingByEmail || existingByPhone;
    let attendeeRecord;

    if (existingAttendee) {
      attendeeRecord = await prisma.attendee.update({
        where: { id: existingAttendee.id },
        data: {
          fullName: attendee.fullName.trim(),
          email: cleanEmail,
          personalEmail: cleanPersonalEmail,
          phone: cleanPhone,
          phoneVerified: true,
          emailVerified: isEmailVerified || existingAttendee.emailVerified,
          college: attendee.college.trim(),
          academicYear: attendee.academicYear.trim(),
          branch: attendee.branch.trim(),
        },
      });
    } else {
      attendeeRecord = await prisma.attendee.create({
        data: {
          fullName: attendee.fullName.trim(),
          email: cleanEmail,
          personalEmail: cleanPersonalEmail,
          phone: cleanPhone,
          phoneVerified: true,
          emailVerified: isEmailVerified,
          college: attendee.college.trim(),
          academicYear: attendee.academicYear.trim(),
          branch: attendee.branch.trim(),
        },
      });
    }

    // 3. Execute atomic inventory hold and registration creation with extended timeout for pooled cloud database
    return await prisma.$transaction(
      async (tx) => {
        let subtotal = 0;
        const verifiedItems: Array<{ ticketTypeId: string; quantity: number; unitPrice: number; subtotal: number }> = [];

        for (const item of items) {
          if (item.quantity <= 0) continue;

          const ticketType = await tx.ticketType.findUnique({
            where: { id: item.ticketTypeId },
          });

          if (!ticketType || !ticketType.isVisible) {
            throw new Error(`Invalid ticket tier selected.`);
          }

          const available = ticketType.capacity - (ticketType.soldCount + ticketType.reservedCount);
          if (available < item.quantity) {
            throw new Error(`Sorry, only ${Math.max(0, available)} ticket(s) remaining for ${ticketType.name}.`);
          }

          if (item.quantity > ticketType.maxPerOrder) {
            throw new Error(`Cannot purchase more than ${ticketType.maxPerOrder} tickets for ${ticketType.name}.`);
          }

          // Atomically increment reservedCount
          await tx.ticketType.update({
            where: { id: ticketType.id },
            data: {
              reservedCount: { increment: item.quantity },
            },
          });

          const itemSubtotal = ticketType.price * item.quantity;
          subtotal += itemSubtotal;
          verifiedItems.push({
            ticketTypeId: ticketType.id,
            quantity: item.quantity,
            unitPrice: ticketType.price,
            subtotal: itemSubtotal,
          });
        }

        if (verifiedItems.length === 0) {
          throw new Error("No valid ticket quantities selected.");
        }

        // Calculate total amount & reservation expiration (10 minutes)
        const expiresAt = new Date(Date.now() + APP_CONFIG.reservationHoldMinutes * 60 * 1000);
        const totalAmount = subtotal + APP_CONFIG.platformFeeINR;
        const registrationNo = generateRegistrationNo();
        const mockGatewayOrderId = `order_${Math.random().toString(36).substring(2, 12)}`;

        // Create Registration, Items, and Initiated Payment
        const registration = await tx.registration.create({
          data: {
            registrationNo,
            eventId: event.id,
            attendeeId: attendeeRecord.id,
            status: "PENDING",
            subtotal,
            platformFee: APP_CONFIG.platformFeeINR,
            taxAmount: 0,
            totalAmount,
            currency: "INR",
            expiresAt,
            items: {
              create: verifiedItems.map((it) => ({
                ticketTypeId: it.ticketTypeId,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                subtotal: it.subtotal,
              })),
            },
            payment: {
              create: {
                gatewayOrderId: mockGatewayOrderId,
                amount: totalAmount,
                currency: "INR",
                status: "INITIATED",
              },
            },
          },
        });

        return {
          registrationId: registration.id,
          registrationNo: registration.registrationNo,
          totalAmount,
          currency: "INR",
          expiresAt: expiresAt.toISOString(),
          gatewayOrderId: mockGatewayOrderId,
          paymentProvider: APP_CONFIG.paymentProvider,
        };
      },
      {
        maxWait: 15000,
        timeout: 30000,
      }
    );
  }

  /**
   * Reclaims expired ticket holds (status PENDING with past expiresAt) and releases reservedCount.
   */
  static async cleanupExpiredReservations(): Promise<number> {
    const now = new Date();
    const expiredRegs = await prisma.registration.findMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      include: { items: true },
      take: 25,
    });

    if (expiredRegs.length === 0) return 0;

    for (const reg of expiredRegs) {
      try {
        await prisma.$transaction(
          async (tx) => {
            const current = await tx.registration.findUnique({ where: { id: reg.id } });
            if (current?.status !== "PENDING") return;

            for (const item of reg.items) {
              const ticket = await tx.ticketType.findUnique({ where: { id: item.ticketTypeId } });
              const newReserved = Math.max(0, (ticket?.reservedCount || 0) - item.quantity);
              await tx.ticketType.update({
                where: { id: item.ticketTypeId },
                data: {
                  reservedCount: newReserved,
                },
              });
            }

            await tx.registration.update({
              where: { id: reg.id },
              data: { status: "EXPIRED" },
            });
          },
          {
            maxWait: 15000,
            timeout: 25000,
          }
        );
      } catch (err) {
        console.error(`[TicketService] Error expiring reservation ${reg.registrationNo}:`, err);
      }
    }

    return expiredRegs.length;
  }
}
