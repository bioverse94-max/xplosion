import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/db";
import { signSession } from "../lib/security";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, error: "Invalid credentials." });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: "Invalid credentials." });
    }

    const token = signSession({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });

    return res.json({
      success: true,
      token,
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Authentication failed." });
  }
});

export default router;
