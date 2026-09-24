import React from "react";
import prisma from "@/lib/db";
import { AdminHeader } from "@/components/layout/admin-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminEventSettingsPage() {
  const event = await prisma.event.findFirst({ where: { isActive: true } });

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Event Configuration & Settings"
        description="Global event parameters, venue coordinates, house policies, and door times."
      />

      <div className="p-8 space-y-6 max-w-4xl">
        <Card glass className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <div>
              <h3 className="text-lg font-bold text-white font-display">Active Event Dossier</h3>
              <p className="text-xs text-slate-400">Database slug: <code className="text-primary font-mono">{event?.slug}</code></p>
            </div>
            <Badge variant="success">PRODUCTION ACTIVE</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Event Title" defaultValue={event?.title} readOnly />
            <Input label="City / Region" defaultValue={event?.city} readOnly />
            <Input label="Host Venue" defaultValue={event?.venueName} readOnly />
            <Input label="Venue Address" defaultValue={event?.venueAddress} readOnly />
            <Input label="Doors Open Time" defaultValue={event?.doorsOpenTime} readOnly />
            <Input label="Scheduled Event Date" defaultValue={event?.date ? new Date(event.date).toDateString() : ""} readOnly />
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold uppercase text-slate-300">Tagline</label>
            <textarea
              defaultValue={event?.tagline}
              readOnly
              rows={2}
              className="w-full rounded-xl bg-surface/80 border border-surface-border p-3 text-sm text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-slate-300">Description</label>
            <textarea
              defaultValue={event?.description}
              readOnly
              rows={3}
              className="w-full rounded-xl bg-surface/80 border border-surface-border p-3 text-sm text-white focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-surface-border flex items-center justify-between text-xs text-slate-400">
            <span>Configured via relational database schema</span>
            <Button variant="outline" size="sm" leftIcon={<Shield className="h-4 w-4" />} disabled>
              Settings Protected
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
