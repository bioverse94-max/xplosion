import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PaymentService } from "@/services/payment.service";

const VerifyPaymentSchema = z.object({
  registrationId: z.string().min(1),
  gatewayOrderId: z.string().min(1),
  gatewayPaymentId: z.string().min(1),
  gatewaySignature: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = VerifyPaymentSchema.parse(body);

    const result = await PaymentService.completePayment({
      registrationId: validatedData.registrationId,
      gatewayOrderId: validatedData.gatewayOrderId,
      gatewayPaymentId: validatedData.gatewayPaymentId,
      gatewaySignature: validatedData.gatewaySignature || "MOCK_VERIFIED_SIGNATURE",
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Payment successfully verified and passes issued.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment verification failed.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
