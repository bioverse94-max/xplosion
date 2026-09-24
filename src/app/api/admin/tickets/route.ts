import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tickets = await prisma.ticketType.findMany({
      include: { event: { select: { title: true } } },
      orderBy: { price: "asc" },
    });
    return NextResponse.json({ success: true, data: tickets });
  } catch (error) {
    console.error("Error fetching admin tickets:", error);
    return NextResponse.json({ success: false, error: "Failed to load ticket tiers" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, price, capacity, isVisible } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Ticket ID is required" }, { status: 400 });
    }

    const updated = await prisma.ticketType.update({
      where: { id },
      data: {
        ...(price !== undefined && { price: Number(price) }),
        ...(capacity !== undefined && { capacity: Number(capacity) }),
        ...(isVisible !== undefined && { isVisible: Boolean(isVisible) }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json({ success: false, error: "Failed to update ticket" }, { status: 500 });
  }
}
