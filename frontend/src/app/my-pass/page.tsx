"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { DigitalPassCard } from "@/components/pass/digital-pass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { DigitalPassDTO } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { StageLight, SectionMarker, NoiseOverlay } from "@/components/effects/visual-engine";
import {
  ShieldCheck,
  Search,
  Mail,
  Ticket,
  ArrowRight,
  Hourglass,
  Clock,
  CheckCircle2,
  Flame,
} from "lucide-react";
import Link from "next/link";

interface PendingRegInfo {
  registrationNo: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  utr: string | null;
}

export default function MyPassPage() {
  const searchParams = useSearchParams();
  const contactParam = searchParams.get("contact") || "";

  const { toast } = useToast();
  const [contact, setContact] = useState(contactParam);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [passes, setPasses] = useState<DigitalPassDTO[]>([]);
  const [pendingInfo, setPendingInfo] = useState<PendingRegInfo | null>(null);
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    if (!contact.trim()) return;
    setIsResending(true);
    try {
      const res = await fetch("/api/passes/resend-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactOrRegNo: contact.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: "Email Dispatched",
          message: json.message || "Pass and itemized invoice sent to your email.",
          type: "success",
        });
      } else {
        toast({
          title: "Email Error",
          message: json.error || "Could not dispatch email.",
          type: "error",
        });
      }
    } catch {
      toast({
        title: "Network Error",
        message: "Failed to dispatch email.",
        type: "error",
      });
    } finally {
      setIsResending(false);
    }
  };

  const fetchPasses = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setPendingInfo(null);

    try {
      const res = await fetch("/api/passes/my-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: query.trim() }),
      });

      const json = await res.json();
      if (json.success) {
        if (json.data && json.data.length > 0) {
          setPasses(json.data);
          toast({
            title: "Passes Retrieved",
            message: `Found ${json.data.length} active pass(es).`,
            type: "success",
          });
        } else if (json.pendingRegistration) {
          setPasses([]);
          setPendingInfo(json.pendingRegistration);
        } else {
          setPasses([]);
          toast({
            title: "No Passes Found",
            message: "No registered pass found for this contact.",
            type: "info",
          });
        }
      } else {
        setPasses([]);
      }
    } catch (err) {
      console.error("Pass lookup error:", err);
      toast({
        title: "Search Error",
        message: "Failed to retrieve passes. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contactParam) {
      fetchPasses(contactParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) {
      toast({
        title: "Input Required",
        message: "Please enter your registered mobile number, email, or registration ID.",
        type: "warning",
      });
      return;
    }
    fetchPasses(contact);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#030303] text-[#F5F5F5]">
      <PublicNavbar />

      <main className="flex-1 pt-28 pb-20 relative overflow-hidden">
        <StageLight position="top" intensity="medium" />
        <NoiseOverlay opacity={0.03} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#080808] border border-[#FF0000]/40 text-[#FF0000] text-xs font-mono font-bold tracking-widest uppercase mb-3 shadow-[0_0_15px_rgba(255,0,0,0.25)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              SECURE DOOR CREDENTIAL PORTAL
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white font-display uppercase tracking-tight">
              MY DIGITAL <span className="text-[#FF0000] glow-red">PASSES</span>
            </h1>
            <p className="text-xs sm:text-sm font-mono text-[#A0A0A0] mt-2 max-w-lg mx-auto uppercase">
              ENTER MOBILE NUMBER, EMAIL, OR REGISTRATION ID TO INSTANTLY ACCESS YOUR QR PASS
            </p>
          </div>

          {/* Quick Search Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#080808] border border-[#222222] mb-12 max-w-2xl mx-auto shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
            <form onSubmit={handleSearch} className="space-y-4">
              <Input
                label="Registered Mobile Number, Email, or Registration ID"
                placeholder="e.g. 9876543210 or aryan@college.edu or XP26-..."
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                required
              />
              <Button
                type="submit"
                variant="neon"
                className="w-full text-xs font-display tracking-wider"
                size="lg"
                isLoading={loading}
                leftIcon={<Search className="h-4 w-4 text-black" />}
              >
                RETRIEVE ADMISSION PASSES
              </Button>
            </form>
          </div>

          {/* Results Area */}
          {loading ? (
            <div className="py-16 flex justify-center">
              <Spinner size="lg" label="Searching Encrypted Registration Ledger..." />
            </div>
          ) : searched && passes.length > 0 ? (
            <div className="space-y-10 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A1A1A] pb-4">
                <div>
                  <h2 className="text-xl font-black text-white font-display uppercase tracking-wide">
                    VERIFIED CREDENTIALS ({passes.length})
                  </h2>
                  <span className="text-xs font-mono text-[#00DF8F] font-bold flex items-center gap-1.5 mt-0.5">
                    <ShieldCheck className="h-4 w-4" />
                    LIVE CRYPTOGRAPHIC QR VERIFIED
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResendEmail}
                    isLoading={isResending}
                    leftIcon={<Mail className="h-3.5 w-3.5 text-[#FF0000]" />}
                    className="text-xs font-mono"
                  >
                    Email Me Pass & Bill
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {passes.map((pass) => (
                  <DigitalPassCard key={pass.id} pass={pass} />
                ))}
              </div>
            </div>
          ) : searched && pendingInfo ? (
            <div className="p-8 rounded-2xl bg-[#080808] border border-[#222222] text-center space-y-6 max-w-xl mx-auto animate-in fade-in duration-300 font-mono">
              <div className="h-16 w-16 rounded-2xl bg-[#FF0000]/10 border border-[#FF0000]/30 text-[#FF0000] flex items-center justify-center mx-auto">
                <Hourglass className="h-8 w-8 animate-pulse" />
              </div>

              <div className="space-y-2">
                <Badge variant="pending" size="md">
                  {pendingInfo.paymentStatus === "PENDING_VERIFICATION"
                    ? "PAYMENT UNDER VERIFICATION"
                    : "PAYMENT PENDING"}
                </Badge>
                <h2 className="text-2xl font-black text-white font-display uppercase tracking-tight">
                  REGISTRATION {pendingInfo.registrationNo} RECORDED
                </h2>
                <p className="text-xs text-[#A0A0A0] font-sans">
                  {pendingInfo.paymentStatus === "PENDING_VERIFICATION"
                    ? `Your transaction reference (${pendingInfo.utr || "Submitted"}) is recorded in the verification ledger. Your cryptographic QR passes will activate immediately upon verification.`
                    : "Payment for this registration has not been submitted yet."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#222222] text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#6F6F6F]">TOTAL PAYABLE:</span>
                  <span className="font-bold text-white font-display text-sm">
                    {formatCurrency(pendingInfo.totalAmount)}
                  </span>
                </div>
                {pendingInfo.utr && (
                  <div className="flex justify-between">
                    <span className="text-[#6F6F6F]">SUBMITTED UTR:</span>
                    <span className="font-bold text-[#FF0000]">{pendingInfo.utr}</span>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchPasses(contact)}
                leftIcon={<Search className="h-3.5 w-3.5" />}
              >
                Refresh Verification Status
              </Button>
            </div>
          ) : searched && passes.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-[#080808] border border-dashed border-[#222222] max-w-md mx-auto p-6 font-mono">
              <Ticket className="h-10 w-10 text-[#FF0000] mx-auto mb-3" />
              <h3 className="text-lg font-black text-white font-display uppercase">No Passes Found</h3>
              <p className="text-xs text-[#A0A0A0] mt-1 font-sans">
                We couldn&apos;t locate any confirmed pass under &ldquo;{contact}&rdquo;. Please verify your mobile number or book new passes.
              </p>
              <div className="pt-4">
                <Link href="/tickets">
                  <Button variant="primary" size="md">
                    Choose Your Pass &rarr;
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-14 border border-dashed border-[#222222] rounded-2xl bg-[#080808]/50 max-w-xl mx-auto p-6">
              <Flame className="h-8 w-8 text-[#FF0000] mx-auto mb-3" />
              <h3 className="text-lg font-black text-white font-display uppercase">Instant Mobile Door Access</h3>
              <p className="text-xs text-[#A0A0A0] max-w-sm mx-auto font-mono mt-1">
                NO ACCOUNT OR PASSWORD REQUIRED. ENTER YOUR MOBILE NUMBER AT EVENT GATES TO DISPLAY YOUR SECURE QR PASS.
              </p>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
