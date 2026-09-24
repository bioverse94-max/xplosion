"use client";

import React, { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { DigitalPassDTO } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import {
  Download,
  Share2,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Printer,
  QrCode,
  Flame,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

export interface DigitalPassCardProps {
  pass: DigitalPassDTO;
  showActions?: boolean;
}

export const DigitalPassCard: React.FC<DigitalPassCardProps> = ({ pass, showActions = true }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const passCardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (pass.qrToken) {
      QRCode.toDataURL(pass.qrToken, {
        width: 360,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "H",
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR Generation failed:", err));
    }
  }, [pass.qrToken]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `XPLOSION 2K26 Admission Pass - ${pass.attendeeName}`,
          text: `My verified entry credential for XPLOSION 2K26 (${pass.passCode}).`,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied", message: "Pass URL copied to clipboard.", type: "info" });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isCheckedIn = pass.status === "CHECKED_IN";

  return (
    <div className="flex flex-col items-center max-w-md mx-auto w-full select-none">
      {/* Physical Event Credential Card */}
      <div
        ref={passCardRef}
        className={`w-full rounded-3xl overflow-hidden border transition-all duration-300 relative shadow-[0_20px_50px_rgba(0,0,0,0.9)] ${
          isCheckedIn
            ? "border-[#444444] bg-[#0A0A0A]"
            : "border-[#FF0000]/70 bg-gradient-to-b from-[#110505] via-[#0A0A0A] to-[#050505] shadow-[0_0_40px_rgba(255,0,0,0.25)]"
        }`}
      >
        {/* Top Solid Red Accent Bar */}
        <div className="h-3 w-full bg-[#FF0000] shadow-[0_0_15px_#FF0000]" />

        <div className="p-6 sm:p-7 space-y-6">
          {/* Card Header: Brand & Status */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-[#FF0000] flex items-center justify-center shadow-[0_0_15px_rgba(255,0,0,0.5)]">
                <Flame className="h-6 w-6 text-black fill-black" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black tracking-widest text-[#FF0000] uppercase block">
                  OFFICIAL ADMISSION CREDENTIAL
                </span>
                <h3 className="text-xl font-black text-white font-display uppercase tracking-tight">
                  XPLOSION 2K26
                </h3>
              </div>
            </div>

            <Badge variant={isCheckedIn ? "checked_in" : "valid"} size="md">
              {isCheckedIn ? "CHECKED IN" : "VALID PASS"}
            </Badge>
          </div>

          {/* Tagline */}
          <div className="text-[10px] font-mono font-bold tracking-widest text-[#A0A0A0] uppercase border-y border-[#1F1F1F] py-1.5 flex items-center justify-between">
            <span>THE ULTIMATE COLLEGE AFTERPARTY</span>
            <span className="text-[#FF0000]">&bull; 18+ ONLY</span>
          </div>

          {/* Attendee Info Section */}
          <div className="p-4 rounded-xl bg-[#080808] border border-[#222222] space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-[#1A1A1A]">
              <div>
                <p className="text-[10px] font-bold text-[#6F6F6F] uppercase">ATTENDEE</p>
                <h4 className="text-lg font-black text-white font-display uppercase">{pass.attendeeName}</h4>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-[#6F6F6F] uppercase">TICKET CATEGORY</p>
                <span className="text-xs font-bold text-[#FF0000] uppercase bg-[#FF0000]/10 border border-[#FF0000]/30 px-2 py-0.5 rounded">
                  {pass.ticketTypeName}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-[#A0A0A0]">
              <div>
                <p className="text-[10px] text-[#555555]">COLLEGE / INSTITUTION</p>
                <p className="font-medium text-white truncate">{pass.college}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#555555]">BATCH & BRANCH</p>
                <p className="font-medium text-white truncate">{pass.branch}</p>
              </div>
            </div>
          </div>

          {/* ── High-Contrast Optical QR Scanner Centerpiece ── */}
          {/* Note: The QR itself sits on clean, unobstructed pure white background for 100% optical readability */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white text-black shadow-inner relative overflow-hidden">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Official Gate Scan QR ${pass.passCode}`}
                className="w-56 h-56 object-contain"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center bg-slate-100 rounded-xl">
                <QrCode className="h-14 w-14 text-slate-400 animate-pulse" />
              </div>
            )}

            <div className="mt-3 text-center w-full">
              <span className="text-xs font-mono font-black tracking-widest text-black bg-slate-100 px-3 py-1 rounded border border-slate-300 inline-block">
                {pass.passCode}
              </span>
              <p className="text-[9px] text-slate-600 font-mono font-bold tracking-wider uppercase mt-1">
                HMAC-SHA256 CRYPTOGRAPHIC SIGNATURE &bull; SCAN AT DOOR GATE
              </p>
            </div>
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1 text-xs text-[#A0A0A0] font-mono">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-[#FF0000] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-[#6F6F6F] font-bold">DATE & TIME</p>
                <p className="font-bold text-white">26.09.26 &bull; SATURDAY</p>
                <p className="text-[11px] text-[#A0A0A0]">{pass.doorsOpenTime || "12 PM ONWARDS"}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-[#FF0000] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-[#6F6F6F] font-bold">VENUE</p>
                <p className="font-bold text-white truncate">{pass.venueName || "REBORN CLUB & KITCHEN"}</p>
                <p className="text-[11px] text-[#A0A0A0] truncate">{pass.venueAddress}</p>
              </div>
            </div>
          </div>

          {/* Checked in timestamp badge if checked in */}
          {isCheckedIn && pass.checkedInAt && (
            <div className="p-3 rounded-xl bg-[#141414] border border-[#333333] text-xs text-white flex items-center gap-2 font-mono">
              <CheckCircle2 className="h-4 w-4 text-[#00DF8F] shrink-0" />
              <span>
                Checked in at {new Date(pass.checkedInAt).toLocaleTimeString("en-IN")} by{" "}
                {pass.checkedInBy || "Door Gate"}
              </span>
            </div>
          )}

          {/* Pass Footer Security Stamp */}
          <div className="pt-4 border-t border-[#1F1F1F] flex items-center justify-between text-[10px] font-mono text-[#6F6F6F]">
            <span>REG REF: {pass.registrationNo}</span>
            <span className="flex items-center gap-1 text-[#00DF8F] font-bold">
              <ShieldCheck className="h-3.5 w-3.5" />
              CRYPTOGRAPHICALLY VERIFIED
            </span>
          </div>
        </div>
      </div>

      {/* Share / Print Actions */}
      {showActions && (
        <div className="grid grid-cols-2 gap-3 w-full mt-6">
          <Button variant="outline" onClick={handleShare} leftIcon={<Share2 className="h-4 w-4" />}>
            Share Pass
          </Button>
          <Button variant="primary" onClick={handlePrint} leftIcon={<Printer className="h-4 w-4" />}>
            Print / PDF
          </Button>
        </div>
      )}
    </div>
  );
};
