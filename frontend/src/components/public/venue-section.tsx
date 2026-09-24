import React from "react";
import { EventDetailDTO } from "@/types";
import { MapPin, Navigation, Car, AlertCircle, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionMarker } from "@/components/effects/visual-engine";

export interface VenueSectionProps {
  event: EventDetailDTO | null;
}

export const VenueSection: React.FC<VenueSectionProps> = ({ event }) => {
  const venue = event?.venueName || "REBORN CLUB & KITCHEN";
  const address = event?.venueAddress || "Reborn Club & Kitchen, Outer Ring Road";
  const city = event?.city || "Bhubaneswar";
  const doors = event?.doorsOpenTime || "12 PM ONWARDS";

  return (
    <section className="py-24 bg-[#050505] border-t border-[#1A1A1A] relative overflow-hidden font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionMarker number="06" title="VENUE & LOCATION" />

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <div>
            <h2 className="text-4xl sm:text-6xl font-black font-display text-white uppercase tracking-tight">
              THE <span className="text-[#FF0000] glow-red">VENUE</span>
            </h2>
            <p className="text-xs sm:text-sm font-mono text-[#A0A0A0] uppercase tracking-wider mt-2">
              REBORN CLUB & KITCHEN &bull; PRIME NIGHTLIFE CORRIDOR
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Venue Info Card */}
          <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-[#080808] border border-[#222222] shadow-[0_10px_35px_rgba(0,0,0,0.8)] space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold tracking-widest text-[#FF0000] uppercase bg-[#FF0000]/10 border border-[#FF0000]/30 px-2 py-0.5 rounded">
                {"//"} HOST VENUE
              </span>
              <h3 className="text-3xl sm:text-4xl font-black text-white font-display uppercase tracking-wide">
                {venue}
              </h3>
              <p className="text-sm text-[#E5E5E5] font-sans">
                {address}, {city}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#1A1A1A]">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Clock className="h-4 w-4 text-[#FF0000]" />
                  <span>DOORS OPEN</span>
                </div>
                <p className="text-xs text-[#A0A0A0] font-sans">
                  {doors}. Entry gate security lane active from opening.
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Car className="h-4 w-4 text-[#FF0000]" />
                  <span>PARKING & TRANSIT</span>
                </div>
                <p className="text-xs text-[#A0A0A0] font-sans">
                  Dedicated valet and cab drop-off points directly at the club portico.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#222222] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#FF0000]">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>MANDATORY ADMISSION PROTOCOL</span>
              </div>
              <p className="text-[11px] text-[#A0A0A0] leading-relaxed font-sans">
                Physical College ID card along with your digital HMAC QR pass is required at door security. Strict 18+ venue verification.
              </p>
            </div>
          </div>

          {/* Interactive Map Visual */}
          <div className="lg:col-span-6 rounded-2xl bg-[#080808] border border-[#222222] relative overflow-hidden flex flex-col items-center justify-center p-8 text-center group shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
            <div className="h-16 w-16 rounded-2xl bg-[#FF0000]/10 border border-[#FF0000]/30 flex items-center justify-center text-[#FF0000] mb-4 shadow-[0_0_20px_rgba(255,0,0,0.25)] group-hover:scale-105 transition-transform">
              <Navigation className="h-8 w-8" />
            </div>
            <h4 className="text-2xl font-black text-white font-display uppercase tracking-wide mb-1">
              DIRECTIONS & NAVIGATION
            </h4>
            <p className="text-xs text-[#A0A0A0] mb-6 font-mono">
              {venue} &bull; {city}
            </p>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(`${venue} ${address} ${city}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full max-w-xs"
            >
              <Button variant="neon" className="w-full" size="md" rightIcon={<Navigation className="h-4 w-4" />}>
                OPEN IN GOOGLE MAPS
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
