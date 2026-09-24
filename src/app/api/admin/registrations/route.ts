import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const registrations = await prisma.registration.findMany({
      include: {
        attendee: true,
        items: { include: { ticketType: true } },
        payment: true,
        passes: { include: { checkIn: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: registrations,
      count: registrations.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Fetch registrations error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch registrations." },
      { status: 500 }
    );
  }
}
