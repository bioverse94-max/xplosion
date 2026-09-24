import prisma from "@/lib/db";

export class AuditService {
  /**
   * Logs an operational or security event into the immutable audit log table.
   */
  static async log(params: {
    adminId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
  }) {
    try {
      await prisma.auditLog.create({
        data: {
          adminId: params.adminId || null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId || null,
          detailsJson: params.details ? JSON.stringify(params.details) : null,
          ipAddress: params.ipAddress || null,
        },
      });
    } catch (err) {
      console.error("Failed to write audit log:", err);
    }
  }

  /**
   * Retrieves recent audit logs
   */
  static async getRecentLogs(limit = 50) {
    return await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        admin: {
          select: { name: true, email: true, role: true },
        },
      },
    });
  }
}
