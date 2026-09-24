import React from "react";
import { EventDetailDTO } from "@/types";
import { SectionMarker, BrushStroke, DistressedBorder, StageLight } from "@/components/effects/visual-engine";
import { Calendar, MapPin, Clock, ShieldCheck, Flame, Radio, Volume2, Sparkles } from "lucide-react";

export interface EventIdentitySectionProps {
  event: EventDetailDTO | null;
}

export const EventIdentitySection: React.FC<EventIdentitySectionProps> = ({ event }) => {
  return (
    <section className="py-24 border-t border-[#1A1A1A] relative overflow-hidden bg-[#050505]">
      <StageLight position="left" intensity="low" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionMarker number="01" title="EVENT DOSSIER & IDENTITY" />

        {/* ── Editorial Event Details Trio (Festival Poster Style) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
          {/* Card 1: Date */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#080808] border border-[#222222] relative overflow-hidden group hover:border-[#FF0000]/60 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calendar className="h-24 w-24 text-[#FF0000]" />
            </div>
            <p className="text-4xl sm:text-5xl font-black font-display text-white tracking-tight leading-none">
              26.09.26
            </p>
            <div className="h-[2px] w-full bg-[#FF0000] my-4 shadow-[0_0_8px_#FF0000]" />
            <p className="text-sm font-mono font-black text-[#A0A0A0] tracking-widest uppercase">
              SATURDAY &bull; MAIN AFTERPARTY
            </p>
          </div>

          {/* Card 2: Venue */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#080808] border border-[#222222] relative overflow-hidden group hover:border-[#FF0000]/60 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <MapPin className="h-24 w-24 text-[#FF0000]" />
            </div>
            <p className="text-3xl sm:text-4xl font-black font-display text-white tracking-tight leading-none uppercase truncate">
              {event?.venueName || "REBORN CLUB & KITCHEN"}
            </p>
            <div className="h-[2px] w-full bg-[#FF0000] my-4 shadow-[0_0_8px_#FF0000]" />
            <p className="text-sm font-mono font-black text-[#A0A0A0] tracking-widest uppercase">
              EXCLUSIVE NIGHTCLUB VENUE
            </p>
          </div>

          {/* Card 3: Time */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#080808] border border-[#222222] relative overflow-hidden group hover:border-[#FF0000]/60 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Clock className="h-24 w-24 text-[#FF0000]" />
            </div>
            <p className="text-4xl sm:text-5xl font-black font-display text-white tracking-tight leading-none">
              12 PM
            </p>
            <div className="h-[2px] w-full bg-[#FF0000] my-4 shadow-[0_0_8px_#FF0000]" />
            <p className="text-sm font-mono font-black text-[#A0A0A0] tracking-widest uppercase">
              ONWARDS &bull; DOORS OPEN
            </p>
          </div>
        </div>

        {/* ── Event Story & Brand Manifesto ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-8 border-t border-[#1A1A1A]">
          <div className="lg:col-span-5 space-y-2">
            <h3 className="text-5xl sm:text-7xl font-black font-display text-white uppercase leading-[0.9]">
              ONE NIGHT.<br />
              <span className="text-[#FF0000] glow-red">ONE CAMPUS.</span><br />
              ONE VIBE.
            </h3>
            <div className="pt-2">
              <BrushStroke color="#FF0000" width="160px" />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4 text-sm sm:text-base text-[#A0A0A0] leading-relaxed font-sans">
            <p className="text-white font-medium">
              {event?.description ||
                "XPLOSION 2K26 is the definitive collegiate nightlife gathering. Built for high-octane celebration, unforgettable campus reunions, and pure sonic immersion."}
            </p>
            <p>
              Step beyond the typical campus party. Featuring a curated lineup of high-energy DJs, full-arena audio-visual rigging, handcrafted cocktails and mocktails, and a dancefloor charged with collective collegiate adrenaline.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-[#E5E5E5]">
              <span className="flex items-center gap-1.5 text-white">
                <ShieldCheck className="h-4 w-4 text-[#FF0000]" />
                Age 18+ &bull; College ID Required
              </span>
              <span className="flex items-center gap-1.5 text-white">
                <Volume2 className="h-4 w-4 text-[#FF0000]" />
                Concert-Grade Sound
              </span>
              <span className="flex items-center gap-1.5 text-white">
                <Radio className="h-4 w-4 text-[#FF0000]" />
                HMAC-Signed Passes
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
