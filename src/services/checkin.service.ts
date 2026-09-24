import prisma from "@/lib/db";
import { verifyQrToken } from "@/lib/security";
import { CheckInVerificationResult } from "@/types";
import { PassService } from "./pass.service";

export class CheckInService {
  /**
   * Cryptographically verifies an incoming QR token or pass code, prevents duplicates, and logs the check-in.
   */
  static async verifyAndCheckIn(params: {
    tokenOrCode: string;
    eventId?: string;
    operatorId?: string;
    operatorName?: string;
    gateLocation?: string;
  }): Promise<CheckInVerificationResult> {
    const { tokenOrCode, operatorId, operatorName = "Gate Scanner", gateLocation = "Main Gate" } = params;

    const trimmed = tokenOrCode.trim();

    // 1. Determine if it's an opaque QR token (v1...) or human pass code (PASS-FRS26...)
    let passRecord = null;

    if (trimmed.startsWith("v1.")) {
      // Find pass by exact token first
      passRecord = await prisma.pass.findUnique({
        where: { qrToken: trimmed },
        include: { event: true, checkIn: true },
      });

      if (passRecord) {
        const { isValid } = verifyQrToken(trimmed, passRecord.eventId);
        if (!isValid) {
          return {
            status: "INVALID",
            message: "Cryptographic signature mismatch. Possible counterfeit or tampered pass.",
          };
        }
      }
    } else {
      // Lookup by human pass code
      passRecord = await prisma.pass.findUnique({
        where: { passCode: trimmed.toUpperCase() },
        include: { event: true, checkIn: true },
      });

      // If not found by pass code, search by Registration No, Attendee Phone, College Email, or Personal Email
      if (!passRecord) {
        const registration = await prisma.registration.findFirst({
          where: {
            OR: [
              { registrationNo: trimmed.toUpperCase() },
              { attendee: { phone: trimmed } },
              { attendee: { email: trimmed.toLowerCase() } },
              { attendee: { personalEmail: trimmed.toLowerCase() } },
            ],
            status: "CONFIRMED",
          },
          include: {
            passes: {
              include: { event: true, checkIn: true },
            },
          },
        });

        if (registration && registration.passes.length > 0) {
          // Find the first non-checked-in pass if available, or first pass
          passRecord = registration.passes.find((p) => p.status === "VALID") || registration.passes[0];
        }
      }
    }

    if (!passRecord) {
      const pendingReg = await prisma.registration.findFirst({
        where: {
          OR: [
            { registrationNo: trimmed.toUpperCase() },
            { attendee: { phone: trimmed } },
            { attendee: { email: trimmed.toLowerCase() } },
            { attendee: { personalEmail: trimmed.toLowerCase() } },
          ],
        },
        include: { payment: true, attendee: true },
      });

      if (pendingReg) {
        if (pendingReg.status === "CANCELLED" || pendingReg.payment?.status === "FAILED") {
          return {
            status: "INVALID",
            message: `Registration ${pendingReg.registrationNo} was REJECTED (${pendingReg.payment?.adminNotes || "Payment unverified"}). Passes were not generated.`,
          };
        }
        return {
          status: "INVALID",
          message: `Registration ${pendingReg.registrationNo} (${pendingReg.attendee.fullName}) is awaiting payment approval (UTR: ${pendingReg.payment?.gatewayPaymentId || "Pending"}). Passes not generated yet.`,
        };
      }

      return {
        status: "INVALID",
        message: "No confirmed registration or pass found matching this identifier.",
      };
    }

    // 2. Check if pass is revoked
    if (passRecord.status === "REVOKED") {
      return {
        status: "INVALID",
        message: "This pass has been revoked or refunded by event management.",
      };
    }

    // 3. Check if already checked in
    if (passRecord.status === "CHECKED_IN" || passRecord.checkIn) {
      const fullPass = await PassService.getPassById(passRecord.id);
      return {
        status: "ALREADY_CHECKED_IN",
        message: `Pass was ALREADY USED at ${passRecord.checkIn?.checkedInAt.toLocaleTimeString("en-IN")} by ${passRecord.checkIn?.operatorName || "Door Security"}.`,
        pass: fullPass || undefined,
        checkedInAt: passRecord.checkIn?.checkedInAt.toISOString(),
        operatorName: passRecord.checkIn?.operatorName,
      };
    }

    // 4. Perform atomic check-in
    const checkInResult = await prisma.$transaction(async (tx) => {
      const freshPass = await tx.pass.findUnique({
        where: { id: passRecord!.id },
        include: { checkIn: true },
      });

      if (!freshPass || freshPass.status === "CHECKED_IN" || freshPass.checkIn) {
        return {
          status: "ALREADY_CHECKED_IN" as const,
          message: `Pass was ALREADY USED at ${freshPass?.checkIn?.checkedInAt.toLocaleTimeString("en-IN") || "door"}.`,
          checkedInAt: freshPass?.checkIn?.checkedInAt.toISOString(),
          operatorName: freshPass?.checkIn?.operatorName,
        };
      }

      // Update pass status
      await tx.pass.update({
        where: { id: passRecord!.id },
        data: { status: "CHECKED_IN" },
      });

      // Create check-in entry
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

      // Log to audit log
      await tx.auditLog.create({
        data: {
          adminId: operatorId || null,
          action: "PASS_CHECKIN_VERIFIED",
          entityType: "Pass",
          entityId: passRecord!.id,
          detailsJson: JSON.stringify({
            passCode: passRecord!.passCode,
            gate: gateLocation,
            operator: operatorName,
          }),
        },
      });

      return {
        status: "VALID" as const,
        checkedInAt: checkIn.checkedInAt.toISOString(),
        operatorName: checkIn.operatorName,
      };
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    // If the transaction returned ALREADY_CHECKED_IN, return it directly
    if (checkInResult.status === "ALREADY_CHECKED_IN") {
      return checkInResult as CheckInVerificationResult;
    }

    // Fetch full pass data outside the transaction for the VALID response
    const fullPass = await PassService.getPassById(passRecord.id);

    return {
      status: "VALID",
      message: "Pass verified successfully. Welcome to XPLOSION 2K26!",
      pass: fullPass || undefined,
      checkedInAt: checkInResult.checkedInAt,
      operatorName: checkInResult.operatorName,
    };
  }
}
