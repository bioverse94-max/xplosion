import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { paymentId, reason = "Requested by attendee / Admin discretion" } = await req.json();

    if (!paymentId) {
      return NextResponse.json({ success: false, error: "Payment ID is required" }, { status: 400 });
    }

    let operatorName = "Super Admin";
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("admin_session");
    if (sessionCookie?.value) {
      try {
        const session = await verifySession<{ name?: string }>(sessionCookie.value);
        if (session?.name) {
          operatorName = session.name;
        }
      } catch {
        // Fallback
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { registration: { include: { items: true, passes: true } } },
      });

      if (!payment) throw new Error("Payment record not found.");
      if (payment.status === "REFUNDED") throw new Error("This payment has already been refunded.");

      // 1. Create Refund record
      const refund = await tx.refund.create({
        data: {
          paymentId: payment.id,
          refundAmount: payment.amount,
          reason,
          processedBy: operatorName,
        },
      });

      // 2. Update Payment Status
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED" },
      });

      // 3. Update Registration Status
      await tx.registration.update({
        where: { id: payment.registrationId },
        data: { status: "CANCELLED" },
      });

      // 4. Revoke Passes
      await tx.pass.updateMany({
        where: { registrationId: payment.registrationId },
        data: { status: "REVOKED" },
      });

      // 5. Restore ticket inventory
      for (const item of payment.registration.items) {
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: {
            soldCount: { decrement: item.quantity },
          },
        });
      }

      // 6. Audit Log
      await tx.auditLog.create({
        data: {
          action: "PAYMENT_REFUND_PROCESSED",
          entityType: "Payment",
          entityId: payment.id,
          detailsJson: JSON.stringify({ amount: payment.amount, reason, processedBy: operatorName }),
        },
      });

      return refund;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Refund processed successfully and passes revoked.",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Refund processing failed.";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
