import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        registration: {
          include: { attendee: true },
        },
        refund: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("Fetch payments error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch payments." }, { status: 500 });
  }
}
