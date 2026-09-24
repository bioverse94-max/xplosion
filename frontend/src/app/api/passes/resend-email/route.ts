import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/services/email.service";
import prisma from "@/lib/db";

// In-memory rate limiting map: identifier -> { count, resetAt }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS_PER_WINDOW = 3;

function isRateLimited(key: string): { limited: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    return { limited: true, retryAfterSec };
  }

  record.count += 1;
  return { limited: false };
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const body = await req.json();
    const { contactOrRegNo } = body;

    if (!contactOrRegNo || typeof contactOrRegNo !== "string") {
      return NextResponse.json(
        { success: false, error: "Phone number, email, or registration number is required." },
        { status: 400 }
      );
    }

    const query = contactOrRegNo.trim();
    const rateLimitKey = `${ip}:${query.toLowerCase()}`;

    const limitCheck = isRateLimited(rateLimitKey);
    if (limitCheck.limited) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many resend requests. Please wait ${limitCheck.retryAfterSec} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // Find registration by registration number, attendee phone, or email
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
      return NextResponse.json(
        { success: false, error: "No confirmed registration found for this contact." },
        { status: 404 }
      );
    }

    const result = await EmailService.sendPassAndBillEmail({
      registrationId: registration.id,
    });

    return NextResponse.json({
      success: true,
      message: `Pass and itemized invoice receipt resent to ${registration.attendee.email}.`,
      data: result,
    });
  } catch (error) {
    console.error("Resend pass email error:", error);
    const msg = error instanceof Error ? error.message : "Failed to resend pass email.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
