import prisma from "../lib/db";
import { generateRegistrationNo } from "../lib/utils";
import { APP_CONFIG } from "../lib/config";

export interface ReservationItem {
  ticketTypeId: string;
  quantity: number;
}

export interface AttendeeInput {
  fullName: string;
  email: string;
  phone: string;
  college: string;
  academicYear: string;
  branch: string;
}

export class TicketService {
  static async reserveTickets(params: {
    eventId: string;
    attendee: AttendeeInput;
    items: ReservationItem[];
  }) {
    const { eventId, attendee, items } = params;

    if (!items || items.length === 0) {
      throw new Error("At least one ticket must be selected.");
    }

    // Proactively reclaim expired reserved holds
    await this.cleanupExpiredReservations().catch((e) => console.warn("Cleanup warning:", e));

    return await prisma.$transaction(async (tx) => {
      // 0. Verify event status
      const event = await tx.event.findUnique({
        where: { id: eventId },
      });
      if (!event || !event.isActive) {
        throw new Error("Event is not currently active for ticket sales.");
      }

      // 1. Check ticket availability
      let subtotal = 0;
      const verifiedItems: Array<{ ticketTypeId: string; quantity: number; unitPrice: number; subtotal: number }> = [];

      for (const item of items) {
        if (item.quantity <= 0) continue;

        const ticketType = await tx.ticketType.findUnique({
          where: { id: item.ticketTypeId },
        });

        if (!ticketType || !ticketType.isVisible) {
          throw new Error(`Ticket type not found.`);
        }

        const available = ticketType.capacity - ticketType.soldCount - ticketType.reservedCount;
        if (available < item.quantity) {
          throw new Error(`Insufficient tickets for ${ticketType.name}. Remaining: ${Math.max(0, available)}`);
        }

        if (item.quantity > ticketType.maxPerOrder) {
          throw new Error(`Cannot purchase more than ${ticketType.maxPerOrder} tickets for ${ticketType.name}.`);
        }

        const itemSubtotal = ticketType.price * item.quantity;
        subtotal += itemSubtotal;

        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: {
            reservedCount: { increment: item.quantity },
          },
        });

        verifiedItems.push({
          ticketTypeId: ticketType.id,
          quantity: item.quantity,
          unitPrice: ticketType.price,
          subtotal: itemSubtotal,
        });
      }

      // 2. Safe find or create attendee
      const cleanEmail = attendee.email.toLowerCase().trim();
      const cleanPhone = attendee.phone.trim();

      const existingByEmail = await tx.attendee.findUnique({ where: { email: cleanEmail } });
      const existingByPhone = await tx.attendee.findUnique({ where: { phone: cleanPhone } });

      if (existingByEmail && existingByPhone && existingByEmail.id !== existingByPhone.id) {
        throw new Error("The provided email and phone number belong to different registered accounts. Please verify your details.");
      }

      const existingAttendee = existingByEmail || existingByPhone;
      let attendeeRecord;

      if (existingAttendee) {
        attendeeRecord = await tx.attendee.update({
          where: { id: existingAttendee.id },
          data: {
            fullName: attendee.fullName.trim(),
            email: cleanEmail,
            phone: cleanPhone,
            college: attendee.college.trim(),
            academicYear: attendee.academicYear,
            branch: attendee.branch.trim(),
          },
        });
      } else {
        attendeeRecord = await tx.attendee.create({
          data: {
            fullName: attendee.fullName.trim(),
            email: cleanEmail,
            phone: cleanPhone,
            college: attendee.college.trim(),
            academicYear: attendee.academicYear,
            branch: attendee.branch.trim(),
          },
        });
      }

      // 3. Create registration
      const registrationNo = generateRegistrationNo();
      const expiresAt = new Date(Date.now() + APP_CONFIG.reservationHoldMinutes * 60 * 1000);
      const totalAmount = subtotal;

      const registration = await tx.registration.create({
        data: {
          registrationNo,
          eventId,
          attendeeId: attendeeRecord.id,
          status: "PENDING",
          subtotal,
          totalAmount,
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
              gatewayOrderId: `ord_${registrationNo}`,
              amount: totalAmount,
              status: "INITIATED",
            },
          },
        },
        include: {
          payment: true,
          attendee: true,
        },
      });

      return registration;
    });
  }

  static async cleanupExpiredReservations(): Promise<number> {
    const now = new Date();
    const expiredRegs = await prisma.registration.findMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      include: { items: true },
      take: 50,
    });

    if (expiredRegs.length === 0) return 0;

    for (const reg of expiredRegs) {
      try {
        await prisma.$transaction(async (tx) => {
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
        });
      } catch (err) {
        console.error(`[TicketService] Error expiring reservation ${reg.registrationNo}:`, err);
      }
    }

    return expiredRegs.length;
  }
}
