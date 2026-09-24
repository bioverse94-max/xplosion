import { Router, Request, Response } from "express";
import prisma from "../lib/db";
import { PaymentService } from "../services/payment.service";
import { requireAdminAuth } from "../middleware/auth.middleware";

const router = Router();

// Protect all admin endpoints with cryptographic token verification
router.use(requireAdminAuth);

// Registrations Real-time Feed
router.get("/registrations", async (req: Request, res: Response) => {
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

    return res.json({ success: true, data: registrations });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to fetch registrations." });
  }
});

// Payments Ledger Feed
router.get("/payments", async (req: Request, res: Response) => {
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

    return res.json({ success: true, data: payments });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to fetch payments." });
  }
});

// Approve / Verify payment
router.post("/payments/approve", async (req: Request, res: Response) => {
  try {
    const { paymentId, adminNotes } = req.body;
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return res.status(404).json({ success: false, error: "Payment not found." });
    }

    const result = await PaymentService.completePayment({
      registrationId: payment.registrationId,
      gatewayOrderId: payment.gatewayOrderId,
      gatewayPaymentId: payment.gatewayPaymentId || `ADM_${Date.now()}`,
      verifiedBy: "ADMIN_CONSOLE",
      adminNotes,
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Approval failed.";
    return res.status(400).json({ success: false, error: msg });
  }
});

// Reject payment
router.post("/payments/reject", async (req: Request, res: Response) => {
  try {
    const { paymentId, reason } = req.body;
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return res.status(404).json({ success: false, error: "Payment not found." });
    }

    const result = await PaymentService.rejectPayment({
      registrationId: payment.registrationId,
      reason: reason || "Rejected by administrator",
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Rejection failed.";
    return res.status(400).json({ success: false, error: msg });
  }
});

export default router;
