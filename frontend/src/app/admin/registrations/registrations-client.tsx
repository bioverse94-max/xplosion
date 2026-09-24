"use client";

import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import QRCode from "qrcode";
import {
  Search,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  ShieldCheck,
  User,
  Ticket,
  ExternalLink,
  Eye,
  Check,
  Zap,
  Filter,
} from "lucide-react";

export interface RegistrationItem {
  id: string;
  registrationNo: string;
  status: string;
  subtotal: number;
  platformFee: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string | Date;
  attendee: {
    id: string;
    fullName: string;
    email: string;
    personalEmail?: string | null;
    phone: string;
    phoneVerified?: boolean;
    emailVerified?: boolean;
    college: string;
    academicYear: string;
    branch: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    ticketType: {
      id: string;
      name: string;
      tierCode: string;
    };
  }>;
  payment: {
    id: string;
    gatewayPaymentId: string | null;
    gatewayOrderId: string;
    paymentMethod: string;
    payerUpiId: string | null;
    status: string;
    paidAt: string | Date | null;
    verifiedBy: string | null;
  } | null;
  passes: Array<{
    id: string;
    passCode: string;
    qrToken: string;
    ticketTypeName: string;
    status: string;
    checkIn: {
      id: string;
      checkedInAt: string | Date;
      operatorName: string;
      gateLocation: string;
    } | null;
  }>;
}

interface RegistrationsClientProps {
  initialRegistrations: RegistrationItem[];
}

