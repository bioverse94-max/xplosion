"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { DigitalPassCard } from "@/components/pass/digital-pass-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { DigitalPassDTO } from "@/types";
import { StageLight, NoiseOverlay, BrushStroke } from "@/components/effects/visual-engine";
import { formatCurrency } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Ticket,
  Flame,
  RefreshCw,
  AlertTriangle,
  Lock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";

interface StatusResponseData {
  registrationId: string;
  registrationNo: string;
  status: string; // PENDING | CONFIRMED | CANCELLED | EXPIRED
  totalAmount: number;
  attendee: {
    fullName: string;
    email: string;
    phone: string;
    college: string;
    branch: string;
  };
  payment: {
    id: string;
    status: string; // INITIATED | PENDING_VERIFICATION | SUCCESS | FAILED
    utr: string | null;
    paymentMethod: string;
    paidAt: string | null;
    verifiedBy: string | null;
    adminNotes: string | null;
  } | null;
  passes: DigitalPassDTO[];
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const regNo = searchParams.get("regNo") || "";
  const regId = searchParams.get("regId") || "";
  const submittedUtr = searchParams.get("utr") || "";
  const passId = searchParams.get("passId") || "";

  const [pageState, setPageState] = useState<"LOADING" | "AWAITING" | "CONFIRMED" | "REJECTED">("LOADING");
  const [data, setData] = useState<StatusResponseData | null>(null);
  const [selectedPassIndex, setSelectedPassIndex] = useState(0);
  const [isManualChecking, setIsManualChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [pollCount, setPollCount] = useState(0);
  const [copiedUtr, setCopiedUtr] = useState(false);

  const hasFiredConfetti = useRef(false);

  const fireCelebration = useCallback(() => {
    if (hasFiredConfetti.current) return;
    hasFiredConfetti.current = true;
    try {
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.55 },
        colors: ["#FF0000", "#FFFFFF", "#111111", "#8B0000", "#E60000"],
      });
    } catch {
      // Ignored if canvas unsupported
    }
  }, []);

  const checkStatus = useCallback(async (isManual = false) => {
    if (isManual) setIsManualChecking(true);

    try {
      let endpoint = "";
      if (regId || regNo) {
        endpoint = `/api/checkout/status?${regId ? `regId=${encodeURIComponent(regId)}` : `regNo=${encodeURIComponent(regNo)}`}`;
      } else if (passId) {
        endpoint = `/api/passes/my-pass?contact=${encodeURIComponent(passId)}`;
      } else {
        setPageState("AWAITING");
        return;
      }

      const res = await fetch(endpoint, { cache: "no-store" });
      const json = await res.json();
      setLastChecked(new Date());
      setPollCount((prev) => prev + 1);

      if (json.success && json.data) {
        // If standard checkout status response
        if (json.data.registrationNo) {
          const regData: StatusResponseData = json.data;
          setData(regData);

          if (regData.status === "CONFIRMED" && regData.passes.length > 0) {
            setPageState("CONFIRMED");
            fireCelebration();
          } else if (regData.status === "CANCELLED" || regData.payment?.status === "FAILED") {
            setPageState("REJECTED");
          } else {
            setPageState("AWAITING");
          }
        } else if (Array.isArray(json.data) && json.data.length > 0) {
          // If my-pass direct array response
          setData({
            registrationId: json.data[0].registrationNo,
            registrationNo: json.data[0].registrationNo,
            status: "CONFIRMED",
            totalAmount: 0,
            attendee: {
              fullName: json.data[0].attendeeName,
              email: json.data[0].attendeeEmail,
              phone: json.data[0].attendeePhone,
              college: json.data[0].college,
              branch: json.data[0].branch,
            },
            payment: {
              id: "direct",
              status: "SUCCESS",
              utr: null,
              paymentMethod: "UPI",
              paidAt: null,
              verifiedBy: "Admin",
              adminNotes: null,
            },
            passes: json.data,
          });
          setPageState("CONFIRMED");
          fireCelebration();
        } else if (json.pendingRegistration) {
          const p = json.pendingRegistration;
          setData({
            registrationId: p.registrationNo,
            registrationNo: p.registrationNo,
            status: p.status,
            totalAmount: p.totalAmount,
            attendee: {
              fullName: "Attendee",
              email: "",
              phone: "",
              college: "",
              branch: "",
            },
            payment: {
              id: "pending",
              status: p.paymentStatus,
              utr: p.utr,
              paymentMethod: "UPI_QR",
              paidAt: null,
              verifiedBy: null,
              adminNotes: null,
            },
            passes: [],
          });

          if (p.status === "CANCELLED" || p.paymentStatus === "FAILED") {
            setPageState("REJECTED");
          } else {
            setPageState("AWAITING");
          }
        }
      }
    } catch (err) {
      console.error("Status polling error:", err);
    } finally {
      if (isManual) setIsManualChecking(false);
    }
  }, [regId, regNo, passId, fireCelebration]);

  // Initial fetch and automatic real-time polling every 3 seconds while awaiting verification
  useEffect(() => {
    checkStatus();

    const interval = setInterval(() => {
      // Continue polling if awaiting or still loading
      setPageState((current) => {
        if (current === "AWAITING" || current === "LOADING") {
          checkStatus();
        }
        return current;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleCopyUtr = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(true);
    setTimeout(() => setCopiedUtr(false), 2000);
  };

  const activePass = data?.passes?.[selectedPassIndex] || data?.passes?.[0];

  return (
    <div className="flex flex-col min-h-screen bg-[#030303] text-[#F5F5F5] font-sans">
      <PublicNavbar />

      <main className="flex-1 pt-28 pb-20 relative overflow-hidden">
        <StageLight position="top" intensity="high" />
        <NoiseOverlay opacity={0.035} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* ========================================================================= */}
          {/* 1. LOADING STATE */}
          {/* ========================================================================= */}
          {pageState === "LOADING" && (
            <div className="py-24 text-center space-y-4">
              <Spinner size="lg" label="Connecting to Real-Time Gate Database..." />
              <p className="text-xs text-[#A0A0A0] font-mono uppercase tracking-wider">
                Verifying transaction ledger reference: {regNo || regId}
              </p>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. AWAITING GATE CHECKER / ADMIN APPROVAL */}
          {/* ========================================================================= */}
          {pageState === "AWAITING" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Top Banner */}
              <div className="text-center space-y-4">
                <div className="relative h-20 w-20 mx-auto">
                  <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
                  <div className="relative h-20 w-20 rounded-2xl bg-[#0D0D0D] border-2 border-amber-500 flex items-center justify-center text-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.4)]">
                    <Clock className="h-10 w-10 animate-pulse" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0D0D0D] border border-amber-500/40 text-amber-400 text-xs font-mono font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  AWAITING GATE CHECKER VERIFICATION
                </div>

                <h1 className="text-4xl sm:text-6xl font-black text-white font-display uppercase tracking-tight">
                  TRANSACTION <span className="text-amber-400">SUBMITTED</span>
                </h1>

                <p className="text-xs sm:text-sm font-mono text-[#A0A0A0] max-w-lg mx-auto uppercase tracking-wider">
                  YOUR TRANSACTION ID IS QUEUED FOR GATE ADMIN APPROVAL. YOUR PASS WILL UNLOCK AUTOMATICALLY UPON VERIFICATION.
                </p>
              </div>

              {/* Transaction Summary Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#080808] border border-[#222222] shadow-[0_10px_40px_rgba(0,0,0,0.8)] space-y-6 font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1F1F1F]">
                  <div>
                    <span className="text-[10px] font-bold text-[#6F6F6F] uppercase">ORDER REFERENCE</span>
                    <p className="text-lg font-black text-white">{data?.registrationNo || regNo}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-bold text-[#6F6F6F] uppercase">TOTAL PAYABLE</span>
                    <p className="text-lg font-black text-[#FF0000]">
                      {data?.totalAmount ? formatCurrency(data.totalAmount) : "VERIFIED ON ORDER"}
                    </p>
                  </div>
                </div>

                {/* Submitted UTR Box */}
                <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      SUBMITTED TRANSACTION ID / UTR
                    </span>
                    <p className="text-base sm:text-lg font-black text-white tracking-widest">
                      {data?.payment?.utr || submittedUtr || "RECORDED IN DATABASE"}
                    </p>
                  </div>

                  {(data?.payment?.utr || submittedUtr) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyUtr(data?.payment?.utr || submittedUtr)}
                      leftIcon={
                        copiedUtr ? (
                          <Check className="h-3.5 w-3.5 text-[#00DF8F]" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )
                      }
                      className="text-xs shrink-0"
                    >
                      {copiedUtr ? "COPIED" : "COPY UTR"}
                    </Button>
                  )}
                </div>

                {/* Live Real-Time Polling Status */}
                <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-[#1F1F1F] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <div>
                      <p className="font-bold text-white">REAL-TIME GATE SYNC ACTIVE</p>
                      <p className="text-[10px] text-[#A0A0A0] font-sans">
                        Auto-checking database every 3 seconds (Checked {pollCount} times)
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => checkStatus(true)}
                    isLoading={isManualChecking}
                    leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isManualChecking ? "animate-spin" : ""}`} />}
                    className="text-xs text-slate-300 hover:text-white"
                  >
                    Check Status Now
                  </Button>
                </div>

                {/* 4-Step Verification Progress Bar */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-bold text-[#6F6F6F] uppercase block">
                    ADMISSION PIPELINE
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span className="text-[10px] font-bold">1. Order Held</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span className="text-[10px] font-bold">2. UTR Logged</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-2 animate-pulse">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span className="text-[10px] font-bold">3. Admin Review</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0D0D0D] border border-[#222222] text-[#6F6F6F] flex items-center gap-2">
                      <Lock className="h-4 w-4 shrink-0" />
                      <span className="text-[10px] font-bold">4. Pass Active</span>
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#1A1A1A] text-xs text-[#A0A0A0] space-y-1 font-sans">
                  <p className="font-bold text-white font-mono text-[11px] uppercase">
                    &bull; IMPORTANT GATE NOTE:
                  </p>
                  <p className="leading-relaxed">
                    Passes are cryptographically generated and issued <strong>only after</strong> the gate checker admin verifies the transaction ID against the bank receipt. You do not need to refresh this page; it will instantly transform into your digital pass upon verification.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. CONFIRMED STATE — APPROVED BY ADMIN & PASS GENERATED */}
          {/* ========================================================================= */}
          {pageState === "CONFIRMED" && activePass && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Top Dramatic Confirmation Banner */}
              <div className="text-center mb-8 space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-[#FF0000]/15 border-2 border-[#FF0000] text-[#FF0000] flex items-center justify-center mx-auto shadow-[0_0_35px_rgba(255,0,0,0.5)] animate-in zoom-in-75 duration-300">
                  <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#080808] border border-[#FF0000]/40 text-[#FF0000] text-xs font-mono font-bold tracking-widest uppercase">
                  <Flame className="h-3.5 w-3.5 fill-[#FF0000]" />
                  PAYMENT APPROVED &bull; PASS ISSUED
                </div>

                <h1 className="text-6xl sm:text-8xl lg:text-9xl font-black text-white font-display uppercase tracking-tight leading-none">
                  YOU&apos;RE <span className="text-[#FF0000] glow-red-lg">IN.</span>
                </h1>

                <div className="max-w-xs mx-auto">
                  <BrushStroke color="#FF0000" className="opacity-75" />
                </div>

                <p className="text-xs sm:text-sm font-mono text-[#A0A0A0] max-w-md mx-auto uppercase tracking-wider pt-2">
                  YOUR CREDENTIAL HAS BEEN VERIFIED AND LOGGED IN THE DOOR VERIFICATION LEDGER.
                </p>
              </div>

              {/* Multi-pass Selector if Order Contains Multiple Passes */}
              {data && data.passes.length > 1 && (
                <div className="flex items-center justify-center gap-2 pb-2">
                  {data.passes.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPassIndex(idx)}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                        selectedPassIndex === idx
                          ? "bg-[#FF0000] text-black border-[#FF0000] shadow-[0_0_15px_rgba(255,0,0,0.4)]"
                          : "bg-[#0D0D0D] text-[#A0A0A0] border-[#222222] hover:text-white"
                      }`}
                    >
                      Pass {idx + 1} ({p.ticketTypeName})
                    </button>
                  ))}
                </div>
              )}

              {/* Render Holographic Pass Card */}
              <DigitalPassCard pass={activePass} />

              {/* Navigation Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                <Link
                  href={`/my-pass?contact=${encodeURIComponent(
                    activePass.attendeePhone || activePass.attendeeEmail || activePass.registrationNo
                  )}`}
                >
                  <Button variant="neon" size="lg" leftIcon={<Ticket className="h-4 w-4 text-black" />}>
                    VIEW ALL MY PASSES
                  </Button>
                </Link>
                <Link href="/event">
                  <Button variant="outline" size="lg">
                    BACK TO EVENT &rarr;
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. REJECTED STATE — REJECTED BY ADMIN & PASS NOT GENERATED */}
          {/* ========================================================================= */}
          {pageState === "REJECTED" && (
            <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl mx-auto">
              <div className="text-center space-y-4">
                <div className="h-20 w-20 rounded-2xl bg-rose-500/15 border-2 border-rose-500 text-rose-400 flex items-center justify-center mx-auto shadow-[0_0_35px_rgba(244,63,94,0.4)]">
                  <XCircle className="h-10 w-10 stroke-[2.5]" />
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0D0D0D] border border-rose-500/40 text-rose-400 text-xs font-mono font-bold tracking-widest uppercase">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  PAYMENT VERIFICATION REJECTED
                </div>

                <h1 className="text-4xl sm:text-6xl font-black text-white font-display uppercase tracking-tight">
                  PASS <span className="text-rose-500">NOT GENERATED</span>
                </h1>

                <p className="text-xs sm:text-sm font-mono text-[#A0A0A0] max-w-lg mx-auto uppercase tracking-wider">
                  THE GATE CHECKER ADMIN WAS UNABLE TO VERIFY YOUR TRANSACTION REFERENCE.
                </p>
              </div>

              {/* Rejection Details Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#080808] border border-rose-500/30 space-y-6 font-mono">
                <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-200 space-y-1.5 text-xs font-sans">
                  <p className="font-bold text-white font-mono text-[11px] uppercase flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    REASON FOR REJECTION:
                  </p>
                  <p className="text-rose-300 font-semibold leading-relaxed">
                    {data?.payment?.adminNotes || "Transaction reference / UTR could not be verified in the bank ledger."}
                  </p>
                </div>

                <div className="space-y-3 text-xs text-[#A0A0A0] font-mono">
                  <div className="flex justify-between py-2 border-b border-[#1F1F1F]">
                    <span>REGISTRATION NO:</span>
                    <strong className="text-white">{data?.registrationNo || regNo}</strong>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1F1F1F]">
                    <span>SUBMITTED UTR:</span>
                    <strong className="text-rose-400">{data?.payment?.utr || submittedUtr || "N/A"}</strong>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#1F1F1F]">
                    <span>PASS STATUS:</span>
                    <span className="text-rose-400 font-bold">CANCELLED &bull; 0 PASSES ISSUED</span>
                  </div>
                </div>

                <p className="text-xs text-[#A0A0A0] font-sans leading-relaxed">
                  Your ticket hold has been released back into the ticket pool. If you believe this was an error or you entered an incorrect UTR, please register again with the correct transaction reference or speak to our desk.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link href="/tickets" className="flex-1">
                    <Button variant="neon" size="lg" className="w-full">
                      RESERVE NEW PASS
                    </Button>
                  </Link>
                  <Link href="/faq" className="flex-1">
                    <Button variant="outline" size="lg" className="w-full">
                      CONTACT SUPPORT
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
