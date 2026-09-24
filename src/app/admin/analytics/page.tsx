import React from "react";
import prisma from "@/lib/db";
import { AdminHeader } from "@/components/layout/admin-header";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, TrendingUp, Users, CheckCircle2, Ticket, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const [ticketTypes, payments, totalPasses, checkedInCount] = await Promise.all([
    prisma.ticketType.findMany(),
    prisma.payment.findMany({ where: { status: "SUCCESS" } }),
    prisma.pass.count(),
    prisma.checkIn.count(),
  ]);

  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalCapacity = ticketTypes.reduce((acc, t) => acc + t.capacity, 0);
  const totalSold = ticketTypes.reduce((acc, t) => acc + t.soldCount, 0);
  const checkInRate = totalPasses > 0 ? Math.round((checkedInCount / totalPasses) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Event Analytics & Performance"
        description="Conversion metrics, ticket velocity, and venue capacity utilization calculated from real database records."
      />

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card glass className="p-5">
            <span className="text-xs text-slate-400 font-bold uppercase">Total Revenue</span>
            <p className="text-2xl font-black text-white font-display mt-2">{formatCurrency(totalRevenue)}</p>
            <span className="text-[11px] text-emerald-400 font-semibold">100% Verified Settled</span>
          </Card>

          <Card glass className="p-5">
            <span className="text-xs text-slate-400 font-bold uppercase">Capacity Sold</span>
            <p className="text-2xl font-black text-white font-display mt-2">
              {totalSold} / {totalCapacity}
            </p>
            <span className="text-[11px] text-primary font-semibold">
              {totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0}% Occupancy
            </span>
          </Card>

          <Card glass className="p-5">
            <span className="text-xs text-slate-400 font-bold uppercase">Check-In Rate</span>
            <p className="text-2xl font-black text-white font-display mt-2">{checkInRate}%</p>
            <span className="text-[11px] text-cyan-400 font-semibold">{checkedInCount} verified at gate</span>
          </Card>

          <Card glass className="p-5">
            <span className="text-xs text-slate-400 font-bold uppercase">Total Digital Passes</span>
            <p className="text-2xl font-black text-white font-display mt-2">{totalPasses}</p>
            <span className="text-[11px] text-slate-400">Cryptographically active</span>
          </Card>
        </div>

        {/* Tier Sales Breakdown */}
        <Card glass className="p-6 space-y-6">
          <h3 className="text-base font-bold text-white font-display">Sales Breakdown by Ticket Tier</h3>
          <div className="space-y-4">
            {ticketTypes.map((tier) => {
              const tierRev = tier.soldCount * tier.price;
              const percent = tier.capacity > 0 ? Math.round((tier.soldCount / tier.capacity) * 100) : 0;

              return (
                <div key={tier.id} className="p-4 rounded-xl bg-surface/50 border border-surface-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white text-sm">{tier.name}</span>
                      <span className="text-slate-400 ml-2 font-mono">({formatCurrency(tier.price)})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400 font-display text-sm">{formatCurrency(tierRev)}</span>
                      <p className="text-[10px] text-slate-400">{tier.soldCount} of {tier.capacity} sold ({percent}%)</p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-surface-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
