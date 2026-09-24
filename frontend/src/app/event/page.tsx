import { EventService } from "@/services/event.service";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { EventIdentitySection } from "@/components/public/event-identity-section";
import { ExperienceSection } from "@/components/public/experience-section";
import { VenueSection } from "@/components/public/venue-section";
import { RulesSection } from "@/components/public/rules-section";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Flame, ArrowRight, Calendar, MapPin, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { StageLight, NoiseOverlay, BrushStroke } from "@/components/effects/visual-engine";

export const dynamic = "force-dynamic";

export default async function EventPage() {
  const event = await EventService.getActiveEvent();

  return (
    <div className="flex flex-col min-h-screen bg-[#030303] text-[#F5F5F5]">
      <PublicNavbar />

      <main className="flex-1 pt-28">
        {/* Event Dossier Header */}
        <section className="py-20 text-center relative overflow-hidden border-b border-[#1A1A1A]">
          <StageLight position="top" intensity="high" />
          <NoiseOverlay opacity={0.035} />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#080808] border border-[#FF0000]/40 text-[#FF0000] text-xs font-mono font-bold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(255,0,0,0.25)]">
              <Flame className="h-3.5 w-3.5" />
              FULL EVENT DOSSIER
            </div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white font-display uppercase tracking-tight mb-4 leading-none">
              XPLOSION <span className="text-[#FF0000] glow-red">2K26</span>
            </h1>

            <div className="max-w-xs mx-auto mb-6">
              <BrushStroke color="#FF0000" className="opacity-80" />
            </div>

            <p className="max-w-2xl mx-auto text-sm sm:text-base font-mono text-[#A0A0A0] uppercase mb-8 leading-relaxed">
              {event?.description ||
                "THE DEFINITIVE COLLEGIATE AFTERPARTY. HIGH-VOLTAGE MUSIC, 360° LASER STAGES & AN ELECTRIFIED DANCEFLOOR EXPERIENCE."}
            </p>

            <div className="inline-flex flex-wrap items-center justify-center gap-6 p-4 sm:p-5 rounded-2xl bg-[#080808] border border-[#222222] text-xs font-mono text-[#E5E5E5] shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#FF0000]" />
                <span>26.09.26 &bull; SATURDAY</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#FF0000]" />
                <span>DOORS: {event?.doorsOpenTime || "12 PM ONWARDS"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#FF0000]" />
                <span>{event?.venueName || "REBORN CLUB & KITCHEN"}</span>
              </div>
            </div>

            <div className="mt-10 flex justify-center">
              <Link href="/tickets">
                <Button size="xl" variant="neon" rightIcon={<ArrowRight className="h-5 w-5 text-black" />}>
                  GET YOUR PASS NOW
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <EventIdentitySection event={event} />
        <ExperienceSection />
        <VenueSection event={event} />
        <RulesSection rules={event?.rules} />
      </main>

      <PublicFooter />
    </div>
  );
}
