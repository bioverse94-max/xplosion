import React from "react";
import Link from "next/link";
import { Flame, ShieldCheck, MapPin, Mail, Clock, Lock } from "lucide-react";
import { BrushStroke } from "@/components/effects/visual-engine";

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-[#030303] border-t border-[#1A1A1A] text-[#A0A0A0] pt-20 pb-12 relative overflow-hidden font-mono">
      {/* Subtle Red Ground Glow */}
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[radial-gradient(ellipse_at_bottom,rgba(255,0,0,0.12)_0%,transparent_70%)] pointer-events-none blur-[90px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Massive Brand Statement */}
        <div className="text-center pb-16 border-b border-[#1A1A1A] space-y-3">
          <h2 className="text-6xl sm:text-8xl md:text-9xl font-black font-display text-white tracking-tight uppercase leading-none select-none">
            XPLOSION <span className="text-[#FF0000] glow-red">2K26</span>
          </h2>
          <p className="text-sm sm:text-base font-extrabold uppercase tracking-widest text-[#E5E5E5] font-display">
            THE NIGHT STARTS HERE.
          </p>
          <div className="max-w-xs mx-auto pt-1">
            <BrushStroke color="#FF0000" className="opacity-75" />
          </div>
        </div>

        {/* 4 Column Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 py-12 border-b border-[#1A1A1A] text-xs">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#FF0000] flex items-center justify-center">
                <Flame className="h-5 w-5 text-black fill-black" />
              </div>
              <span className="text-base font-black text-white font-display uppercase tracking-wider">
                XPLOSION 2K26
              </span>
            </div>
            <p className="text-[#A0A0A0] leading-relaxed font-sans text-xs">
              The ultimate college afterparty. Digital ticketing, real-time atomic inventory reservations, and HMAC cryptographic door validation.
            </p>
            <div className="flex items-center gap-1.5 text-[#00DF8F] font-bold">
              <ShieldCheck className="h-4 w-4" />
              <span>Cryptographically Secured</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{"//"} PLATFORM</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/event" className="hover:text-[#FF0000] transition-colors">EVENT DOSSIER</Link>
              </li>
              <li>
                <Link href="/tickets" className="hover:text-[#FF0000] transition-colors">TICKETS & TIERS</Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#FF0000] transition-colors">REGISTER PASS</Link>
              </li>
              <li>
                <Link href="/my-pass" className="hover:text-[#FF0000] transition-colors">MY PASS PORTAL</Link>
              </li>
            </ul>
          </div>

          {/* Venue & Logistics */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{"//"} VENUE & SCHEDULE</h4>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#FF0000] shrink-0 mt-0.5" />
                <span>Reborn Club & Kitchen, Outer Ring Road, Bhubaneswar</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#FF0000] shrink-0" />
                <span>Saturday 26.09.26 &bull; 12 PM Onwards</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#A0A0A0] shrink-0" />
                <span>tickets@xplosion2k26.com</span>
              </li>
            </ul>
          </div>

          {/* Legal & Operations */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{"//"} POLICY & ACCESS</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="hover:text-[#FF0000] transition-colors">FAQ & ADMISSION RULES</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#FF0000] transition-colors">TERMS OF SERVICE</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#FF0000] transition-colors">PRIVACY POLICY</Link>
              </li>
              <li className="pt-2">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#121212] border border-[#262626] text-[11px] text-[#A0A0A0] hover:text-[#FF0000] hover:border-[#FF0000]/40 transition-colors font-mono"
                >
                  <Lock className="h-3 w-3 text-[#FF0000]" />
                  <span>ORGANIZER CONSOLE (ADMIN LOGIN)</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#6F6F6F]">
          <p>© 2026 XPLOSION 2K26 Organizing Committee. All rights reserved.</p>
          <p>
            Built on Enterprise Event-Ticketing Architecture. All check-ins are cryptographically logged.
          </p>
        </div>
      </div>
    </footer>
  );
};
