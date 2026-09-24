import React from "react";
import prisma from "@/lib/db";
import { AdminHeader } from "@/components/layout/admin-header";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    include: { admin: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Security & Operations Audit Trail"
        description="Immutable system log capturing administrative actions, door scans, logins, and refunds."
      />

      <div className="p-8 space-y-6">
        <Card glass className="p-6">
          <div className="flex items-center justify-between pb-6 border-b border-surface-border">
            <div>
              <h3 className="text-base font-bold text-white font-display">System Audit Logs ({logs.length})</h3>
              <p className="text-xs text-slate-400">Append-only security records</p>
            </div>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              No audit records logged yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Operator / Admin</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-[11px] font-mono text-slate-400">
                      {new Date(log.createdAt).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="primary" size="sm">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-white">
                      {log.admin ? `${log.admin.name} (${log.admin.role})` : "System / Staff"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-300 font-mono">
                      {log.entityType}
                    </TableCell>
                    <TableCell className="text-[11px] text-slate-400 font-mono max-w-xs truncate">
                      {log.detailsJson || "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
