import { NextRequest, NextResponse } from "next/server";
import { CheckInService } from "@/services/checkin.service";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tokenOrCode, gateLocation = "Main Gate" } = body;

    if (!tokenOrCode || typeof tokenOrCode !== "string") {
      return NextResponse.json(
        { success: false, error: "QR token or Pass Code is required." },
        { status: 400 }
      );
    }

    // Extract current operator name from session if available
    let operatorName = "Door Security Staff";
    let operatorId: string | undefined = undefined;

    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("admin_session");
    if (sessionCookie?.value) {
      try {
        const session = await verifySession<{ id?: string; name?: string; role?: string }>(sessionCookie.value);
        if (session) {
          operatorName = session.name ? `${session.name} (${session.role || "Staff"})` : "Door Security Staff";
          operatorId = session.id;
        }
      } catch {
        // Fallback to default
      }
    }

    const result = await CheckInService.verifyAndCheckIn({
      tokenOrCode,
      operatorId,
      operatorName,
      gateLocation,
    });

    if (result.status === "INVALID") {
      return NextResponse.json(
        { success: false, data: result, error: result.message },
        { status: 400 }
      );
    }

    if (result.status === "ALREADY_CHECKED_IN") {
      return NextResponse.json(
        { success: false, data: result, error: result.message },
        { status: 409 } // 409 Conflict
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error) {
    console.error("Check-in processing error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process check-in." },
      { status: 500 }
    );
  }
}
