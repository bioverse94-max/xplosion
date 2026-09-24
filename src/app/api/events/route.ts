import { NextResponse } from "next/server";
import { EventService } from "@/services/event.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const event = await EventService.getActiveEvent();
    if (!event) {
      return NextResponse.json(
        { success: false, error: "No active event found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error("Error fetching active event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve event details." },
      { status: 500 }
    );
  }
}
