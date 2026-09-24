import React from "react";
import { SectionMarker, DistressedBorder, StageLight } from "@/components/effects/visual-engine";
import { Disc3, Flame, UtensilsCrossed, Sparkles, Users2, ArrowUpRight } from "lucide-react";

export const ExperienceSection: React.FC = () => {
  const cards = [
    {
      title: "LIVE DJ & MUSIC",
      subtitle: "HEAVY BASS & HIGH FREQUENCIES",
      category: "SONIC IMMERSION",
      icon: <Disc3 className="h-6 w-6 text-[#FF0000]" />,
      bgGradient: "from-[#FF0000]/20 via-[#0A0A0A] to-[#030303]",
      tag: "STAGE 01",
    },
    {
      title: "DANCE FLOOR",
      subtitle: "360° LIGHTS & SMOKE CANNONS",
      category: "MAIN ARENA",
      icon: <Flame className="h-6 w-6 text-[#FF0000]" />,
      bgGradient: "from-[#8B0000]/25 via-[#0A0A0A] to-[#030303]",
      tag: "ARENA",
    },
    {
      title: "DELICIOUS FOOD",
      subtitle: "GOURMET BITES & MOCKTAILS",
      category: "KITCHEN & BAR",
      icon: <UtensilsCrossed className="h-6 w-6 text-[#FF0000]" />,
      bgGradient: "from-[#FF0000]/20 via-[#0A0A0A] to-[#030303]",
      tag: "LOUNGE",
    },
    {
      title: "PARTY VIBES",
      subtitle: "ELECTRIC CAMPUS ENERGY",
      category: "AFTERPARTY",
      icon: <Sparkles className="h-6 w-6 text-[#FF0000]" />,
      bgGradient: "from-[#8B0000]/20 via-[#0A0A0A] to-[#030303]",
      tag: "NIGHTLIFE",
    },
    {
      title: "GOOD COMPANY",
      subtitle: "UNITE THE ENTIRE BATCH",
      category: "CAMPUS COMMUNITY",
      icon: <Users2 className="h-6 w-6 text-[#FF0000]" />,
      bgGradient: "from-[#FF0000]/25 via-[#0A0A0A] to-[#030303]",
      tag: "COMMUNITY",
    },
  ];

  return (
    <section className="py-24 bg-[#030303] border-t border-[#1A1A1A] relative overflow-hidden">
      <StageLight position="right" intensity="low" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionMarker number="02" title="CAMPUS IMMERSION" />

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-4xl sm:text-6xl font-black font-display text-white uppercase tracking-tight">
              ONE CAMPUS. <span className="text-[#FF0000] glow-red">ONE VIBE.</span>
            </h2>
            <p className="text-xs sm:text-sm font-mono text-[#A0A0A0] uppercase tracking-wider mt-2">
              FIVE SIGNATURE NIGHTLIFE ELEMENTS CRAFTED FOR XPLOSION 2K26
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#FF0000] border border-[#FF0000]/30 px-3 py-1.5 rounded-lg bg-[#FF0000]/10 w-fit">
            DOORS: 12 PM ONWARDS
          </span>
        </div>

        {/* Mini Event Poster Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className={`group relative rounded-2xl border border-[#222222] bg-gradient-to-b ${card.bgGradient} p-6 sm:p-7 overflow-hidden transition-all duration-300 hover:border-[#FF0000]/60 hover:-translate-y-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-col justify-between min-h-[220px]`}
            >
              {/* Corner Slit Accent */}
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
                <div className="absolute transform rotate-45 bg-[#FF0000]/20 text-[9px] font-mono font-bold text-[#FF0000] py-0.5 right-[-35px] top-[18px] w-[120px] text-center border-b border-[#FF0000]/30">
                  {card.tag}
                </div>
              </div>

              {/* Card Top */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-[#080808] border border-[#222222] flex items-center justify-center group-hover:border-[#FF0000]/50 group-hover:shadow-[0_0_15px_rgba(255,0,0,0.3)] transition-all">
                    {card.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#A0A0A0] tracking-widest uppercase">
                    {card.category}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black font-display text-white tracking-wide uppercase group-hover:text-[#FF0000] transition-colors leading-tight">
                  {card.title}
                </h3>
              </div>

              {/* Card Bottom Subtitle */}
              <div className="pt-6 border-t border-[#1F1F1F] flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#E5E5E5] tracking-wider uppercase">
                  {card.subtitle}
                </span>
                <ArrowUpRight className="h-4 w-4 text-[#A0A0A0] group-hover:text-[#FF0000] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
            </div>
          ))}

          {/* 6th Card: Ticket Callout Card */}
          <div className="rounded-2xl border-2 border-[#FF0000]/50 bg-[#0A0505] p-6 sm:p-7 flex flex-col justify-between shadow-[0_0_30px_rgba(255,0,0,0.2)]">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#FF0000] tracking-widest uppercase block mb-3">
                {"//"} PASS ADMISSION
              </span>
              <h3 className="text-2xl sm:text-3xl font-black font-display text-white tracking-wide uppercase leading-tight">
                CLAIM YOUR WRISTBAND
              </h3>
              <p className="text-xs text-[#A0A0A0] font-sans mt-2 leading-relaxed">
                Tickets are strictly limited by club capacity. Reserve in real-time before sale tiers exhaust.
              </p>
            </div>

            <div className="pt-6 border-t border-[#2A1111]">
              <a
                href="/tickets"
                className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-[#FF0000] text-black font-black font-display uppercase tracking-wider text-sm hover:bg-[#E60000] shadow-[0_0_20px_rgba(255,0,0,0.5)] transition-all"
              >
                CHOOSE YOUR PASS &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
