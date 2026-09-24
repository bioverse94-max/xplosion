import { Router, Request, Response } from "express";
import { z } from "zod";
import { TicketService } from "../services/ticket.service";
import { PaymentService } from "../services/payment.service";

const router = Router();

const ReserveSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  attendee: z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please provide a valid college or personal email"),
    phone: z.string().min(10, "Please provide a valid 10-digit phone number"),
    college: z.string().min(2, "College name is required"),
    academicYear: z.string().min(1, "Academic year is required"),
    branch: z.string().min(2, "Department / Branch is required"),
  }),
  items: z.array(
    z.object({
      ticketTypeId: z.string().min(1, "Ticket type ID is required"),
      quantity: z.number().int().min(1).max(10, "Maximum 10 tickets per item"),
    })
  ).min(1, "Please select at least one ticket"),
});

const SubmitUtrSchema = z.object({
  registrationId: z.string().min(1, "Registration ID is required"),
  utrNumber: z.string().min(6, "UTR / Transaction reference must be at least 6 characters"),
  payerUpiId: z.string().optional(),
});

const VerifyPaymentSchema = z.object({
  registrationId: z.string().min(1, "Registration ID is required"),
  gatewayOrderId: z.string().optional(),
  gatewayPaymentId: z.string().min(1, "Gateway payment reference is required"),
  gatewaySignature: z.string().optional(),
});

// 1. Reserve ticket order
router.post("/reserve", async (req: Request, res: Response) => {
  try {
    const validatedData = ReserveSchema.parse(req.body);
    const registration = await TicketService.reserveTickets(validatedData);

    return res.json({
      success: true,
      data: {
        registrationId: registration.id,
        registrationNo: registration.registrationNo,
        amount: registration.totalAmount,
        expiresAt: registration.expiresAt,
      },
      message: "Ticket inventory held successfully for 10 minutes.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      });
    }
    const msg = error instanceof Error ? error.message : "Reservation failed.";
    return res.status(400).json({ success: false, error: msg });
  }
});

// 2. Submit UPI UTR
router.post("/submit-utr", async (req: Request, res: Response) => {
  try {
    const validatedData = SubmitUtrSchema.parse(req.body);
    const result = await PaymentService.submitUpiPayment({
      registrationId: validatedData.registrationId,
      utrNumber: validatedData.utrNumber,
      payerUpiId: validatedData.payerUpiId,
    });

    return res.json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      });
    }
    const msg = error instanceof Error ? error.message : "Failed to record payment.";
    return res.status(400).json({ success: false, error: msg });
  }
});

// 3. Verify & Auto-Authorize Gateway Payment
router.post("/verify", async (req: Request, res: Response) => {
  try {
    const validatedData = VerifyPaymentSchema.parse(req.body);
    const result = await PaymentService.completePayment({
      registrationId: validatedData.registrationId,
      gatewayOrderId: validatedData.gatewayOrderId,
      gatewayPaymentId: validatedData.gatewayPaymentId,
      gatewaySignature: validatedData.gatewaySignature || "MOCK_VERIFIED_SIGNATURE",
    });

    return res.json({
      success: true,
      data: result,
      message: "Payment successfully verified and passes issued.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      });
    }
    const msg = error instanceof Error ? error.message : "Payment verification failed.";
    return res.status(400).json({ success: false, error: msg });
  }
});

export default router;
