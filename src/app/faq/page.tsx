import { EventService } from "@/services/event.service";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { FaqSection } from "@/components/public/faq-section";
import { RulesSection } from "@/components/public/rules-section";

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const event = await EventService.getActiveEvent();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicNavbar />

      <main className="flex-1 pt-28">
        <FaqSection faqs={event?.faqs} />
        <RulesSection rules={event?.rules} />
      </main>

      <PublicFooter />
    </div>
  );
}
