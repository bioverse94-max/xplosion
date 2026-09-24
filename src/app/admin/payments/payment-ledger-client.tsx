"use client";

import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  CreditCard,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface PaymentItem {
  id: string;
  gatewayOrderId: string;
  gatewayPaymentId: string | null;
  paymentMethod: string;
  payerUpiId: string | null;
  adminNotes: string | null;
  verifiedBy: string | null;
  verifiedAt: Date | string | null;
  amount: number;
  currency: string;
  status: string;
  paidAt: Date | string | null;
  createdAt: Date | string;
  registration: {
    id: string;
    registrationNo: string;
    status: string;
    attendee: {
      fullName: string;
      email: string;
      phone: string;
      college: string;
      branch: string;
    };
  };
}

interface PaymentLedgerClientProps {
  initialPayments: PaymentItem[];
}

export const PaymentLedgerClient: React.FC<PaymentLedgerClientProps> = ({ initialPayments }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentItem[]>(initialPayments);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  // Real-time automatic polling every 3 seconds
  useEffect(() => {
    if (!autoSyncEnabled) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/payments");
        const json = await res.json();
        if (json.success && json.data) {
          setPayments(json.data);
          setLastUpdated(new Date());
        }
      } catch (err) {
        // Silently retry on next tick
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [autoSyncEnabled]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/payments");
      const json = await res.json();
      if (json.success && json.data) {
        setPayments(json.data);
        setLastUpdated(new Date());
        toast({ title: "Ledger Synced", message: "Latest payment ledger loaded in real-time.", type: "success" });
      }
    } catch {
      toast({ title: "Sync Failed", message: "Could not refresh ledger.", type: "error" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const pendingCount = payments.filter((p) => p.status === "PENDING_VERIFICATION").length;
  const successCount = payments.filter((p) => p.status === "SUCCESS").length;

  const filteredPayments = payments.filter((p) => {
    if (filterStatus !== "ALL" && p.status !== filterStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchUtr = p.gatewayPaymentId?.toLowerCase().includes(q);
      const matchReg = p.registration.registrationNo.toLowerCase().includes(q);
      const matchName = p.registration.attendee.fullName.toLowerCase().includes(q);
      const matchEmail = p.registration.attendee.email.toLowerCase().includes(q);
      return matchUtr || matchReg || matchName || matchEmail;
    }
    return true;
  });

  const handleApprove = async (payment: PaymentItem) => {
    setProcessingId(payment.id);
    try {
      const res = await fetch("/api/admin/payments/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: payment.id,
          adminNotes: `Approved by organizer at ${new Date().toLocaleTimeString()}`,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to approve payment.");
      }

      toast({
        title: "Payment Verified!",
        message: `Pass issued for ${payment.registration.attendee.fullName} (${payment.registration.registrationNo}).`,
        type: "success",
      });

      setPayments((prev) =>
        prev.map((p) =>
          p.id === payment.id
            ? {
                ...p,
                status: "SUCCESS",
                verifiedBy: "Admin",
                verifiedAt: new Date().toISOString(),
                registration: { ...p.registration, status: "CONFIRMED" },
              }
            : p
        )
      );
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error approving payment.";
      toast({ title: "Approval Failed", message: msg, type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (payment: PaymentItem) => {
    const reason = prompt("Enter rejection reason (e.g. UTR not found on bank statement):");
    if (reason === null) return; // User clicked Cancel

    setProcessingId(payment.id);
    try {
      const res = await fetch("/api/admin/payments/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: payment.id,
          reason: reason.trim() || "Transaction ID / UTR could not be verified in bank ledger",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to reject payment.");
      }

      toast({
        title: "Payment Rejected",
        message: `Registration ${payment.registration.registrationNo} has been cancelled.`,
        type: "info",
      });

      setPayments((prev) =>
        prev.map((p) =>
          p.id === payment.id
            ? {
                ...p,
                status: "FAILED",
                registration: { ...p.registration, status: "CANCELLED" },
              }
            : p
        )
      );
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error rejecting payment.";
      toast({ title: "Action Failed", message: msg, type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Live Sync Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface/80 border border-surface-border">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${autoSyncEnabled ? "bg-emerald-400 opacity-75" : "bg-slate-500 opacity-0"}`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${autoSyncEnabled ? "bg-emerald-400 shadow-[0_0_10px_#34d399]" : "bg-slate-500"}`} />
          </span>
          <span className="text-xs font-bold text-white flex items-center gap-2">
            {autoSyncEnabled ? "REALTIME LEDGER SYNC ACTIVE" : "REALTIME SYNC PAUSED"}
            <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
              (Auto-refreshing every 4s &bull; Last updated: {lastUpdated.toLocaleTimeString()})
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
            className="text-xs text-slate-300 hover:text-white"
          >
            {autoSyncEnabled ? "Pause Auto-Sync" : "Resume Auto-Sync"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />}
            className="text-xs"
          >
            Refresh Ledger
          </Button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Awaiting Verification</p>
            <p className="text-2xl font-black text-white font-display mt-1">{pendingCount}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Confirmed Payments</p>
            <p className="text-2xl font-black text-white font-display mt-1">{successCount}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-surface-border flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Ledger Entries</p>
            <p className="text-2xl font-black text-white font-display mt-1">{payments.length}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <QrCode className="h-5 w-5" />
          </div>
        </div>
      </div>

      <Card glass className="p-6">
        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-6 border-b border-surface-border">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-surface-border overflow-x-auto">
            {[
              { id: "ALL", label: `All (${payments.length})` },
              { id: "PENDING_VERIFICATION", label: `Pending UTR (${pendingCount})` },
              { id: "SUCCESS", label: `Verified (${successCount})` },
              { id: "FAILED", label: "Failed / Rejected" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  filterStatus === tab.id
                    ? "bg-primary text-black shadow-neon"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search UTR, Reg No, or Name..."
              className="w-full rounded-xl bg-surface border border-surface-border pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Ledger Table */}
        {filteredPayments.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            No payment transactions match the selected filter.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID / UTR</TableHead>
                <TableHead>Attendee & College</TableHead>
                <TableHead>Order & Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date / Submitted</TableHead>
                <TableHead className="text-right">Reconciliation Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((p) => {
                const isPending = p.status === "PENDING_VERIFICATION";
                const isProcessing = processingId === p.id;

                return (
                  <TableRow key={p.id}>
                    {/* UTR / Transaction ID */}
                    <TableCell>
                      {p.gatewayPaymentId ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-white bg-surface px-2 py-1 rounded border border-surface-border inline-block">
                              {p.gatewayPaymentId}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(p.gatewayPaymentId || "");
                                toast({
                                  title: "UTR Copied",
                                  message: `${p.gatewayPaymentId} copied to clipboard`,
                                  type: "info",
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                              title="Copy Transaction ID"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                          {p.payerUpiId && (
                            <p className="text-[10px] text-slate-400">VPA: {p.payerUpiId}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-mono italic">Not Submitted</span>
                      )}
                    </TableCell>

                    {/* Attendee */}
                    <TableCell>
                      <p className="font-bold text-white text-xs">{p.registration.attendee.fullName}</p>
                      <p className="text-[10px] text-slate-400">{p.registration.attendee.phone}</p>
                      <p className="text-[10px] text-slate-500">{p.registration.attendee.college}</p>
                    </TableCell>

                    {/* Order & Method */}
                    <TableCell>
                      <span className="font-mono text-xs text-primary block font-bold">
                        {p.registration.registrationNo}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                        {p.paymentMethod || "UPI_QR"}
                      </span>
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="font-mono font-bold text-xs text-white">
                      {formatCurrency(p.amount)}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant={
                          p.status === "SUCCESS"
                            ? "paid"
                            : p.status === "PENDING_VERIFICATION"
                            ? "pending"
                            : p.status === "REFUNDED"
                            ? "danger"
                            : "secondary"
                        }
                        size="sm"
                      >
                        {p.status === "PENDING_VERIFICATION" ? "PENDING VERIFY" : p.status}
                      </Badge>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-[11px] text-slate-400">
                      {p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt)}
                    </TableCell>

                    {/* Action Buttons */}
                    <TableCell className="text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="neon"
                            size="sm"
                            isLoading={isProcessing}
                            onClick={() => handleApprove(p)}
                            leftIcon={<CheckCircle2 className="h-3.5 w-3.5 text-black" />}
                            className="text-xs"
                          >
                            Approve & Issue Pass
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleReject(p)}
                            leftIcon={<XCircle className="h-3.5 w-3.5" />}
                            className="text-xs"
                          >
                            Reject
                          </Button>
                        </div>
                      ) : p.status === "SUCCESS" ? (
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center justify-end gap-1">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Pass Active ({p.verifiedBy || "Verified"})
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">
                          {p.adminNotes || "Settled"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};
