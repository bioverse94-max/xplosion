import prisma from "../lib/db";
import { verifyQrToken } from "../lib/security";

export class CheckInService {
  static async verifyAndCheckIn(params: {
    tokenOrCode: string;
    operatorId?: string;
    operatorName?: string;
    gateLocation?: string;
  }) {
    const { tokenOrCode, operatorId, operatorName = "Gate Scanner", gateLocation = "Main Gate" } = params;
    const trimmed = tokenOrCode.trim();

    let passRecord = null;

    if (trimmed.startsWith("v1.")) {
      passRecord = await prisma.pass.findUnique({
        where: { qrToken: trimmed },
        include: { event: true, checkIn: true, attendee: true },
      });

      if (passRecord) {
        const { isValid } = verifyQrToken(trimmed, passRecord.eventId);
        if (!isValid) {
          return { status: "INVALID", message: "Cryptographic signature mismatch." };
        }
      }
    } else {
      passRecord = await prisma.pass.findUnique({
        where: { passCode: trimmed.toUpperCase() },
        include: { event: true, checkIn: true, attendee: true },
      });

      if (!passRecord) {
        const registration = await prisma.registration.findFirst({
          where: {
            OR: [
              { registrationNo: trimmed.toUpperCase() },
              { attendee: { phone: trimmed } },
              { attendee: { email: trimmed.toLowerCase() } },
            ],
            status: "CONFIRMED",
          },
          include: {
            passes: { include: { event: true, checkIn: true, attendee: true } },
          },
        });

        if (registration && registration.passes.length > 0) {
          passRecord = registration.passes.find((p) => p.status === "VALID") || registration.passes[0];
        }
      }
    }

    if (!passRecord) {
      return { status: "INVALID", message: "No confirmed pass found in database." };
    }

    if (passRecord.status === "REVOKED") {
      return { status: "INVALID", message: "This pass has been revoked." };
    }

    if (passRecord.status === "CHECKED_IN" || passRecord.checkIn) {
      return {
        status: "ALREADY_CHECKED_IN",
        message: `Pass ALREADY USED at ${passRecord.checkIn?.checkedInAt.toLocaleTimeString("en-IN")}.`,
        pass: {
          passCode: passRecord.passCode,
          attendeeName: passRecord.attendee.fullName,
          ticketTypeName: passRecord.ticketTypeName,
          college: passRecord.attendee.college,
        },
      };
    }

    const checkInResult = await prisma.$transaction(async (tx) => {
      const freshPass = await tx.pass.findUnique({
        where: { id: passRecord!.id },
        include: { checkIn: true },
      });

      if (!freshPass || freshPass.status === "CHECKED_IN" || freshPass.checkIn) {
        return {
          status: "ALREADY_CHECKED_IN" as const,
          message: `Pass ALREADY USED at ${freshPass?.checkIn?.checkedInAt.toLocaleTimeString("en-IN") || "door"}.`,
          pass: {
            passCode: passRecord!.passCode,
            attendeeName: passRecord!.attendee.fullName,
            ticketTypeName: passRecord!.ticketTypeName,
            college: passRecord!.attendee.college,
          },
        };
      }

      await tx.pass.update({
        where: { id: passRecord!.id },
        data: { status: "CHECKED_IN" },
      });

      const checkIn = await tx.checkIn.create({
        data: {
          passId: passRecord!.id,
          eventId: passRecord!.eventId,
          operatorId: operatorId || null,
          operatorName,
          gateLocation,
          checkedInAt: new Date(),
        },
      });

      return {
        status: "VALID" as const,
        message: "Pass checked in successfully.",
        pass: {
          passCode: passRecord!.passCode,
          attendeeName: passRecord!.attendee.fullName,
          ticketTypeName: passRecord!.ticketTypeName,
          college: passRecord!.attendee.college,
        },
      };
    });

    return checkInResult;
  }
}
