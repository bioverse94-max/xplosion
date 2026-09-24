"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TicketTierDTO } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionMarker, DistressedBorder, RedGlow } from "@/components/effects/visual-engine";
import {
  Ticket,
  Check,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Plus,
  Minus,
  Flame,
  Lock,
  Zap,
} from "lucide-react";

export interface TicketTiersSectionProps {
  ticketTypes: TicketTierDTO[];
  showInteractiveSelector?: boolean;
}

export const TicketTiersSection: React.FC<TicketTiersSectionProps> = ({
  ticketTypes,
  showInteractiveSelector = true,
}) => {
  const router = useRouter();
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

  const updateQuantity = (tierId: string, delta: number, maxAllowed: number, availableCount: number) => {
    setSelectedQuantities((prev) => {
      const current = prev[tierId] || 0;
      const limit = Math.min(maxAllowed, availableCount);
      const next = Math.max(0, Math.min(limit, current + delta));
      if (next === 0) {
        const copy = { ...prev };
        delete copy[tierId];
        return copy;
      }
      return { ...prev, [tierId]: next };
    });
  };

  const totalSelectedTickets = Object.values(selectedQuantities).reduce((a, b) => a + b, 0);

  const calculateTotalAmount = () => {
    return Object.entries(selectedQuantities).reduce((sum, [tierId, qty]) => {
      const tier = ticketTypes.find((t) => t.id === tierId);
      return sum + (tier ? tier.price * qty : 0);
    }, 0);
  };

  const handleProceedToRegistration = (directTierId?: string) => {
    if (directTierId) {
      router.push(`/register?tier=${directTierId}&qty=1`);
      return;
    }

    if (totalSelectedTickets === 0) return;

    const firstTierEntry = Object.entries(selectedQuantities).find(([, qty]) => qty > 0);
    if (firstTierEntry) {
      const [tierId, qty] = firstTierEntry;
      router.push(`/register?tier=${tierId}&qty=${qty}`);
    } else {
      router.push("/register");
    }
  };

  const getTierStatus = (tier: TicketTierDTO) => {
    const now = new Date();
    const start = new Date(tier.saleStart);
    const end = new Date(tier.saleEnd);

    if (now < start) {
      return { label: "STARTING SOON", variant: "warning" as const, canBuy: false };
    }
    if (now > end) {
      return { label: "SALES ENDED", variant: "sold_out" as const, canBuy: false };
    }
    if (tier.isSoldOut || tier.availableCount <= 0) {
      return { label: "SOLD OUT", variant: "sold_out" as const, canBuy: false };
    }
    if (tier.availableCount <= 25) {
      return { label: `LIMITED (${tier.availableCount} LEFT)`, variant: "danger" as const, canBuy: true };
    }
    return { label: "AVAILABLE", variant: "valid" as const, canBuy: true };
  };

  return (
    <section id="tickets" className="py-24 bg-[#030303] border-t border-[#1A1A1A] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionMarker number="03" title="PASS RESERVATIONS" badge="LIVE INVENTORY" />

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <div>
            <h2 className="text-4xl sm:text-6xl font-black font-display text-white uppercase tracking-tight">
              CHOOSE YOUR <span className="text-[#FF0000] glow-red">PASS</span>
            </h2>
            <p className="text-xs sm:text-sm font-mono text-[#A0A0A0] uppercase tracking-wider mt-2">
              REAL-TIME DATABASE INVENTORY &bull; ATOMIC 10-MINUTE RESERVATION LOCK
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#E5E5E5] bg-[#0E0E0E] border border-[#222222] px-3.5 py-2 rounded-xl">
            CURRENCY: <strong className="text-white">INR (₹)</strong> &bull; NO HIDDEN FEES
          </span>
        </div>

        {ticketTypes.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-[#080808] border border-dashed border-[#222222] max-w-md mx-auto">
            <AlertCircle className="h-10 w-10 text-[#FF0000] mx-auto mb-3" />
            <h3 className="text-base font-bold text-white font-display uppercase">Pass Inventory Loading</h3>
            <p className="text-xs text-[#A0A0A0] mt-1 font-mono">
              Connecting to secure database tier allocation...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ticketTypes.map((tier) => {
              const status = getTierStatus(tier);
              const currentQty = selectedQuantities[tier.id] || 0;
              const isSelected = currentQty > 0;
              const isFeatured = tier.tierCode === "VIP" || tier.tierCode === "REGULAR";

              return (
                <div
                  key={tier.id}
                  className={`rounded-2xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden bg-[#080808] p-6 ${
                    isSelected
                      ? "border-[#FF0000] shadow-[0_0_35px_-5px_rgba(255,0,0,0.5)] ring-1 ring-[#FF0000]"
                      : isFeatured
                      ? "border-[#333333] hover:border-[#FF0000]/60 hover:shadow-[0_0_20px_rgba(255,0,0,0.2)]"
                      : "border-[#1F1F1F] hover:border-[#333333]"
                  }`}
                >
                  {/* Top Red Indicator when selected or featured */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF0000] shadow-[0_0_12px_#FF0000]" />
                  )}

                  {/* Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-mono font-bold tracking-widest text-[#FF0000] uppercase bg-[#FF0000]/10 border border-[#FF0000]/30 px-2 py-0.5 rounded">
                        {tier.tierCode}
                      </span>
                      <Badge variant={status.variant} size="sm">
                        {status.label}
                      </Badge>
                    </div>

                    <h3 className="text-2xl font-black text-white font-display uppercase tracking-wide leading-tight">
                      {tier.name}
                    </h3>
                    <p className="text-[11px] font-mono text-[#6F6F6F] mt-1 uppercase">
                      Max {tier.maxPerOrder} per order &bull; Cap {tier.capacity}
                    </p>

                    {/* Price */}
                    <div className="flex items-baseline gap-1.5 my-5 pb-5 border-b border-[#1A1A1A]">
                      <span className="text-4xl sm:text-5xl font-black text-white font-display">
                        {formatCurrency(tier.price)}
                      </span>
                      <span className="text-[11px] font-mono text-[#A0A0A0] uppercase font-bold">/ PASS</span>
                    </div>

                    {/* Benefits List */}
                    <div className="space-y-2.5 mb-6">
                      <p className="text-[10px] font-mono font-bold text-[#A0A0A0] uppercase tracking-wider">
                        {"//"} INCLUDED BENEFITS:
                      </p>
                      <ul className="space-y-2 text-xs text-[#E5E5E5]">
                        {tier.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span className="h-4 w-4 rounded-full bg-[#FF0000]/20 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="h-2.5 w-2.5 text-[#FF0000] stroke-[3]" />
                            </span>
                            <span className="leading-snug">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Bottom Controls / CTA */}
                  <div className="pt-4 border-t border-[#1A1A1A] space-y-3">
                    {!status.canBuy ? (
                      <Button variant="outline" className="w-full opacity-50 cursor-not-allowed text-xs font-mono" disabled>
                        {status.label}
                      </Button>
                    ) : showInteractiveSelector ? (
                      <div className="space-y-2.5">
                        {/* Quantity Counter */}
                        <div className="flex items-center justify-between bg-[#121212] p-1 rounded-xl border border-[#222222]">
                          <button
                            type="button"
                            onClick={() => updateQuantity(tier.id, -1, tier.maxPerOrder, tier.availableCount)}
                            disabled={currentQty <= 0}
                            className="h-8 w-8 rounded-lg bg-[#1F1F1F] flex items-center justify-center text-white hover:bg-[#FF0000] hover:text-black disabled:opacity-20 transition-all"
                            aria-label={`Decrease quantity of ${tier.name}`}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <div className="text-center font-mono">
                            <span className="text-sm font-bold text-white">
                              {currentQty} {currentQty === 1 ? "PASS" : "PASSES"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateQuantity(tier.id, 1, tier.maxPerOrder, tier.availableCount)}
                            disabled={currentQty >= tier.maxPerOrder || currentQty >= tier.availableCount}
                            className="h-8 w-8 rounded-lg bg-[#FF0000] text-black flex items-center justify-center hover:bg-[#E60000] disabled:opacity-20 transition-all font-bold"
                            aria-label={`Increase quantity of ${tier.name}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <Button
                          variant={isSelected ? "neon" : "primary"}
                          className="w-full text-xs font-display tracking-wider"
                          size="md"
                          onClick={() => handleProceedToRegistration(tier.id)}
                          rightIcon={<ArrowRight className="h-4 w-4" />}
                        >
                          GET PASS &bull; {formatCurrency(tier.price)}
                        </Button>
                      </div>
                    ) : (
                      <Link href={`/register?tier=${tier.id}`} className="w-full block">
                        <Button
                          variant="primary"
                          className="w-full text-xs font-display tracking-wider"
                          size="md"
                          rightIcon={<ArrowRight className="h-4 w-4" />}
                        >
                          GET PASS
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Checkout Confirmation Bar */}
        {totalSelectedTickets > 0 && (
          <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 max-w-xl w-full p-4 rounded-2xl bg-[#080808]/98 border border-[#FF0000] shadow-[0_0_40px_rgba(255,0,0,0.4)] backdrop-blur-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-300">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#FF0000] uppercase tracking-widest block">
                {totalSelectedTickets} {totalSelectedTickets === 1 ? "PASS" : "PASSES"} SELECTED
              </span>
              <p className="text-xl font-black text-white font-display">
                TOTAL: {formatCurrency(calculateTotalAmount())}
              </p>
            </div>

            <Button
              variant="neon"
              size="lg"
              onClick={() => handleProceedToRegistration()}
              rightIcon={<ArrowRight className="h-4 w-4 text-black" />}
            >
              CONTINUE TO DETAILS
            </Button>
          </div>
        )}

        {/* Security & Verification Banner */}
        <div className="mt-14 p-5 rounded-2xl bg-[#080808] border border-[#222222] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-[#FF0000]/10 border border-[#FF0000]/30 flex items-center justify-center text-[#FF0000] shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">
                ANTI-FRAUD CRYPTOGRAPHIC LEDGER
              </h4>
              <p className="text-xs text-[#A0A0A0]">
                Every pass receives an HMAC-SHA256 encrypted QR credential. Screenshots and fake passes are strictly denied at venue entry.
              </p>
            </div>
          </div>
          <Link href="/faq">
            <Button variant="outline" size="sm" className="text-xs shrink-0">
              ADMISSION RULES &rarr;
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
