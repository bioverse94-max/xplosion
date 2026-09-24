import React from "react";
import prisma from "@/lib/db";
import { AdminHeader } from "@/components/layout/admin-header";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { MessageSquare, Mail, Smartphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCommunicationsPage() {
  const logs = await prisma.notificationLog.findMany({
    orderBy: { sentAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Outbound Communications & Notifications"
        description="Delivery ledger for digital pass links, payment confirmations, and event reminders across Email, SMS, and WhatsApp."
      />

      <div className="p-8 space-y-6">
        <Card glass className="p-6">
          <div className="flex items-center justify-between pb-6 border-b border-surface-border">
            <div>
              <h3 className="text-base font-bold text-white font-display">Notification History ({logs.length})</h3>
              <p className="text-xs text-slate-400">Multi-channel dispatch records</p>
            </div>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              No outbound notifications sent yet. Automated pass emails and event reminders will log here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-white">{log.recipient}</TableCell>
                    <TableCell>
                      <Badge variant="outline" size="sm">
                        {log.channel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-300 font-semibold">{log.template}</TableCell>
                    <TableCell>
                      <Badge variant={log.status === "SENT" ? "success" : "danger"} size="sm">
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[11px] text-slate-400">
                      {formatDate(log.sentAt)}
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
