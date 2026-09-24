"use client";

import React, { useEffect, useState } from "react";
import { AdminHeader } from "@/components/layout/admin-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  CheckCircle2,
  Clock,
  QrCode,
  DollarSign,
  Ticket,
  ArrowUpRight,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [data, setData] = useState<{
    totalRegistrations: number;
    confirmedRegistrations: number;
    pendingRegistrations: number;
    totalPasses: number;
    checkedInPasses: number;
    totalRevenue: number;
    totalCapacity: number;
    totalSold: number;
    ticketsRemaining: number;
    checkInRatePercent: number;
    ticketTypes: Array<{ name: string; tierCode: string; capacity: number; soldCount: number; price: number }>;
    recentCheckIns: Array<{
      id: string;
      attendeeName: string;
      ticketTypeName: string;
      passCode: string;
      operatorName: string;
      gateLocation: string;
      checkedInAt: string;
    }>;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics");
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 15000); // 15s auto-refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Event Operations Dashboard"
        description="Real-time admissions, gross revenue, inventory capacity, and check-in rates."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalytics}
              isLoading={loading}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh
            </Button>
            <Link href="/admin/check-in">
              <Button variant="neon" size="sm" leftIcon={<QrCode className="h-4 w-4 text-black" />}>
                Launch Scanner
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-8 space-y-8">
        {loading && !data ? (
          <div className="py-24 flex justify-center">
            <Spinner size="xl" label="Loading Real-Time Operations Telemetry..." />
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Total Registrations */}
              <Card glass className="p-5">
                <div className="flex items-center justify-between pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Registrations</span>
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white font-display">
                    {data?.totalRegistrations || 0}
                  </span>
                  <Badge variant="paid">{data?.confirmedRegistrations || 0} Paid</Badge>
                </div>
              </Card>

              {/* Total Revenue */}
              <Card glass className="p-5">
                <div className="flex items-center justify-between pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Revenue</span>
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white font-display">
                    {formatCurrency(data?.totalRevenue || 0)}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold">100% Settled</span>
                </div>
              </Card>

              {/* Door Check-in count */}
              <Card glass className="p-5">
                <div className="flex items-center justify-between pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Check-Ins</span>
                  <div className="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white font-display">
                    {data?.checkedInPasses || 0} / {data?.totalPasses || 0}
                  </span>
                  <Badge variant="checked_in">{data?.checkInRatePercent || 0}% Attended</Badge>
                </div>
              </Card>

              {/* Tickets Remaining */}
              <Card glass className="p-5">
                <div className="flex items-center justify-between pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Remaining Capacity</span>
                  <div className="h-8 w-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                    <Ticket className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white font-display">
                    {data?.ticketsRemaining || 0}
                  </span>
                  <span className="text-xs text-slate-400">of {data?.totalCapacity || 0} seats</span>
                </div>
              </Card>
            </div>

            {/* Inventory & Recent Check-In Feeds */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Ticket Breakdown Bars */}
              <Card glass className="lg:col-span-6 p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-surface-border pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white font-display">Ticket Tier Capacity Utilization</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Real-time inventory levels from database records</p>
                  </div>
                  <Link href="/admin/tickets">
                    <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="h-4 w-4" />}>
                      Manage
                    </Button>
                  </Link>
                </div>

                <div className="space-y-4">
                  {data?.ticketTypes.map((tier) => {
                    const percent = tier.capacity > 0 ? Math.round((tier.soldCount / tier.capacity) * 100) : 0;
                    return (
                      <div key={tier.tierCode} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{tier.name}</span>
                          <span className="text-slate-400 font-mono">
                            {tier.soldCount} / {tier.capacity} ({percent}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-surface-border/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Live Door Check-Ins Feed */}
              <Card glass className="lg:col-span-6 p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-surface-border pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white font-display">Recent Door Verifications</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Live activity stream at entry points</p>
                  </div>
                  <Link href="/admin/check-in">
                    <Badge variant="primary" size="sm">LIVE SCANNER</Badge>
                  </Link>
                </div>

                {data?.recentCheckIns.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-500">
                    No door check-ins recorded yet. Start scanning at /admin/check-in.
                  </div>
                ) : (
                  <div className="divide-y divide-surface-border/50">
                    {data?.recentCheckIns.map((ci) => (
                      <div key={ci.id} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-white">{ci.attendeeName}</p>
                            <p className="text-[11px] text-slate-400">{ci.ticketTypeName} &bull; {ci.passCode}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-300 font-mono text-[11px]">
                            {new Date(ci.checkedInAt).toLocaleTimeString("en-IN")}
                          </span>
                          <p className="text-[10px] text-slate-500">{ci.gateLocation} &bull; {ci.operatorName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
