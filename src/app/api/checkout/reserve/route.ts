import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TicketService } from "@/services/ticket.service";

const ReserveSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  attendee: z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please provide a valid college email address"),
    personalEmail: z.string().email("Please provide a valid personal email address for pass delivery"),
    phone: z.string().min(10, "Please provide a valid 10-digit phone number"),
    phoneVerificationToken: z.string().min(1, "Mobile OTP verification is required"),
    emailVerificationToken: z.string().optional(),
    college: z.string().min(2, "College name is required"),
    academicYear: z.string().min(1, "Academic year is required"),
    branch: z.string().min(2, "Department / Branch is required"),
  }),
  items: z.array(
    z.object({
      ticketTypeId: z.string().min(1),
      quantity: z.number().int().min(1).max(10),
    })
  ).min(1, "Please select at least one ticket"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = ReserveSchema.parse(body);

    const result = await TicketService.reserveTickets(validatedData);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Ticket inventory held successfully for 10 minutes.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to process ticket reservation.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
