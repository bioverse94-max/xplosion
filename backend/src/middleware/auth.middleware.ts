import { Request, Response, NextFunction } from "express";
import { verifySession } from "../lib/security";

export interface AuthenticatedRequest extends Request {
  adminUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (req.headers["x-admin-token"]) {
    token = String(req.headers["x-admin-token"]).trim();
  } else if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(";").map((c) => c.trim());
    const sessionCookie = cookies.find((c) => c.startsWith("admin_session="));
    if (sessionCookie) {
      token = decodeURIComponent(sessionCookie.split("=")[1]);
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized. Admin authentication token required.",
    });
  }

  const session = verifySession<{ id: string; name: string; email: string; role: string }>(token);
  if (!session || !session.id || !session.role) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized. Invalid or expired admin token.",
    });
  }

  (req as AuthenticatedRequest).adminUser = session;
  return next();
}
