import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Flame, Ticket } from "lucide-react";
import { StageLight, BrushStroke } from "@/components/effects/visual-engine";

export const FinalCtaSection: React.FC = () => {
  return (
    <section className="py-28 relative overflow-hidden border-t border-[#1A1A1A] bg-[#050505]">
      <StageLight position="top" intensity="high" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#080808] border border-[#FF0000]/40 text-[#FF0000] text-xs font-mono font-bold tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(255,0,0,0.25)]">
          <Flame className="h-3.5 w-3.5 fill-[#FF0000]" />
          ONE NIGHT &bull; ZERO COMPROMISES
        </div>

        <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white font-display uppercase tracking-tight mb-4 leading-none">
          LOCK IN YOUR <span className="text-[#FF0000] glow-red-lg">CREDENTIAL</span>
        </h2>

        <div className="max-w-xs mx-auto mb-6">
          <BrushStroke color="#FF0000" className="opacity-80" />
        </div>

        <p className="max-w-2xl mx-auto text-sm sm:text-base font-mono text-[#A0A0A0] uppercase mb-10 leading-relaxed">
          CAPACITY IS STRICTLY CAPPED BY VENUE SAFETY PROTOCOLS. CHOOSE YOUR PASS TIER NOW TO GUARANTEE YOUR SPOT ON THE DANCEFLOOR.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/tickets">
            <Button size="xl" variant="neon" rightIcon={<ArrowRight className="h-5 w-5 text-black" />}>
              CHOOSE PASS TIER
            </Button>
          </Link>
          <Link href="/my-pass">
            <Button size="xl" variant="outline" leftIcon={<ShieldCheck className="h-5 w-5 text-[#FF0000]" />}>
              RETRIEVE PASS
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
