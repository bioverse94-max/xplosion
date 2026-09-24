"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Ticket, Menu, X, Smartphone, ShieldCheck, Flame, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export const PublicNavbar: React.FC = () => {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "EVENT", href: "/event" },
    { name: "TICKETS", href: "/tickets" },
    { name: "MY PASS", href: "/my-pass" },
    { name: "FAQ", href: "/faq" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#030303]/90 backdrop-blur-md border-b border-[#1A1A1A] py-3 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
          : "bg-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo / Wordmark */}
        <Link href="/" className="flex items-center gap-2.5 group select-none">
          <div className="h-9 w-9 rounded-lg bg-[#FF0000] flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.5)] group-hover:scale-105 transition-transform">
            <Flame className="h-5 w-5 text-black stroke-[2.5]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-display uppercase group-hover:text-[#FF0000] transition-colors">
              XPLOSION
            </span>
            <span className="text-lg sm:text-xl font-black font-display text-[#FF0000] tracking-wider">
              2K26
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-xs font-bold tracking-widest uppercase transition-all duration-200 relative py-1",
                  isActive
                    ? "text-[#FF0000]"
                    : "text-[#A0A0A0] hover:text-white"
                )}
              >
                <span>{link.name}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF0000] shadow-[0_0_8px_#FF0000]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA Actions */}
        {/* Right CTA Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/admin/login">
            <button
              title="Organizer & Desk Admin Console"
              className="px-2.5 py-1.5 rounded-xl bg-[#0D0D0D] border border-[#222222] text-[#A0A0A0] hover:text-[#FF0000] hover:border-[#FF0000]/50 transition-all flex items-center gap-1.5 text-xs font-mono font-semibold"
            >
              <Lock className="h-3.5 w-3.5 text-[#FF0000]" />
              <span className="text-[11px] tracking-wider uppercase">ADMIN</span>
            </button>
          </Link>
          <Link href="/my-pass">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Smartphone className="h-3.5 w-3.5 text-[#FF0000]" />}
              className="text-xs"
            >
              PASS LOGIN
            </Button>
          </Link>
          <Link href="/tickets">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Ticket className="h-3.5 w-3.5 text-black" />}
              className="text-xs"
            >
              GET YOUR PASS
            </Button>
          </Link>
        </div>

        {/* Mobile menu trigger button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-[#E5E5E5] hover:text-white hover:bg-[#141414] md:hidden transition-colors border border-[#222222]"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6 text-[#FF0000]" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[64px] bg-[#050505]/98 backdrop-blur-2xl border-b border-[#222222] p-6 space-y-4 shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-xl text-sm font-bold tracking-wider uppercase transition-colors flex items-center justify-between",
                  pathname === link.href
                    ? "bg-[#FF0000]/10 text-[#FF0000] border border-[#FF0000]/30"
                    : "text-[#E5E5E5] hover:bg-[#121212]"
                )}
              >
                <span>{link.name}</span>
                {pathname === link.href && <span className="h-2 w-2 rounded-full bg-[#FF0000]" />}
              </Link>
            ))}
          </nav>
          <div className="pt-4 border-t border-[#1F1F1F] flex flex-col gap-3">
            <Link href="/my-pass" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full" leftIcon={<ShieldCheck className="h-4 w-4 text-[#FF0000]" />}>
                RETRIEVE MY PASS
              </Button>
            </Link>
            <Link href="/tickets" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full" leftIcon={<Ticket className="h-4 w-4 text-black" />}>
                GET YOUR PASS
              </Button>
            </Link>
            <Link href="/admin/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full text-xs text-[#A0A0A0] hover:text-white font-mono" leftIcon={<Lock className="h-3.5 w-3.5 text-[#FF0000]" />}>
                ORGANIZER CONSOLE (ADMIN LOGIN)
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
