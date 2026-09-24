import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      totalRegistrations,
      confirmedRegistrations,
      pendingRegistrations,
      totalPasses,
      checkedInPasses,
      ticketTypes,
      payments,
      recentCheckIns,
    ] = await Promise.all([
      prisma.registration.count(),
      prisma.registration.count({ where: { status: "CONFIRMED" } }),
      prisma.registration.count({ where: { status: "PENDING" } }),
      prisma.pass.count(),
      prisma.checkIn.count(),
      prisma.ticketType.findMany({ select: { name: true, tierCode: true, capacity: true, soldCount: true, price: true } }),
      prisma.payment.findMany({ where: { status: "SUCCESS" }, select: { amount: true } }),
      prisma.checkIn.findMany({
        take: 10,
        orderBy: { checkedInAt: "desc" },
        include: { pass: { include: { attendee: true } } },
      }),
    ]);

    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalCapacity = ticketTypes.reduce((acc, t) => acc + t.capacity, 0);
    const totalSold = ticketTypes.reduce((acc, t) => acc + t.soldCount, 0);
    const ticketsRemaining = Math.max(0, totalCapacity - totalSold);
    const checkInRatePercent = totalPasses > 0 ? Math.round((checkedInPasses / totalPasses) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalRegistrations,
        confirmedRegistrations,
        pendingRegistrations,
        totalPasses,
        checkedInPasses,
        totalRevenue,
        totalCapacity,
        totalSold,
        ticketsRemaining,
        checkInRatePercent,
        ticketTypes,
        recentCheckIns: recentCheckIns.map((c) => ({
          id: c.id,
          attendeeName: c.pass.attendee.fullName,
          ticketTypeName: c.pass.ticketTypeName,
          passCode: c.pass.passCode,
          operatorName: c.operatorName,
          gateLocation: c.gateLocation,
          checkedInAt: c.checkedInAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ success: false, error: "Failed to calculate analytics." }, { status: 500 });
  }
}
