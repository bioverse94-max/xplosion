import React from "react";
import prisma from "@/lib/db";
import { AdminHeader } from "@/components/layout/admin-header";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ShieldAlert, UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  const admins = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Admin Staff & Role-Based Access"
        description="Role-based permissions governing door check-in, pricing controls, and financial operations."
      />

      <div className="p-8 space-y-6">
        <Card glass className="p-6">
          <div className="flex items-center justify-between pb-6 border-b border-surface-border">
            <div>
              <h3 className="text-base font-bold text-white font-display">Authorized Operators ({admins.length})</h3>
              <p className="text-xs text-slate-400">Granular role-based permissions matrix</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Assigned Role</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((adm) => (
                <TableRow key={adm.id}>
                  <TableCell className="font-bold text-white text-xs">{adm.name}</TableCell>
                  <TableCell className="text-xs text-slate-300 font-mono">{adm.email}</TableCell>
                  <TableCell>
                    <Badge variant={adm.role === "SUPER_ADMIN" ? "primary" : "secondary"} size="sm">
                      {adm.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={adm.isActive ? "success" : "danger"} size="sm">
                      {adm.isActive ? "ACTIVE" : "DISABLED"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[11px] text-slate-400">
                    {formatDate(adm.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
