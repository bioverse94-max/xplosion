import React from "react";
import prisma from "@/lib/db";
import { AdminHeader } from "@/components/layout/admin-header";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Ticket, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
  const tickets = await prisma.ticketType.findMany({
    include: { event: true },
    orderBy: { price: "asc" },
  });

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Ticket Management"
        description="Configure admission categories, price points, capacity quotas, and visibility."
      />

      <div className="p-8 space-y-6">
        <Card glass className="p-6">
          <div className="flex items-center justify-between pb-6 border-b border-surface-border">
            <div>
              <h3 className="text-base font-bold text-white font-display">Active Ticket Categories ({tickets.length})</h3>
              <p className="text-xs text-slate-400">Inventory counts are locked and validated on server transactions</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier Name</TableHead>
                <TableHead>Tier Code</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t) => {
                const remaining = Math.max(0, t.capacity - (t.soldCount + t.reservedCount));
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-bold text-white text-xs">{t.name}</TableCell>
                    <TableCell className="font-mono text-primary text-xs">{t.tierCode}</TableCell>
                    <TableCell className="font-mono font-bold text-white text-xs">{formatCurrency(t.price)}</TableCell>
                    <TableCell className="text-xs">{t.capacity}</TableCell>
                    <TableCell className="text-xs text-emerald-400 font-bold">{t.soldCount}</TableCell>
                    <TableCell className="text-xs text-amber-400 font-medium">{t.reservedCount}</TableCell>
                    <TableCell className="text-xs font-bold text-white">{remaining}</TableCell>
                    <TableCell>
                      <Badge variant={t.isVisible ? "success" : "outline"} size="sm">
                        {t.isVisible ? "ACTIVE" : "HIDDEN"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
