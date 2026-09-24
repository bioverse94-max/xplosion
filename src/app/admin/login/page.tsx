"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { StageLight, NoiseOverlay, BrushStroke } from "@/components/effects/visual-engine";
import {
  Lock,
  Mail,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Flame,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  QrCode,
  Sliders,
} from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const redirectFrom = searchParams.get("from") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Invalid credentials or unauthorized account.");
      }

      toast({
        title: "Access Granted",
        message: `Welcome back, ${json.data.name} [${json.data.role}].`,
        type: "success",
      });

      router.push(redirectFrom);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      setErrorMessage(msg);
      toast({ title: "Access Denied", message: msg, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-[#FF0000] selection:text-black">
      {/* ── Layered Atmospheric Background ── */}
      <StageLight position="top" intensity="high" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[radial-gradient(ellipse_at_center,rgba(255,0,0,0.18)_0%,transparent_70%)] blur-[120px] pointer-events-none -z-10" />
      <NoiseOverlay opacity={0.045} />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Command Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center gap-2.5 group select-none mb-1">
            <div className="h-10 w-10 rounded-xl bg-[#FF0000] flex items-center justify-center shadow-[0_0_25px_rgba(255,0,0,0.6)] group-hover:scale-105 transition-transform">
              <Flame className="h-6 w-6 text-black stroke-[2.5]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight text-white font-display uppercase">
                XPLOSION
              </span>
              <span className="text-xl font-black font-display text-[#FF0000] tracking-wider">
                2K26
              </span>
            </div>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF0000]/10 border border-[#FF0000]/30 text-[#FF0000] text-[10px] font-mono font-bold tracking-widest uppercase">
            <ShieldCheck className="h-3 w-3" />
            OPERATIONS & DOOR SECURITY CONSOLE
          </div>

          <h1 className="text-3xl font-black text-white font-display uppercase tracking-tight">
            ADMINISTRATOR ACCESS
          </h1>
          <p className="text-xs text-[#A0A0A0] max-w-xs mx-auto">
            Restricted environment. All login attempts and gate check-ins are cryptographically logged.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl bg-[#080808]/95 border border-[#222222] p-6 sm:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.9)] relative overflow-hidden backdrop-blur-md">
          {/* Subtle Red Edge Accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#FF0000] to-transparent shadow-[0_0_12px_#FF0000]" />

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#FF0000]/10 border border-[#FF0000]/40 flex items-start gap-2.5 text-xs text-[#FF8080]">
              <ShieldAlert className="h-4 w-4 text-[#FF0000] shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Staff / Administrator Email"
              type="email"
              placeholder="admin@freshersparty.internal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4 text-[#FF0000]" />}
              required
              autoComplete="email"
              className="bg-[#050505] border-[#222222] focus:border-[#FF0000] text-white"
            />

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-[#A0A0A0] uppercase tracking-wider block">
                Security Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pl-10 pr-10 rounded-xl bg-[#050505] border border-[#222222] text-sm text-white placeholder-[#6F6F6F] focus:outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] transition-colors"
                />
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-[#FF0000]" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#6F6F6F] hover:text-white transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="neon"
                size="lg"
                className="w-full h-12 text-sm uppercase font-black font-display tracking-wider"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                AUTHORIZE & ENTER CONSOLE
              </Button>
            </div>
          </form>
        </div>

        {/* Footer Navigation */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#A0A0A0] hover:text-[#FF0000] transition-colors uppercase tracking-wider"
          >
            <span>&larr; Return to Public Event Website</span>
          </Link>
          <p className="text-[10px] text-[#555555] font-mono">
            HMAC-SHA256 Signed Sessions &bull; 24h Expiry
          </p>
        </div>
      </div>
    </div>
  );
}
