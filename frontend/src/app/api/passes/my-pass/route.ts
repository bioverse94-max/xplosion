import { NextRequest, NextResponse } from "next/server";
import { PassService } from "@/services/pass.service";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const contact = req.nextUrl.searchParams.get("contact");
    if (!contact) {
      return NextResponse.json(
        { success: false, error: "Email, phone number, or pass code is required." },
        { status: 400 }
      );
    }

    const trimmed = contact.trim();
    const passes = await PassService.getPassesByContact(trimmed);

    // If passes found, return them
    if (passes.length > 0) {
      return NextResponse.json({ success: true, data: passes });
    }

    // Check if there's a pending registration
    const pendingReg = await prisma.registration.findFirst({
      where: {
        OR: [
          { registrationNo: trimmed.toUpperCase() },
          { attendee: { email: trimmed.toLowerCase() } },
          { attendee: { personalEmail: trimmed.toLowerCase() } },
          { attendee: { phone: trimmed } },
        ],
      },
      include: {
        attendee: true,
        payment: true,
      },
    });

    if (pendingReg) {
      return NextResponse.json({
        success: true,
        data: [],
        pendingRegistration: {
          registrationNo: pendingReg.registrationNo,
          status: pendingReg.status,
          totalAmount: pendingReg.totalAmount,
          paymentStatus: pendingReg.payment?.status || "PENDING",
          utr: pendingReg.payment?.gatewayPaymentId || null,
        },
      });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error) {
    console.error("Pass retrieval error:", error);
    return NextResponse.json({ success: false, error: "Failed to query passes." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contact } = body;

    if (!contact || typeof contact !== "string") {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email, phone number, or registration ID." },
        { status: 400 }
      );
    }

    const trimmed = contact.trim();
    const passes = await PassService.getPassesByContact(trimmed);

    if (passes.length > 0) {
      return NextResponse.json({
        success: true,
        data: passes,
        message: `Found ${passes.length} active pass(es).`,
      });
    }

    // Check for pending registration
    const pendingReg = await prisma.registration.findFirst({
      where: {
        OR: [
          { registrationNo: trimmed.toUpperCase() },
          { attendee: { email: trimmed.toLowerCase() } },
          { attendee: { personalEmail: trimmed.toLowerCase() } },
          { attendee: { phone: trimmed } },
        ],
      },
      include: {
        attendee: true,
        payment: true,
      },
    });

    if (pendingReg) {
      return NextResponse.json({
        success: true,
        data: [],
        pendingRegistration: {
          registrationNo: pendingReg.registrationNo,
          status: pendingReg.status,
          totalAmount: pendingReg.totalAmount,
          paymentStatus: pendingReg.payment?.status || "PENDING",
          utr: pendingReg.payment?.gatewayPaymentId || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: [],
      message: "No passes found for this contact.",
    });
  } catch (error) {
    console.error("Pass retrieval error:", error);
    return NextResponse.json({ success: false, error: "Pass lookup failed." }, { status: 500 });
  }
}

