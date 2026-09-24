import { Router, Request, Response } from "express";
import prisma from "../lib/db";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const event = await prisma.event.findFirst({
      where: { isActive: true },
      include: {
        ticketTypes: {
          where: { isVisible: true },
          orderBy: { price: "asc" },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    const formattedEvent = {
      ...event,
      rules: JSON.parse(event.rulesJson || "[]"),
      faqs: JSON.parse(event.faqsJson || "[]"),
      ticketTypes: event.ticketTypes.map((tt) => ({
        ...tt,
        benefits: JSON.parse(tt.benefitsJson || "[]"),
        availableCount: Math.max(0, tt.capacity - tt.soldCount - tt.reservedCount),
      })),
    };

    return res.json({ success: true, data: formattedEvent });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch event";
    return res.status(500).json({ success: false, error: msg });
  }
});

export default router;
