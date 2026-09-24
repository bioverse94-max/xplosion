"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionMarker } from "@/components/effects/visual-engine";

export interface FaqSectionProps {
  faqs?: Array<{ question: string; answer: string }>;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ faqs }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const defaultFaqs = [
    {
      question: "How do I receive my XPLOSION 2K26 entry pass?",
      answer: "Upon successful payment verification, your encrypted digital credential with an HMAC-SHA256 signed QR code is generated instantly. You can view, download, or access it anytime via the /my-pass portal using your registered mobile number.",
    },
    {
      question: "Can I transfer my pass to someone else?",
      answer: "Passes are uniquely bound to your verified college identity and government photo ID at check-in. Unauthorized pass scalping or transfers are strictly rejected at the venue gates.",
    },
    {
      question: "What is included with a VIP Lounge Pass?",
      answer: "VIP Pass holders receive priority express queue bypass, elevated mezzanine lounge access, complimentary refreshment tokens, and artist stage-front viewing.",
    },
    {
      question: "What happens if I lose my digital pass?",
      answer: "Visit the /my-pass page on this platform, enter your 10-digit mobile number or registered email, and your live pass will be retrieved immediately.",
    },
    {
      question: "What is the dress code and age restriction?",
      answer: "XPLOSION 2K26 is strictly 18+. Physical college ID card and government photo ID are mandatory for venue admission. Dress code: Upscale Club / Afterparty Glam / Street Chic.",
    },
  ];

  const activeFaqs = faqs && faqs.length > 0 ? faqs : defaultFaqs;

  return (
    <section id="faq" className="py-24 bg-[#050505] border-t border-[#1A1A1A] relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionMarker number="05" title="FREQUENTLY ASKED QUESTIONS" className="justify-center" />

        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-6xl font-black text-white font-display uppercase tracking-tight">
            QUESTIONS &bull; <span className="text-[#FF0000] glow-red">ANSWERS</span>
          </h2>
          <p className="text-xs sm:text-sm font-mono text-[#A0A0A0] mt-2 uppercase tracking-wider">
            OFFICIAL ADMISSION POLICIES &bull; QR VALIDATION &bull; VENUE RULES
          </p>
        </div>

        <div className="space-y-4">
          {activeFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={cn(
                  "rounded-2xl border transition-all duration-200 overflow-hidden",
                  isOpen
                    ? "bg-[#0D0D0D] border-[#FF0000] shadow-[0_0_25px_rgba(255,0,0,0.25)]"
                    : "bg-[#080808] border-[#1F1F1F] hover:border-[#333333]"
                )}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 select-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-black text-white font-display uppercase tracking-wide">
                    {faq.question}
                  </span>
                  <div
                    className={cn(
                      "h-8 w-8 rounded-lg bg-[#141414] border border-[#222222] flex items-center justify-center text-[#A0A0A0] shrink-0 transition-transform duration-200",
                      isOpen && "rotate-180 text-[#FF0000] bg-[#FF0000]/10 border-[#FF0000]/40"
                    )}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 text-xs sm:text-sm text-[#A0A0A0] leading-relaxed border-t border-[#1A1A1A] pt-4 font-sans animate-in fade-in duration-150">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
