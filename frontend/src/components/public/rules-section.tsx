import React from "react";
import { ShieldAlert, CheckCircle2, AlertOctagon } from "lucide-react";
import { SectionMarker } from "@/components/effects/visual-engine";

export interface RulesSectionProps {
  rules?: string[];
}

export const RulesSection: React.FC<RulesSectionProps> = ({ rules }) => {
  const defaultRules = [
    "Valid physical college ID card along with your digital HMAC QR pass is mandatory for admission.",
    "Strictly restricted to registered attendees (Age 18+). Government photo ID required at door screening.",
    "Reborn Club & Kitchen doors open at 12 PM. Strictly no re-entry permitted once scanned inside.",
    "Prohibited items: Outside food, drinks, sharp objects, illicit substances, or unapproved recording gear.",
    "Dress Code: Nightclub Glam / Street Chic / Upscale Afterparty (No flip-flops or athletic sportswear).",
    "The organizing council and venue management reserve absolute rights of admission.",
  ];

  const activeRules = rules && rules.length > 0 ? rules : defaultRules;

  return (
    <section className="py-24 bg-[#030303] border-t border-[#1A1A1A] relative overflow-hidden font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionMarker number="07" title="ADMISSION RULES & CODE OF CONDUCT" />

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <div>
            <h2 className="text-4xl sm:text-6xl font-black font-display text-white uppercase tracking-tight">
              RULES &bull; <span className="text-[#FF0000] glow-red">REGULATIONS</span>
            </h2>
            <p className="text-xs sm:text-sm font-mono text-[#A0A0A0] uppercase tracking-wider mt-2">
              COMPLIANCE MANDATORY FOR ALL TICKET HOLDERS &bull; ZERO TOLERANCE SECURITY
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeRules.map((rule, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#080808] border border-[#222222] hover:border-[#FF0000]/50 transition-all flex items-start gap-4 shadow-[0_4px_25px_rgba(0,0,0,0.8)]"
            >
              <div className="h-8 w-8 rounded-lg bg-[#FF0000]/10 border border-[#FF0000]/30 flex items-center justify-center text-[#FF0000] shrink-0 mt-0.5 font-mono font-bold text-xs">
                0{idx + 1}
              </div>
              <p className="text-xs sm:text-sm text-[#E5E5E5] font-sans leading-relaxed">
                {rule}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
