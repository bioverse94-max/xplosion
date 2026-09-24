import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/services/payment.service";
import prisma from "@/lib/db";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { paymentId, adminNotes } = await req.json();

    if (!paymentId) {
      return NextResponse.json({ success: false, error: "Payment ID is required." }, { status: 400 });
    }

    let operatorName = "Gate Checker / Admin";
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("admin_session");
    if (sessionCookie?.value) {
      try {
        const session = await verifySession<{ name?: string; role?: string }>(sessionCookie.value);
        if (session?.name) {
          operatorName = `${session.name} (${session.role || "Admin"})`;
        }
      } catch {
        // Fallback to default
      }
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json({ success: false, error: "Payment not found." }, { status: 404 });
    }

    const result = await PaymentService.completePayment({
      registrationId: payment.registrationId,
      gatewayOrderId: payment.gatewayOrderId,
      gatewayPaymentId: payment.gatewayPaymentId || `pay_manual_${Date.now()}`,
      gatewaySignature: "ADMIN_APPROVED_VERIFIED_SIGNATURE",
      verifiedBy: operatorName,
      adminNotes: adminNotes || `Verified and approved by ${operatorName}`,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Payment successfully verified and passes issued.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to approve payment.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
