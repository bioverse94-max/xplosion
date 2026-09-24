import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PaymentService } from "@/services/payment.service";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const SubmitUtrSchema = z.object({
  registrationId: z.string().min(1, "Registration ID is required"),
  utrNumber: z
    .string()
    .min(6, "Transaction ID / UTR must be at least 6 characters")
    .max(30, "Transaction ID is too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Transaction ID can only contain alphanumeric characters"),
  payerUpiId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipLimit = checkRateLimit(`utr_submit_${ip}`, {
      limit: 10,
      windowSeconds: 600,
    });

    if (!ipLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many payment submissions from this network. Please wait ${ipLimit.resetInSeconds} seconds.`,
        },
        { status: 429, headers: { "Retry-After": String(ipLimit.resetInSeconds) } }
      );
    }

    const body = await req.json();
    const validated = SubmitUtrSchema.parse(body);

    const result = await PaymentService.submitUpiPayment({
      registrationId: validated.registrationId,
      utrNumber: validated.utrNumber,
      payerUpiId: validated.payerUpiId,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to record payment transaction.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