export const RegistrationsClient: React.FC<RegistrationsClientProps> = ({ initialRegistrations }) => {
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<RegistrationItem[]>(initialRegistrations);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterCheckin, setFilterCheckin] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [selectedReg, setSelectedReg] = useState<RegistrationItem | null>(null);
  const [modalQrUrl, setModalQrUrl] = useState<string>("");
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isApprovingPayment, setIsApprovingPayment] = useState(false);

  // Real-time automatic polling every 3.5 seconds
  useEffect(() => {
    if (!autoSyncEnabled) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/registrations");
        const json = await res.json();
        if (json.success && json.data) {
          setRegistrations(json.data);
          setLastUpdated(new Date());
        }
      } catch (err) {
        // Silently retry next interval
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [autoSyncEnabled]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/registrations");
      const json = await res.json();
      if (json.success && json.data) {
        setRegistrations(json.data);
        setLastUpdated(new Date());
        toast({
          title: "Real-time Sync Complete",
          message: `Database loaded: ${json.data.length} records.`,
          type: "success",
        });
      }
    } catch {
      toast({ title: "Sync Failed", message: "Could not refresh registrations.", type: "error" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenDetailModal = (reg: RegistrationItem) => {
    setSelectedReg(reg);
    const pass = reg.passes[0];
    if (pass) {
      QRCode.toDataURL(pass.qrToken, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      })
        .then((url) => setModalQrUrl(url))
        .catch(() => setModalQrUrl(""));
    } else {
      setModalQrUrl("");
    }
  };

  const handleDirectCheckIn = async (passIdOrCode: string) => {
    setIsCheckingIn(true);
    try {
      const res = await fetch("/api/admin/checkin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenOrCode: passIdOrCode,
          gateLocation: "Admin Portal Instant Desk",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to check in pass.");
      }

      toast({
        title: "ATTENDEE CHECKED IN",
        message: `${json.data?.pass?.attendeeName} is verified for entry!`,
        type: "success",
      });

      // Refresh data
      handleManualRefresh();
      setSelectedReg(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Check-in failed.";
      toast({ title: "Check-in Error", message: msg, type: "error" });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleModalApprove = async (paymentId: string) => {
    setIsApprovingPayment(true);
    try {
      const res = await fetch("/api/admin/payments/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to approve payment");
      toast({ title: "Payment Approved", message: "Pass issued in database.", type: "success" });
      handleManualRefresh();
      setSelectedReg(null);
    } catch (err) {
      toast({ title: "Approval Failed", message: err instanceof Error ? err.message : "Error", type: "error" });
    } finally {
      setIsApprovingPayment(false);
    }
  };

  const handleModalReject = async (paymentId: string) => {
    const reason = prompt("Enter rejection reason (e.g. UTR not found on bank statement):");
    if (reason === null) return;
    setIsApprovingPayment(true);
    try {
      const res = await fetch("/api/admin/payments/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, reason: reason.trim() || "Transaction ID / UTR could not be verified" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to reject payment");
      toast({ title: "Payment Rejected", message: "Registration cancelled & inventory released.", type: "info" });
      handleManualRefresh();
      setSelectedReg(null);
    } catch (err) {
      toast({ title: "Rejection Failed", message: err instanceof Error ? err.message : "Error", type: "error" });
    } finally {
      setIsApprovingPayment(false);
    }
  };

  const handleExportCsv = () => {
    if (registrations.length === 0) {
      toast({ title: "No Data", message: "No registrations to export.", type: "warning" });
      return;
    }

    const headers = [
      "Registration No",
      "Attendee Name",
      "Email",
      "Phone",
      "College",
      "Branch",
      "Tickets",
      "Amount (INR)",
      "Status",
      "Payment Method",
      "Payment Txn ID",
      "Pass Code",
      "Checked In",
      "Check-In Time",
      "Registered At",
    ];

    const rows = registrations.map((r) => {
      const pass = r.passes[0];
      const isCheckedIn = pass?.checkIn ? "YES" : "NO";
      const checkInTime = pass?.checkIn ? new Date(pass.checkIn.checkedInAt).toLocaleString("en-IN") : "N/A";
      const ticketDesc = r.items.map((i) => `${i.ticketType.name} (${i.quantity})`).join("; ");

      return [
        `"${r.registrationNo}"`,
        `"${r.attendee.fullName}"`,
        `"${r.attendee.email}"`,
        `"${r.attendee.phone}"`,
        `"${r.attendee.college}"`,
        `"${r.attendee.branch}"`,
        `"${ticketDesc}"`,
        r.totalAmount,
        `"${r.status}"`,
        `"${r.payment?.paymentMethod || "N/A"}"`,
        `"${r.payment?.gatewayPaymentId || "N/A"}"`,
        `"${pass?.passCode || "N/A"}"`,
        `"${isCheckedIn}"`,
        `"${checkInTime}"`,
        `"${new Date(r.createdAt).toLocaleString("en-IN")}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NeonGenesis_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "CSV Exported", message: "Dataset downloaded successfully.", type: "success" });
  };

  // Filter and Search Logic
  const filteredRegistrations = registrations.filter((reg) => {
    if (filterStatus !== "ALL" && reg.status !== filterStatus) {
      return false;
    }
    if (filterCheckin === "CHECKED_IN") {
      const isCheckedIn = reg.passes.some((p) => p.checkIn !== null && p.checkIn !== undefined);
      if (!isCheckedIn) return false;
    } else if (filterCheckin === "NOT_CHECKED_IN") {
      const isCheckedIn = reg.passes.some((p) => p.checkIn !== null && p.checkIn !== undefined);
      if (isCheckedIn || reg.passes.length === 0) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchReg = reg.registrationNo.toLowerCase().includes(q);
      const matchName = reg.attendee.fullName.toLowerCase().includes(q);
      const matchEmail = reg.attendee.email.toLowerCase().includes(q);
      const matchPhone = reg.attendee.phone.toLowerCase().includes(q);
      const matchCollege = reg.attendee.college.toLowerCase().includes(q);
      const matchPassCode = reg.passes.some((p) => p.passCode.toLowerCase().includes(q));
      const matchTxn = reg.payment?.gatewayPaymentId?.toLowerCase().includes(q);
      return matchReg || matchName || matchEmail || matchPhone || matchCollege || matchPassCode || matchTxn;
    }

    return true;
  });

  const confirmedCount = registrations.filter((r) => r.status === "CONFIRMED").length;
  const checkedInCount = registrations.filter((r) => r.passes.some((p) => p.checkIn !== null)).length;
  const totalRevenue = registrations
    .filter((r) => r.status === "CONFIRMED")
    .reduce((sum, r) => sum + r.totalAmount, 0);

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Live Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card glass className="p-4 border-l-4 border-l-primary">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Database Orders</span>
          <p className="text-2xl font-black text-white font-display mt-1">{registrations.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Real-time atomic records</p>
        </Card>

        <Card glass className="p-4 border-l-4 border-l-accent-emerald">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirmed & Auto-Verified</span>
          <p className="text-2xl font-black text-accent-emerald font-display mt-1">{confirmedCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Passes issued & entry authorized</p>
        </Card>

        <Card glass className="p-4 border-l-4 border-l-accent-purple">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gate Checked-In</span>
          <p className="text-2xl font-black text-accent-purple font-display mt-1">{checkedInCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Scanned & verified inside venue</p>
        </Card>

        <Card glass className="p-4 border-l-4 border-l-accent-amber">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Payment Volume</span>
          <p className="text-2xl font-black text-accent-amber font-display mt-1">{formatCurrency(totalRevenue)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Bank captured revenue</p>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card glass className="p-6 space-y-6">
        {/* Real-time Status Bar & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              LIVE DATABASE REAL-TIME SYNC
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Updated: {lastUpdated.toLocaleTimeString("en-IN")}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />}
            >
              Sync Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              leftIcon={<Download className="h-3.5 w-3.5 text-primary" />}
            >
              Export CSV
            </Button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 lg:col-span-6 relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name, Phone, Email, Reg No, or Pass Code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-surface border border-surface-border pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary shadow-inner"
            />
          </div>

          <div className="sm:col-span-3 lg:col-span-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-xl bg-surface border border-surface-border px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="CONFIRMED">CONFIRMED (Paid)</option>
              <option value="PENDING">PENDING</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="sm:col-span-3 lg:col-span-3">
            <select
              value={filterCheckin}
              onChange={(e) => setFilterCheckin(e.target.value)}
              className="w-full rounded-xl bg-surface border border-surface-border px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Check-In States</option>
              <option value="CHECKED_IN">Checked In at Door</option>
              <option value="NOT_CHECKED_IN">Valid (Not Checked In)</option>
            </select>
          </div>
        </div>

        {/* Registrations Data Table */}
        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            No registrations found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration No</TableHead>
                  <TableHead>Attendee Name & Contact</TableHead>
                  <TableHead>College & Branch</TableHead>
                  <TableHead>Ticket Details</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment & Pass Status</TableHead>
                  <TableHead>Gate Entry</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((reg) => {
                  const pass = reg.passes[0];
                  const isCheckedIn = pass?.checkIn !== null && pass?.checkIn !== undefined;

                  return (
                    <TableRow key={reg.id} className="hover:bg-surface/60 transition-colors">
                      <TableCell className="font-mono font-bold text-primary text-xs whitespace-nowrap">
                        {reg.registrationNo}
                      </TableCell>

                      <TableCell>
                        <p className="font-bold text-white text-xs">{reg.attendee.fullName}</p>
                        <p className="text-[11px] text-emerald-400 font-mono">Personal: {reg.attendee.personalEmail || "—"}</p>
                        <p className="text-[11px] text-slate-400">College: {reg.attendee.email}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-300 font-mono">+91 {reg.attendee.phone}</span>
                          {reg.attendee.phoneVerified && (
                            <span className="px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                              ✓ OTP
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs">
                        <p className="text-slate-200 font-medium">{reg.attendee.college}</p>
                        <p className="text-[10px] text-slate-400">
                          {reg.attendee.branch} &bull; {reg.attendee.academicYear}
                        </p>
                      </TableCell>

                      <TableCell className="text-xs">
                        {reg.items.map((item) => (
                          <div key={item.id} className="text-slate-300 font-medium">
                            {item.ticketType.name} &times; {item.quantity}
                          </div>
                        ))}
                      </TableCell>

                      <TableCell className="font-mono font-bold text-white text-xs whitespace-nowrap">
                        {formatCurrency(reg.totalAmount)}
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <Badge
                            variant={
                              reg.status === "CONFIRMED" ? "paid" : reg.status === "PENDING" ? "pending" : "danger"
                            }
                            size="sm"
                          >
                            {reg.status === "CONFIRMED" ? "AUTO-VERIFIED (PAID)" : reg.status}
                          </Badge>
                          {reg.payment?.gatewayPaymentId && (
                            <p className="text-[9px] font-mono text-slate-400 truncate max-w-[120px]">
                              Txn: {reg.payment.gatewayPaymentId}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {pass ? (
                          <Badge variant={isCheckedIn ? "checked_in" : "valid"} size="sm">
                            {isCheckedIn ? "CHECKED IN" : "VALID PASS"}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-slate-500">Unissued</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetailModal(reg)}
                          leftIcon={<Eye className="h-3.5 w-3.5 text-primary" />}
                        >
                          Details & Pass
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Attendee Details & Pass Modal */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-surface border border-surface-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-border pb-4">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest block font-display">
                  ATTENDEE DATABASE VERIFICATION
                </span>
                <h3 className="text-xl font-bold text-white font-display">
                  {selectedReg.attendee.fullName}
                </h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedReg(null)}>
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
              {/* Pass QR Box */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center space-y-3 p-4 rounded-2xl bg-surface/80 border border-surface-border">
                {modalQrUrl ? (
                  <div className="p-3 rounded-2xl bg-white border-2 border-primary/50 shadow-neon">
                    <img src={modalQrUrl} alt="Pass QR" className="w-36 h-36 object-contain" />
                  </div>
                ) : (
                  <div className="h-36 w-36 rounded-2xl bg-surface flex items-center justify-center text-slate-500 text-xs">
                    No Pass Generated
                  </div>
                )}
                <div className="text-center">
                  <span className="font-mono font-bold text-xs text-primary block">
                    {selectedReg.passes[0]?.passCode || "N/A"}
                  </span>
                  <Badge
                    variant={
                      selectedReg.passes[0]?.checkIn
                        ? "checked_in"
                        : selectedReg.passes[0]?.status === "VALID"
                        ? "valid"
                        : "pending"
                    }
                    size="sm"
                    className="mt-1"
                  >
                    {selectedReg.passes[0]?.checkIn ? "CHECKED IN AT DOOR" : "VALID ENTRY PASS"}
                  </Badge>
                </div>
              </div>

              {/* Attendee Details */}
              <div className="sm:col-span-7 space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-surface/50 border border-surface-border space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Attendee & Contact Verification
                  </span>
                  <p className="text-white font-semibold">
                    Personal Email (Pass Inbox):{" "}
                    <span className="text-emerald-400 font-mono">{selectedReg.attendee.personalEmail || "—"}</span>
                    {selectedReg.attendee.emailVerified && (
                      <span className="ml-1 px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                        ✓ VERIFIED
                      </span>
                    )}
                  </p>
                  <p className="text-white font-semibold">College Email: {selectedReg.attendee.email}</p>
                  <p className="text-white font-semibold">
                    Phone Number: +91 {selectedReg.attendee.phone}
                    {selectedReg.attendee.phoneVerified ? (
                      <span className="ml-1 px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                        ✓ OTP VERIFIED
                      </span>
                    ) : (
                      <span className="ml-1 text-[10px] text-amber-500">(Unverified)</span>
                    )}
                  </p>
                  <p className="text-slate-300">College: {selectedReg.attendee.college}</p>
                  <p className="text-slate-300">Branch & Year: {selectedReg.attendee.branch} ({selectedReg.attendee.academicYear})</p>
                </div>

                <div className="p-3 rounded-xl bg-surface/50 border border-surface-border space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Payment Verification Record
                  </span>
                  <p className="text-white">
                    Order Ref: <span className="font-mono text-primary font-bold">{selectedReg.registrationNo}</span>
                  </p>
                  <p className="text-white">
                    Gateway Txn: <span className="font-mono text-emerald-400">{selectedReg.payment?.gatewayPaymentId || "N/A"}</span>
                  </p>
                  <p className="text-slate-300">
                    Amount Paid: <strong className="text-white">{formatCurrency(selectedReg.totalAmount)}</strong> via {selectedReg.payment?.paymentMethod || "UPI"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Verified By: {selectedReg.payment?.verifiedBy || "SYSTEM_AUTO_VERIFIED"}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Approval / Rejection if not confirmed */}
            {selectedReg.status !== "CONFIRMED" && selectedReg.payment && (
              <div className="pt-3 border-t border-surface-border flex gap-3">
                <Button
                  variant="neon"
                  size="lg"
                  className="flex-1"
                  isLoading={isApprovingPayment}
                  onClick={() => handleModalApprove(selectedReg.payment!.id)}
                  leftIcon={<CheckCircle2 className="h-4 w-4 text-black" />}
                >
                  Approve Payment & Issue Pass
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  disabled={isApprovingPayment}
                  onClick={() => handleModalReject(selectedReg.payment!.id)}
                  leftIcon={<XCircle className="h-4 w-4" />}
                >
                  Reject
                </Button>
              </div>
            )}

            {/* Check-In Action Button */}
            {selectedReg.passes.length > 0 && !selectedReg.passes[0].checkIn && (
              <div className="pt-2 border-t border-surface-border">
                <Button
                  variant="neon"
                  size="xl"
                  className="w-full"
                  isLoading={isCheckingIn}
                  onClick={() => handleDirectCheckIn(selectedReg.passes[0].passCode)}
                  leftIcon={<CheckCircle2 className="h-5 w-5 text-black" />}
                >
                  Authorize Door Check-In for {selectedReg.attendee.fullName}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
