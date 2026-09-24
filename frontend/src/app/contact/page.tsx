import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { Mail, Phone, MapPin, Flame } from "lucide-react";
import { StageLight, NoiseOverlay, SectionMarker } from "@/components/effects/visual-engine";

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#030303] text-[#F5F5F5]">
      <PublicNavbar />

      <main className="flex-1 pt-28 pb-20 relative overflow-hidden font-mono">
        <StageLight position="top" intensity="medium" />
        <NoiseOverlay opacity={0.03} />

        <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionMarker number="08" title="HELPDESK & SUPPORT" className="justify-center" />

          <div className="text-center mb-14">
            <h1 className="text-4xl sm:text-6xl font-black text-white font-display uppercase tracking-tight">
              EVENT <span className="text-[#FF0000] glow-red">SUPPORT</span>
            </h1>
            <p className="text-xs sm:text-sm font-mono text-[#A0A0A0] mt-2 uppercase tracking-wider">
              XPLOSION 2K26 ORGANIZING COUNCIL &bull; REBORN CLUB & KITCHEN DESK
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#080808] border border-[#222222] space-y-4 shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
              <div className="h-10 w-10 rounded-xl bg-[#FF0000]/10 border border-[#FF0000]/30 flex items-center justify-center text-[#FF0000]">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-black text-white font-display uppercase tracking-wide">
                Email Helpdesk
              </h3>
              <p className="text-xs text-[#A0A0A0] font-sans leading-relaxed">
                For ticketing assistance, payment confirmation inquiries, or pass re-issuance:
              </p>
              <p className="text-sm font-bold text-[#FF0000] pt-1">
                tickets@xplosion2k26.com
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-[#080808] border border-[#222222] space-y-4 shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
              <div className="h-10 w-10 rounded-xl bg-[#FF0000]/10 border border-[#FF0000]/30 flex items-center justify-center text-[#FF0000]">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-black text-white font-display uppercase tracking-wide">
                Host Venue Desk
              </h3>
              <p className="text-xs text-[#A0A0A0] font-sans leading-relaxed">
                Reborn Club & Kitchen, Outer Ring Road, Bhubaneswar.
              </p>
              <p className="text-xs font-bold text-white pt-1">
                Doors open Saturday 26.09.26 at 12 PM ONWARDS
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
