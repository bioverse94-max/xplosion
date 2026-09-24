import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/services/payment.service";
import prisma from "@/lib/db";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { paymentId, reason = "Payment reference / UTR could not be verified" } = await req.json();

    if (!paymentId) {
      return NextResponse.json({ success: false, error: "Payment ID is required." }, { status: 400 });
    }

    let operatorName = "Gate Checker / Admin";
    let adminUserId: string | undefined = undefined;
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("admin_session");
    if (sessionCookie?.value) {
      try {
        const session = await verifySession<{ id?: string; name?: string; role?: string }>(sessionCookie.value);
        if (session) {
          if (session.name) operatorName = `${session.name} (${session.role || "Admin"})`;
          if (session.id) adminUserId = session.id;
        }
      } catch {
        // Fallback
      }
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json({ success: false, error: "Payment not found." }, { status: 404 });
    }

    const result = await PaymentService.rejectPayment({
      registrationId: payment.registrationId,
      reason,
      adminId: adminUserId,
      adminName: operatorName,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Payment rejected and registration cancelled.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reject payment.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
