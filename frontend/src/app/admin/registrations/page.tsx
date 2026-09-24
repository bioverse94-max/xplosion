import React from "react";
import prisma from "@/lib/db";
import { AdminHeader } from "@/components/layout/admin-header";
import { RegistrationsClient, RegistrationItem } from "./registrations-client";

export const dynamic = "force-dynamic";

export default async function AdminRegistrationsPage() {
  const registrations = await prisma.registration.findMany({
    include: {
      attendee: true,
      items: { include: { ticketType: true } },
      payment: true,
      passes: { include: { checkIn: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Live Registrations & Database Verification"
        description="Real-time synchronized dataset of attendee orders, instant payment verification statuses, and gate check-in passes."
      />

      <RegistrationsClient initialRegistrations={registrations as unknown as RegistrationItem[]} />
    </div>
  );
}
