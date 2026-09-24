import { EventService } from "@/services/event.service";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { TicketTiersSection } from "@/components/public/ticket-tiers-section";
import { FaqSection } from "@/components/public/faq-section";
import { Card } from "@/components/ui/card";
import { StageLight, SectionMarker, NoiseOverlay } from "@/components/effects/visual-engine";
import { Check, Flame, ShieldCheck, Ticket } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const event = await EventService.getActiveEvent();

  return (
    <div className="flex flex-col min-h-screen bg-[#030303] text-[#F5F5F5]">
      <PublicNavbar />

      <main className="flex-1 pt-28">
        {/* Page Header */}
        <section className="py-14 text-center border-b border-[#1A1A1A] relative overflow-hidden">
          <StageLight position="top" intensity="medium" />
          <NoiseOverlay opacity={0.03} />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#080808] border border-[#FF0000]/40 text-[#FF0000] text-xs font-mono font-bold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(255,0,0,0.25)]">
              <Flame className="h-3.5 w-3.5" />
              OFFICIAL TICKETING PORTAL
            </div>
            <h1 className="text-5xl sm:text-7xl font-black text-white font-display uppercase tracking-tight">
              SELECT YOUR <span className="text-[#FF0000] glow-red">PASS</span>
            </h1>
            <p className="text-xs sm:text-sm font-mono text-[#A0A0A0] mt-3 max-w-xl mx-auto uppercase tracking-wider">
              REAL-TIME DATABASE INVENTORY &bull; ATOMIC 10-MINUTE RESERVATION WINDOW &bull; CRYPTOGRAPHIC DOOR QR
            </p>
          </div>
        </section>

        {/* Tickets Component */}
        <TicketTiersSection ticketTypes={event?.ticketTypes || []} showInteractiveSelector={true} />

        {/* Tier Comparison Matrix Table */}
        <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <SectionMarker number="04" title="FEATURE COMPARISON" className="justify-center" />
            <h3 className="text-3xl sm:text-4xl font-black text-white font-display uppercase">
              ADMISSION TIER COMPARISON
            </h3>
            <p className="text-xs font-mono text-[#A0A0A0] mt-1 uppercase">
              Compare amenities, beverage tokens, and arena access across categories
            </p>
          </div>

          <div className="rounded-2xl border border-[#222222] bg-[#080808] overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm font-mono">
                <thead>
                  <tr className="border-b border-[#222222] bg-[#0D0D0D] text-[#A0A0A0] uppercase text-[11px] font-bold">
                    <th className="p-4">Feature / Amenity</th>
                    <th className="p-4 text-center">Early Bird</th>
                    <th className="p-4 text-center">Regular Stag</th>
                    <th className="p-4 text-center text-[#FF0000] font-black">VIP Lounge</th>
                    <th className="p-4 text-center text-white font-bold">Couple Duo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A] text-[#E5E5E5]">
                  <tr>
                    <td className="p-4 font-bold text-white">Full Nightclub Arena Access</td>
                    <td className="p-4 text-center"><Check className="h-4 w-4 text-[#FF0000] mx-auto stroke-[3]" /></td>
                    <td className="p-4 text-center"><Check className="h-4 w-4 text-[#FF0000] mx-auto stroke-[3]" /></td>
                    <td className="p-4 text-center"><Check className="h-4 w-4 text-[#FF0000] mx-auto stroke-[3]" /></td>
                    <td className="p-4 text-center"><Check className="h-4 w-4 text-[#FF0000] mx-auto stroke-[3]" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">Encrypted QR Mobile Pass</td>
                    <td className="p-4 text-center"><Check className="h-4 w-4 text-[#FF0000] mx-auto stroke-[3]" /></td>
                    <td className="p-4 text-center"><Check className="h-4 w-4 text-[#FF0000] mx-auto stroke-[3]" /></td>
                    <td className="p-4 text-center"><Check className="h-4 w-4 text-[#FF0000] mx-auto stroke-[3]" /></td>
                    <td className="p-4 text-center"><Check className="h-4 w-4 text-[#FF0000] mx-auto stroke-[3]" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">Welcome Drinks & Refreshments</td>
                    <td className="p-4 text-center font-bold">1x Token</td>
                    <td className="p-4 text-center font-bold">2x Tokens</td>
                    <td className="p-4 text-center text-[#FF0000] font-black">Unlimited</td>
                    <td className="p-4 text-center font-bold">2x Tokens</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">VIP Express Lane (Zero Queue)</td>
                    <td className="p-4 text-center text-[#444444]">&mdash;</td>
                    <td className="p-4 text-center text-[#444444]">&mdash;</td>
                    <td className="p-4 text-center"><Check className="h-4 w-4 text-[#FF0000] mx-auto stroke-[3]" /></td>
                    <td className="p-4 text-center"><Check className="h-4 w-4 text-[#FF0000] mx-auto stroke-[3]" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">Elevated Skydeck Lounge Access</td>
                    <td className="p-4 text-center text-[#444444]">&mdash;</td>
                    <td className="p-4 text-center text-[#444444]">&mdash;</td>
                    <td className="p-4 text-center"><Check className="h-4 w-4 text-[#FF0000] mx-auto stroke-[3]" /></td>
                    <td className="p-4 text-center"><Check className="h-4 w-4 text-[#FF0000] mx-auto stroke-[3]" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">Gourmet Snack Buffet</td>
                    <td className="p-4 text-center text-[#444444]">&mdash;</td>
                    <td className="p-4 text-center text-[#444444]">&mdash;</td>
                    <td className="p-4 text-center"><Check className="h-4 w-4 text-[#FF0000] mx-auto stroke-[3]" /></td>
                    <td className="p-4 text-center text-[#444444]">&mdash;</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <FaqSection faqs={event?.faqs} />
      </main>

      <PublicFooter />
    </div>
  );
}
