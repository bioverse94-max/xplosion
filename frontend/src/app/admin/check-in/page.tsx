"use client";

import React, { useState, useEffect, useRef } from "react";
import { AdminHeader } from "@/components/layout/admin-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { CheckInVerificationResult } from "@/types";
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Volume2,
  VolumeX,
  Camera,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  User,
} from "lucide-react";

export default function AdminCheckInPage() {
  const { toast } = useToast();
  const [inputCode, setInputCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastResult, setLastResult] = useState<CheckInVerificationResult | null>(null);
  const [scanHistory, setScanHistory] = useState<CheckInVerificationResult[]>([]);
  const [gateLocation, setGateLocation] = useState("Main Entrance Gate A");
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const scannerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const html5QrCodeRef = useRef<any>(null);

  useEffect(() => {
    if (isCameraOpen) {
      import("html5-qrcode").then(({ Html5Qrcode }) => {
        const qrCodeRegionId = "camera-qr-reader";
        const html5QrCode = new Html5Qrcode(qrCodeRegionId);
        html5QrCodeRef.current = html5QrCode;

        const config = { fps: 10, qrbox: { width: 220, height: 220 } };
        html5QrCode
          .start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              handleVerify(decodedText);
            },
            () => {}
          )
          .catch((err) => {
            console.warn("Camera start warning:", err);
            toast({
              title: "Camera Access Notice",
              message: "Please allow camera access in browser to scan QR codes with camera.",
              type: "warning",
            });
            setIsCameraOpen(false);
          });
      }).catch((e) => {
        console.error("Html5Qrcode import error:", e);
      });
    } else {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop().then(() => {
            html5QrCodeRef.current?.clear();
            html5QrCodeRef.current = null;
          }).catch(() => {
            html5QrCodeRef.current = null;
          });
        } catch {
          html5QrCodeRef.current = null;
        }
      }
    }

    return () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop().then(() => {
            html5QrCodeRef.current?.clear();
            html5QrCodeRef.current = null;
          }).catch(() => {});
        } catch {}
      }
    };
  }, [isCameraOpen]);

  // Initialize Web Audio API
  const playAudioCue = (type: "VALID" | "ALREADY_CHECKED_IN" | "INVALID") => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "VALID") {
        // High crisp double chime (880Hz -> 1320Hz)
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === "ALREADY_CHECKED_IN") {
        // Warning double pulse (330Hz)
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        // Invalid alert siren (220Hz low tone)
        osc.type = "square";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // Audio cue skipped
    }

    // Vibration feedback on supported mobile devices
    if (navigator.vibrate) {
      if (type === "VALID") navigator.vibrate(100);
      else if (type === "ALREADY_CHECKED_IN") navigator.vibrate([100, 50, 100]);
      else navigator.vibrate([200, 100, 200]);
    }
  };

  const handleVerify = async (codeToVerify: string) => {
    const trimmed = codeToVerify.trim();
    if (!trimmed) return;

    setIsVerifying(true);
    try {
      const res = await fetch("/api/admin/checkin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenOrCode: trimmed,
          gateLocation,
        }),
      });

      const json = await res.json();
      const result: CheckInVerificationResult = json.data || {
        status: "INVALID",
        message: json.error || "Pass verification rejected.",
      };

      setLastResult(result);
      setScanHistory((prev) => [result, ...prev.slice(0, 19)]);
      playAudioCue(result.status);

      if (result.status === "VALID") {
        toast({ title: "VALID PASS", message: `${result.pass?.attendeeName} (${result.pass?.ticketTypeName})`, type: "success" });
      } else if (result.status === "ALREADY_CHECKED_IN") {
        toast({ title: "ALREADY USED", message: result.message, type: "warning" });
      } else {
        toast({ title: "INVALID PASS", message: result.message, type: "error" });
      }

      setInputCode("");
    } catch (err) {
      console.error("Check-in error:", err);
      const failResult: CheckInVerificationResult = {
        status: "INVALID",
        message: "Network or server connection error.",
      };
      setLastResult(failResult);
      playAudioCue("INVALID");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(inputCode);
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Nightclub Door Check-In"
        description="High-velocity QR token and Pass Code verification with multi-door sync."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-colors ${
                soundEnabled
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-surface border-surface-border text-slate-500"
              }`}
              title={soundEnabled ? "Audio Cues Enabled" : "Audio Cues Muted"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <select
              value={gateLocation}
              onChange={(e) => setGateLocation(e.target.value)}
              className="bg-surface border border-surface-border text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-primary"
            >
              <option>Main Entrance Gate A</option>
              <option>VIP Express Lane Gate B</option>
              <option>Backstage / Artist Entrance</option>
            </select>
          </div>
        }
      />

      <div className="p-6 sm:p-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Nightclub Big Status Screen Banner */}
        {lastResult && (
          <div
            className={`p-6 sm:p-8 rounded-3xl border text-center transition-all animate-in zoom-in-95 duration-200 shadow-2xl ${
              lastResult.status === "VALID"
                ? "bg-emerald-950/40 border-accent-emerald shadow-[0_0_50px_rgba(0,223,143,0.3)] text-emerald-300"
                : lastResult.status === "ALREADY_CHECKED_IN"
                ? "bg-amber-950/40 border-accent-amber shadow-[0_0_50px_rgba(255,184,0,0.3)] text-amber-300"
                : "bg-rose-950/40 border-accent-rose shadow-[0_0_50px_rgba(255,0,85,0.3)] text-rose-300"
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              {lastResult.status === "VALID" && (
                <>
                  <div className="h-20 w-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(0,223,143,0.5)]">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                  <div>
                    <h2 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-white uppercase">
                      VALID PASS &bull; ENTRY GRANTED
                    </h2>
                    <p className="text-xs sm:text-sm font-mono text-emerald-400 font-bold uppercase tracking-widest mt-1">
                      PAYMENT CONFIRMED &bull; DIGITAL HMAC VERIFIED
                    </p>
                  </div>

                  {lastResult.pass && (
                    <div className="w-full max-w-2xl bg-black/60 border border-emerald-500/40 rounded-2xl p-5 text-left space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                        <span className="text-emerald-400 font-bold text-sm tracking-wider uppercase flex items-center gap-1.5">
                          <User className="h-4 w-4" /> ATTENDEE IDENTITY DOSSIER
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/40">
                          {lastResult.pass.ticketTypeName}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Registered Student Name:</span>
                          <strong className="text-white text-base font-bold">{lastResult.pass.attendeeName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">College / Institution:</span>
                          <strong className="text-white text-sm">{lastResult.pass.college}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Branch & Academic Year:</span>
                          <strong className="text-white">{lastResult.pass.branch} &bull; {lastResult.pass.academicYear}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Verified Mobile (OTP):</span>
                          <strong className="text-emerald-400">+91 {lastResult.pass.attendeePhone} (✓ Verified)</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Personal Email (Pass Inbox):</span>
                          <strong className="text-white truncate block">{lastResult.pass.attendeePersonalEmail || lastResult.pass.attendeeEmail}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Pass Code / Order Ref:</span>
                          <strong className="text-primary font-bold">{lastResult.pass.passCode}</strong> ({lastResult.pass.registrationNo})
                        </div>
                      </div>

                      <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                        <span>Check-In Gate: <strong className="text-white">{gateLocation}</strong></span>
                        <span>Operator: <strong className="text-white">{lastResult.operatorName || "Door Security"}</strong></span>
                        <span className="text-emerald-400 font-bold">✓ Physical Student ID Matches</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {lastResult.status === "ALREADY_CHECKED_IN" && (
                <>
                  <div className="h-20 w-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(255,184,0,0.5)]">
                    <AlertTriangle className="h-12 w-12" />
                  </div>
                  <div>
                    <h2 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-white uppercase">
                      ALREADY CHECKED IN
                    </h2>
                    <p className="text-xs sm:text-sm font-mono text-amber-400 font-bold uppercase tracking-widest mt-1">
                      DUPLICATE ENTRY DETECTED &bull; DO NOT ADMIT
                    </p>
                  </div>
                  <div className="p-4 bg-black/60 border border-amber-500/40 rounded-2xl max-w-lg text-sm text-amber-200">
                    <p className="font-medium">{lastResult.message}</p>
                    {lastResult.pass && (
                      <p className="text-xs text-slate-300 font-mono mt-2 pt-2 border-t border-amber-500/20">
                        Pass Code: <strong className="text-white">{lastResult.pass.passCode}</strong> &bull; Holder: <strong className="text-white">{lastResult.pass.attendeeName}</strong>
                      </p>
                    )}
                  </div>
                </>
              )}

              {lastResult.status === "INVALID" && (
                <>
                  <div className="h-20 w-20 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-rose-400 shadow-[0_0_30px_rgba(255,0,85,0.5)]">
                    <XCircle className="h-12 w-12" />
                  </div>
                  <div>
                    <h2 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-white uppercase">
                      INVALID ENTRY PASS
                    </h2>
                    <p className="text-xs sm:text-sm font-mono text-rose-400 font-bold uppercase tracking-widest mt-1">
                      ADMISSION PROHIBITED &bull; PAYMENT UNCONFIRMED
                    </p>
                  </div>
                  <div className="p-4 bg-black/60 border border-rose-500/40 rounded-2xl max-w-lg text-sm text-rose-200">
                    <p className="font-medium">{lastResult.message}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Scanner / Input Panel */}
          <div className="lg:col-span-7 space-y-6">
            <Card glass className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-display">Scanner & Pass Search</h3>
                    <p className="text-xs text-slate-400">Point camera at QR or enter Pass Code</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={isCameraOpen ? "outline" : "secondary"}
                    size="sm"
                    onClick={() => setIsCameraOpen(!isCameraOpen)}
                    leftIcon={<Camera className="h-3.5 w-3.5" />}
                    className="text-xs"
                  >
                    {isCameraOpen ? "Close Camera" : "Open Camera Scanner"}
                  </Button>
                  <Badge variant="primary">DOOR READY</Badge>
                </div>
              </div>

              {/* Live Camera Viewfinder when Active */}
              {isCameraOpen && (
                <div className="p-4 rounded-2xl bg-black border border-primary/50 text-center space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                      Live Optical Camera Stream Active
                    </span>
                    <span className="text-[10px] text-slate-400">Aim camera at pass QR code</span>
                  </div>
                  <div id="camera-qr-reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border border-primary/30" />
                  <p className="text-[11px] text-slate-400 font-mono">
                    Hold attendee's pass QR matrix steadily in front of lens.
                  </p>
                </div>
              )}

              {/* Manual Pass Code or QR Token Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <Input
                  label="Scan QR Matrix or Enter Pass Code / Reg No / Phone"
                  placeholder="e.g. PASS-FRS26-4821 or FRS26-4821 or 9876543210"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  leftIcon={<QrCode className="h-4 w-4" />}
                  autoFocus
                />
                <Button
                  type="submit"
                  variant="neon"
                  size="xl"
                  className="w-full"
                  isLoading={isVerifying}
                  leftIcon={<ShieldCheck className="h-5 w-5 text-black" />}
                >
                  VERIFY & CHECK IN ATTENDEE
                </Button>
              </form>

              {/* Quick shortcut presets */}
              <div className="pt-2 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300">Door Staff Multi-Search:</span>
                <p>
                  You can verify attendees by scanning their QR code or typing their <strong>Pass Code</strong>, <strong>Registration No</strong>, <strong>Phone Number</strong>, or <strong>Email</strong>. The database verifies their ticket in real-time.
                </p>
              </div>
            </Card>
          </div>

          {/* Door Scan Feed */}
          <div className="lg:col-span-5">
            <Card glass className="p-6 space-y-4 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-surface-border pb-3 mb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Gate Activity Log</h3>
                  <span className="text-xs text-slate-400">{scanHistory.length} Scans</span>
                </div>

                {scanHistory.length === 0 ? (
                  <div className="text-center py-16 text-xs text-slate-500">
                    No scans recorded in current gate session.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {scanHistory.map((h, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          h.status === "VALID"
                            ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                            : h.status === "ALREADY_CHECKED_IN"
                            ? "bg-amber-950/20 border-amber-500/30 text-amber-300"
                            : "bg-rose-950/20 border-rose-500/30 text-rose-300"
                        }`}
                      >
                        <div>
                          <p className="font-bold text-white">{h.pass?.attendeeName || "Unknown Attendee"}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{h.pass?.passCode || "Invalid Code"}</p>
                        </div>
                        <Badge
                          variant={
                            h.status === "VALID" ? "success" : h.status === "ALREADY_CHECKED_IN" ? "warning" : "danger"
                          }
                          size="sm"
                        >
                          {h.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-surface-border text-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setScanHistory([])}
                  leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                >
                  Clear Session History
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
