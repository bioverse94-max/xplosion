import React from "react";
import prisma from "@/lib/db";
import { AdminHeader } from "@/components/layout/admin-header";
import { PaymentLedgerClient } from "./payment-ledger-client";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const payments = await prisma.payment.findMany({
    include: {
      registration: {
        include: { attendee: true },
      },
      refund: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Payments & UPI Ledger"
        description="Audit trail of all incoming UPI QR payments, submitted UTR transaction IDs, and pass issuance verifications."
      />

      <PaymentLedgerClient initialPayments={payments} />
    </div>
  );
}

