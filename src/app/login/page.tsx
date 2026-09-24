"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { StageLight, NoiseOverlay } from "@/components/effects/visual-engine";
import {
  Smartphone,
  ArrowRight,
  ShieldCheck,
  Lock,
  QrCode,
  Flame,
} from "lucide-react";
import Link from "next/link";

export default function AttendeeLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, "");

    if (cleanPhone.length < 10) {
      toast({
        title: "Invalid Phone Number",
        message: "Please enter your valid 10-digit mobile number.",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/passes/my-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: cleanPhone }),
      });

      const json = await res.json();

      if (json.success && (json.data?.length > 0 || json.pendingRegistration)) {
        toast({
          title: "Passes Found",
          message: "Opening your verified credentials...",
          type: "success",
        });

        if (typeof window !== "undefined") {
          localStorage.setItem("attendee_phone", cleanPhone);
        }

        router.push(`/my-pass?contact=${encodeURIComponent(cleanPhone)}`);
      } else {
        toast({
          title: "No Passes Found",
          message: `No active registrations found for ${cleanPhone}. Please verify or register for tickets.`,
          type: "warning",
        });
      }
    } catch (err) {
      console.error("Login lookup error:", err);
      toast({
        title: "Connection Error",
        message: "Failed to connect to the database. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#030303] text-[#F5F5F5]">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center pt-28 pb-20 px-4 sm:px-6 relative overflow-hidden font-mono">
        <StageLight position="top" intensity="medium" />
        <NoiseOverlay opacity={0.035} />

        <div className="w-full max-w-md space-y-6 relative z-10">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#080808] border border-[#FF0000]/40 text-[#FF0000] text-xs font-mono font-bold tracking-widest uppercase">
              <Smartphone className="h-3.5 w-3.5" />
              ATTENDEE PHONE LOGIN
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white font-display uppercase tracking-tight">
              ACCESS YOUR <span className="text-[#FF0000] glow-red">PASS</span>
            </h1>
            <p className="text-xs text-[#A0A0A0] uppercase font-mono">
              ENTER YOUR REGISTERED 10-DIGIT MOBILE NUMBER FOR INSTANT GATE ACCESS
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-[#080808] border border-[#222222] space-y-6 shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white uppercase tracking-wider block">
                  Registered Mobile Number *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 font-bold font-mono text-xs text-[#FF0000] border-r border-[#222222] pr-2">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full rounded-xl bg-[#0D0D0D] border border-[#222222] pl-14 pr-4 py-3 text-sm text-white font-mono placeholder:text-[#555555] focus:outline-none focus:border-[#FF0000] tracking-wider"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-[#A0A0A0] font-sans">
                  Instant lookup &bull; No password needed &bull; Direct gate pass
                </p>
              </div>

              <Button
                type="submit"
                variant="neon"
                size="xl"
                className="w-full text-xs font-display tracking-wider"
                isLoading={isLoading}
                leftIcon={<Lock className="h-4 w-4 text-black" />}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                ACCESS MY PASS
              </Button>
            </form>

            <div className="pt-2 border-t border-[#1A1A1A] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A0A0A0]">Haven&apos;t booked passes yet?</span>
                <Link href="/tickets" className="text-[#FF0000] font-bold hover:underline">
                  Book Passes &rarr;
                </Link>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#141414]">
                <span className="text-[#6F6F6F]">Door Staff & Operations?</span>
                <Link href="/admin/login" className="text-[#A0A0A0] hover:text-white">
                  Staff Console
                </Link>
              </div>
            </div>
          </div>

          {/* Feature Badges */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-[#6F6F6F] font-mono">
            <span className="flex items-center gap-1 text-[#00DF8F]">
              <ShieldCheck className="h-3.5 w-3.5" /> Database Sync
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 text-white">
              <QrCode className="h-3.5 w-3.5 text-[#FF0000]" /> HMAC Signed QR
            </span>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
