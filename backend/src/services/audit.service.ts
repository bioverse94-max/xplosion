import prisma from "../lib/db";

export class AuditService {
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
      console.error("[AuditService] Failed to record audit log:", err);
    }
  }
}
