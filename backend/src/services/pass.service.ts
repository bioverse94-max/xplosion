import prisma from "../lib/db";
import { generatePassCode, generateRegistrationNo } from "../lib/utils";
import { generateQrToken } from "../lib/security";

export class PassService {
  static async createPassInTx(
    tx: any,
    params: {
      eventId: string;
      registrationId: string;
      attendeeId: string;
      ticketTypeName: string;
    }
  ) {
    const { eventId, registrationId, attendeeId, ticketTypeName } = params;
    const passCode = generatePassCode();
    const tempId = `pass_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const qrToken = generateQrToken(tempId, eventId);

    const pass = await tx.pass.create({
      data: {
        passCode,
        eventId,
        registrationId,
        attendeeId,
        ticketTypeName,
        qrToken,
        status: "VALID",
      },
    });

    return pass;
  }

  static async getPassesByAttendee(contactQuery: string) {
    const query = contactQuery.trim();

    return await prisma.pass.findMany({
      where: {
        OR: [
          { attendee: { email: query.toLowerCase() } },
          { attendee: { phone: query } },
          { passCode: query.toUpperCase() },
          { registration: { registrationNo: query.toUpperCase() } },
        ],
      },
      include: {
        attendee: true,
        event: true,
        registration: {
          include: { payment: true },
        },
        checkIn: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
