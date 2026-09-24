"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { MerchantGateway } from "@/components/payment/merchant-gateway";
import { StageLight, SectionMarker, NoiseOverlay } from "@/components/effects/visual-engine";
import {
  ShieldCheck,
  Clock,
  Lock,
  ArrowRight,
  Ticket,
  Sparkles,
  AlertTriangle,
  Flame,
} from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registrationId = searchParams.get("registrationId");
  const registrationNo = searchParams.get("regNo") || "XP26-PENDING";
  const amount = parseInt(searchParams.get("amount") || "0", 10);

  const { toast } = useToast();
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(600); // 10 minutes atomic reservation window
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handlePaymentSuccess = (result: { status: string; message: string; passIds?: string[]; utr?: string }) => {
    router.push(
      `/payment-success?regNo=${encodeURIComponent(registrationNo)}&regId=${encodeURIComponent(
        registrationId || ""
      )}&utr=${encodeURIComponent(result.utr || "")}`
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#030303] text-[#F5F5F5]">
      <PublicNavbar />

      <main className="flex-1 pt-28 pb-20 relative overflow-hidden">
        <StageLight position="top" intensity="low" />
        <NoiseOverlay opacity={0.03} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#080808] border border-[#FF0000]/40 text-[#FF0000] text-xs font-mono font-bold tracking-widest uppercase mb-3 shadow-[0_0_15px_rgba(255,0,0,0.25)]">
              <Lock className="h-3.5 w-3.5" />
              SECURE ENCRYPTED CHECKOUT
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white font-display uppercase tracking-tight">
              COMPLETE PAYMENT &bull; <span className="text-[#FF0000] glow-red">ISSUE PASS</span>
            </h1>
            <p className="text-xs sm:text-sm font-mono text-[#A0A0A0] mt-2 max-w-xl mx-auto uppercase">
              INSTANT PAYMENT AUTHORIZATION &bull; REAL-TIME HMAC PASS ISSUANCE
            </p>
          </div>

          {/* 10-Minute Reservation Hold Timer Banner */}
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-[#080808] border border-[#222222] flex items-center justify-between shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#FF0000]/10 border border-[#FF0000]/30 flex items-center justify-center text-[#FF0000] shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div className="font-mono">
                <p className="text-xs font-bold text-white uppercase tracking-wider">
                  RESERVATION LOCK ACTIVE
                </p>
                <p className="text-[11px] text-[#A0A0A0]">
                  REGISTRATION NO: <span className="text-white font-bold">{registrationNo}</span>
                </p>
              </div>
            </div>

            <div className="text-right font-mono">
              <span
                className={`text-2xl font-black ${
                  timeLeftSeconds < 120 ? "text-[#FF0000] animate-pulse" : "text-white"
                }`}
              >
                {formatTimer(timeLeftSeconds)}
              </span>
              <p className="text-[9px] font-bold text-[#A0A0A0] uppercase tracking-wider">
                HOLD TIME REMAINING
              </p>
            </div>
          </div>

          {/* Merchant Gateway Component */}
          <MerchantGateway
            registrationId={registrationId || ""}
            registrationNo={registrationNo}
            amount={amount}
            onPaymentSuccess={handlePaymentSuccess}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />

          {/* Trust Guarantees */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#A0A0A0] font-mono">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#FF0000]" />
              <span>Direct Bank Reconciliation</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#FF0000]" />
              <span>HMAC-SHA256 Encrypted Pass</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#FF0000]" />
              <span>256-Bit SSL Secured</span>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
