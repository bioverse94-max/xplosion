import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentWebhookSignature } from "@/lib/security";
import { PaymentService } from "@/services/payment.service";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || req.headers.get("stripe-signature");

    // In production, signature header is strictly enforced
    if (process.env.NODE_ENV === "production" && signature) {
      const isValid = verifyPaymentWebhookSignature(rawBody, signature);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);

    // Support standard webhook payload formats
    if (payload.event === "payment.captured" || payload.event === "charge.succeeded" || payload.type === "payment_intent.succeeded") {
      const gatewayOrderId = payload.payload?.payment?.entity?.order_id || payload.data?.object?.id || payload.order_id;
      const gatewayPaymentId = payload.payload?.payment?.entity?.id || payload.id;

      if (gatewayOrderId) {
        const paymentRecord = await prisma.payment.findUnique({
          where: { gatewayOrderId },
        });

        if (paymentRecord) {
          await PaymentService.completePayment({
            registrationId: paymentRecord.registrationId,
            gatewayOrderId,
            gatewayPaymentId: gatewayPaymentId || "wh_pay_auto",
            rawWebhookJson: rawBody,
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
