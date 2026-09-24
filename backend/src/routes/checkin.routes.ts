import { Router, Request, Response } from "express";
import { CheckInService } from "../services/checkin.service";

const router = Router();

router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { tokenOrCode, gateLocation = "Main Gate" } = req.body;
    if (!tokenOrCode) {
      return res.status(400).json({ success: false, error: "Token or Pass Code required." });
    }

    const result = await CheckInService.verifyAndCheckIn({
      tokenOrCode,
      gateLocation,
    });

    if (result.status === "INVALID") {
      return res.status(400).json({ success: false, data: result, error: result.message });
    }

    if (result.status === "ALREADY_CHECKED_IN") {
      return res.status(409).json({ success: false, data: result, error: result.message });
    }

    return res.json({ success: true, data: result, message: result.message });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Check-in failed.";
    return res.status(500).json({ success: false, error: msg });
  }
});

export default router;
