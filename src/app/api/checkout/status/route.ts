import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const regId = req.nextUrl.searchParams.get("regId");
    const regNo = req.nextUrl.searchParams.get("regNo");

    if (!regId && !regNo) {
      return NextResponse.json(
        { success: false, error: "Registration ID or Registration Number is required." },
        { status: 400 }
      );
    }

    const registration = await prisma.registration.findFirst({
      where: regId ? { id: regId } : { registrationNo: regNo?.toUpperCase() },
      include: {
        attendee: true,
        payment: true,
        event: true,
        items: {
          include: { ticketType: true },
        },
        passes: {
          include: {
            checkIn: true,
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, error: "Registration record not found." },
        { status: 404 }
      );
    }

    const formattedPasses = registration.passes.map((p) => ({
      id: p.id,
      passCode: p.passCode,
      eventTitle: registration.event.title || "XPLOSION 2K26",
      eventDate: registration.event.date.toISOString(),
      doorsOpenTime: registration.event.doorsOpenTime || "12:00 PM Onwards",
      venueName: registration.event.venueName || "Reborn Club & Kitchen",
      venueAddress: registration.event.venueAddress || "Outer Ring Road, Bhubaneswar",
      attendeeName: registration.attendee.fullName,
      attendeeEmail: registration.attendee.email,
      attendeePhone: registration.attendee.phone,
      college: registration.attendee.college,
      academicYear: registration.attendee.academicYear,
      branch: registration.attendee.branch,
      ticketTypeName: p.ticketTypeName,
      registrationNo: registration.registrationNo,
      qrToken: p.qrToken,
      status: p.status,
      checkedInAt: p.checkIn?.checkedInAt?.toISOString() || null,
      checkedInBy: p.checkIn?.operatorName || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        registrationId: registration.id,
        registrationNo: registration.registrationNo,
        status: registration.status,
        totalAmount: registration.totalAmount,
        expiresAt: registration.expiresAt?.toISOString() || null,
        attendee: {
          fullName: registration.attendee.fullName,
          email: registration.attendee.email,
          phone: registration.attendee.phone,
          college: registration.attendee.college,
          branch: registration.attendee.branch,
        },
        payment: registration.payment
          ? {
              id: registration.payment.id,
              status: registration.payment.status,
              utr: registration.payment.gatewayPaymentId,
              paymentMethod: registration.payment.paymentMethod,
              paidAt: registration.payment.paidAt?.toISOString() || null,
              verifiedBy: registration.payment.verifiedBy,
              adminNotes: registration.payment.adminNotes,
            }
          : null,
        passes: formattedPasses,
      },
    });
  } catch (error) {
    console.error("Checkout status error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch registration status." },
      { status: 500 }
    );
  }
}
