import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { AdminSessionUser } from "@/types";

export class AuthService {
  /**
   * Validates admin credentials and returns user session object.
   */
  static async authenticateAdmin(email: string, passwordPlain: string): Promise<AdminSessionUser | null> {
    const admin = await prisma.adminUser.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!admin || !admin.isActive) {
      return null;
    }

    const isMatch = await bcrypt.compare(passwordPlain, admin.passwordHash);
    if (!isMatch) {
      return null;
    }

    // Log successful login
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "ADMIN_LOGIN_SUCCESS",
        entityType: "AdminUser",
        entityId: admin.id,
        detailsJson: JSON.stringify({ email: admin.email, role: admin.role }),
      },
    });

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role as AdminSessionUser["role"],
    };
  }
}
