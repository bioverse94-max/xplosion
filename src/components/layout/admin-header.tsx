"use client";

import React from "react";
import { ShieldCheck, Bell, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface AdminHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ title, description, actions }) => {
  return (
    <header className="px-8 py-6 border-b border-surface-border bg-surface/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">{title}</h1>
          <Badge variant="primary" size="sm" className="hidden sm:inline-flex">
            <Activity className="h-3 w-3 animate-pulse text-primary" />
            LIVE SYSTEM
          </Badge>
        </div>
        {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <div className="h-6 w-px bg-surface-border hidden sm:block" />
        <div className="flex items-center gap-2 text-xs text-slate-300 bg-surface border border-surface-border px-3 py-1.5 rounded-xl">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="font-medium">Role: Super Admin</span>
        </div>
      </div>
    </header>
  );
};
