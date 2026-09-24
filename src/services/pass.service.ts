import prisma from "@/lib/db";
import { generatePassCode } from "@/lib/utils";
import { generateQrVerificationToken } from "@/lib/security";
import { DigitalPassDTO } from "@/types";
import { Prisma } from "@prisma/client";

export class PassService {
  /**
   * Helper to create a single digital pass inside an active Prisma transaction.
   */
  static async createPassInTx(
    tx: Prisma.TransactionClient,
    data: {
      eventId: string;
      registrationId: string;
      attendeeId: string;
      ticketTypeName: string;
    }
  ) {
    const passId = `pass_${Math.random().toString(36).substring(2, 12)}`;
    const passCode = generatePassCode();
    const qrToken = generateQrVerificationToken(passId, data.eventId);

    return await tx.pass.create({
      data: {
        id: passId,
        passCode,
        eventId: data.eventId,
        registrationId: data.registrationId,
        attendeeId: data.attendeeId,
        ticketTypeName: data.ticketTypeName,
        qrToken,
        status: "VALID",
      },
    });
  }

  /**
   * Retrieves passes by attendee email or phone number for /my-pass portal.
   */
  static async getPassesByContact(contact: string): Promise<DigitalPassDTO[]> {
    const cleanContact = contact.trim().toLowerCase();

    const passes = await prisma.pass.findMany({
      where: {
        OR: [
          { attendee: { email: cleanContact } },
          { attendee: { personalEmail: cleanContact } },
          { attendee: { phone: cleanContact } },
          { passCode: contact.trim().toUpperCase() },
        ],
      },
      include: {
        event: true,
        attendee: true,
        registration: true,
        checkIn: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return passes.map((p) => ({
      id: p.id,
      passCode: p.passCode,
      eventTitle: p.event.title,
      eventDate: p.event.date.toISOString(),
      doorsOpenTime: p.event.doorsOpenTime,
      venueName: p.event.venueName,
      venueAddress: p.event.venueAddress,
      attendeeName: p.attendee.fullName,
      attendeeEmail: p.attendee.email,
      attendeePersonalEmail: p.attendee.personalEmail,
      attendeePhone: p.attendee.phone,
      college: p.attendee.college,
      academicYear: p.attendee.academicYear,
      branch: p.attendee.branch,
      ticketTypeName: p.ticketTypeName,
      registrationNo: p.registration.registrationNo,
      qrToken: p.qrToken,
      status: p.status as "VALID" | "CHECKED_IN" | "REVOKED",
      checkedInAt: p.checkIn?.checkedInAt?.toISOString() || null,
      checkedInBy: p.checkIn?.operatorName || null,
    }));
  }

  /**
   * Retrieves a single pass by passId
   */
  static async getPassById(passId: string): Promise<DigitalPassDTO | null> {
    const p = await prisma.pass.findUnique({
      where: { id: passId },
      include: {
        event: true,
        attendee: true,
        registration: true,
        checkIn: true,
      },
    });

    if (!p) return null;

    return {
      id: p.id,
      passCode: p.passCode,
      eventTitle: p.event.title,
      eventDate: p.event.date.toISOString(),
      doorsOpenTime: p.event.doorsOpenTime,
      venueName: p.event.venueName,
      venueAddress: p.event.venueAddress,
      attendeeName: p.attendee.fullName,
      attendeeEmail: p.attendee.email,
      attendeePersonalEmail: p.attendee.personalEmail,
      attendeePhone: p.attendee.phone,
      college: p.attendee.college,
      academicYear: p.attendee.academicYear,
      branch: p.attendee.branch,
      ticketTypeName: p.ticketTypeName,
      registrationNo: p.registration.registrationNo,
      qrToken: p.qrToken,
      status: p.status as "VALID" | "CHECKED_IN" | "REVOKED",
      checkedInAt: p.checkIn?.checkedInAt?.toISOString() || null,
      checkedInBy: p.checkIn?.operatorName || null,
    };
  }
}

