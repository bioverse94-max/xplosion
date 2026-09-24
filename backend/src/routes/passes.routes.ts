import { Router, Request, Response } from "express";
import prisma from "../lib/db";
import { PassService } from "../services/pass.service";
import { EmailService } from "../services/email.service";

const router = Router();

// Lookup passes by Phone, Email, or Reg No
router.post("/my-pass", async (req: Request, res: Response) => {
  try {
    const { contact } = req.body;
    if (!contact || typeof contact !== "string") {
      return res.status(400).json({ success: false, error: "Contact parameter is required." });
    }

    const query = contact.trim();
    const passes = await PassService.getPassesByAttendee(query);

    if (passes.length > 0) {
      const data = passes.map((p) => ({
        id: p.id,
        passCode: p.passCode,
        attendeeName: p.attendee.fullName,
        college: p.attendee.college,
        academicYear: p.attendee.academicYear,
        branch: p.attendee.branch,
        ticketTypeName: p.ticketTypeName,
        qrToken: p.qrToken,
        status: p.status,
        eventTitle: p.event.title,
        venueName: p.event.venueName,
        venueAddress: p.event.venueAddress,
        city: p.event.city,
        date: p.event.date,
        doorsOpenTime: p.event.doorsOpenTime,
        rules: JSON.parse(p.event.rulesJson || "[]"),
        registrationNo: p.registration.registrationNo,
        amount: p.registration.payment?.amount || 0,
        paymentStatus: p.registration.payment?.status || "SUCCESS",
        isCheckedIn: !!p.checkIn,
        checkedInAt: p.checkIn?.checkedInAt,
      }));

      return res.json({ success: true, data });
    }

    // Check if registration exists but pending
    const pendingRegistration = await prisma.registration.findFirst({
      where: {
        OR: [
          { attendee: { email: query.toLowerCase() } },
          { attendee: { phone: query } },
          { registrationNo: query.toUpperCase() },
        ],
      },
      include: { payment: true },
      orderBy: { createdAt: "desc" },
    });

    if (pendingRegistration) {
      return res.json({
        success: true,
        data: [],
        pendingRegistration: {
          registrationNo: pendingRegistration.registrationNo,
          status: pendingRegistration.status,
          totalAmount: pendingRegistration.totalAmount,
          paymentStatus: pendingRegistration.payment?.status || "PENDING",
          utr: pendingRegistration.payment?.gatewayPaymentId,
        },
      });
    }

    return res.json({ success: true, data: [] });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error fetching passes.";
    return res.status(500).json({ success: false, error: msg });
  }
});

// In-memory rate limiting map: identifier -> { count, resetAt }
const resendRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RESEND_RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes
const MAX_RESEND_ATTEMPTS = 3;

// Resend Pass & Bill Email
router.post("/resend-email", async (req: Request, res: Response) => {
  try {
    const { contactOrRegNo } = req.body;
    if (!contactOrRegNo) {
      return res.status(400).json({ success: false, error: "Identifier required." });
    }

    const query = String(contactOrRegNo).trim();
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "client";
    const rateLimitKey = `${clientIp}:${query.toLowerCase()}`;
    const now = Date.now();
    const rateRecord = resendRateLimitMap.get(rateLimitKey);

    if (rateRecord && now <= rateRecord.resetAt) {
      if (rateRecord.count >= MAX_RESEND_ATTEMPTS) {
        const retryAfter = Math.ceil((rateRecord.resetAt - now) / 1000);
        return res.status(429).json({
          success: false,
          error: `Too many resend requests. Please wait ${retryAfter} seconds before trying again.`,
        });
      }
      rateRecord.count += 1;
    } else {
      resendRateLimitMap.set(rateLimitKey, { count: 1, resetAt: now + RESEND_RATE_LIMIT_MS });
    }

    const registration = await prisma.registration.findFirst({
      where: {
        OR: [
          { registrationNo: query.toUpperCase() },
          { attendee: { phone: query } },
          { attendee: { email: query.toLowerCase() } },
        ],
        status: "CONFIRMED",
      },
      include: { attendee: true },
    });

    if (!registration) {
      return res.status(404).json({ success: false, error: "No confirmed registration found." });
    }

    const result = await EmailService.sendPassAndBillEmail({
      registrationId: registration.id,
    });

    return res.json({
      success: true,
      message: `Pass & Transaction Bill sent to ${registration.attendee.email}.`,
      data: result,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to resend pass.";
    return res.status(500).json({ success: false, error: msg });
  }
});

export default router;
