import { EventService } from "@/services/event.service";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { HeroSection } from "@/components/public/hero-section";
import { EventIdentitySection } from "@/components/public/event-identity-section";
import { ExperienceSection } from "@/components/public/experience-section";
import { TicketTiersSection } from "@/components/public/ticket-tiers-section";
import { VenueSection } from "@/components/public/venue-section";
import { RulesSection } from "@/components/public/rules-section";
import { FaqSection } from "@/components/public/faq-section";
import { FinalCtaSection } from "@/components/public/final-cta-section";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const event = await EventService.getActiveEvent();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicNavbar />

      <main className="flex-1">
        {/* 1. Hero Section */}
        <HeroSection event={event} />

        {/* 2. Event Identity */}
        <EventIdentitySection event={event} />

        {/* 3. Experience Showcase */}
        <ExperienceSection />

        {/* 4. Ticket Tiers */}
        <TicketTiersSection ticketTypes={event?.ticketTypes || []} />

        {/* 5. Venue & Maps */}
        <VenueSection event={event} />

        {/* 6. Rules & Policies */}
        <RulesSection rules={event?.rules} />

        {/* 7. FAQs */}
        <FaqSection faqs={event?.faqs} />

        {/* 8. Final CTA */}
        <FinalCtaSection />
      </main>

      <PublicFooter />
    </div>
  );
}
