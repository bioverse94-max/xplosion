"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  QrCode,
  Users,
  Ticket,
  CreditCard,
  UserCheck,
  BarChart3,
  MessageSquare,
  Settings,
  ShieldAlert,
  History,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();

  const navSections = [
    {
      title: "Operations",
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Door Check-In", href: "/admin/check-in", icon: QrCode, badge: "LIVE" },
        { label: "Registrations", href: "/admin/registrations", icon: Users },
        { label: "Attendees", href: "/admin/attendees", icon: UserCheck },
      ],
    },
    {
      title: "Management",
      items: [
        { label: "Ticket Types", href: "/admin/tickets", icon: Ticket },
        { label: "Payments & Ledger", href: "/admin/payments", icon: CreditCard },
        { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
        { label: "Communications", href: "/admin/communications", icon: MessageSquare },
      ],
    },
    {
      title: "System & Governance",
      items: [
        { label: "Event Settings", href: "/admin/event-settings", icon: Settings },
        { label: "Admins & Roles", href: "/admin/admins", icon: ShieldAlert },
        { label: "Audit Logs", href: "/admin/audit-logs", icon: History },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-surface-border flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Logo & Header */}
        <div className="p-5 border-b border-surface-border flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-neon">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide font-display">EVENT OPS CONSOLE</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Freshers 2026</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <h2 className="px-3 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                {section.title}
              </h2>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group",
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                          : "text-slate-300 hover:bg-surface-hover hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={cn(
                            "h-4 w-4 transition-colors",
                            isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-200"
                          )}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-widest bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/30 rounded">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-surface-border bg-surface/50">
        <Link
          href="/admin/login"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-accent-rose hover:bg-surface-hover transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Exit / Sign Out</span>
        </Link>
      </div>
    </aside>
  );
};
