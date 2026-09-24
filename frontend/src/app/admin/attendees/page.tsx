import React from "react";
import prisma from "@/lib/db";
import { AdminHeader } from "@/components/layout/admin-header";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminAttendeesPage() {
  const attendees = await prisma.attendee.findMany({
    include: {
      passes: true,
      registrations: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Attendee Directory"
        description="Filter and inspect registered students by college, branch, and academic year."
      />

      <div className="p-8 space-y-6">
        <Card glass className="p-6">
          <div className="flex items-center justify-between pb-6 border-b border-surface-border">
            <div>
              <h3 className="text-base font-bold text-white font-display">Registered Students ({attendees.length})</h3>
              <p className="text-xs text-slate-400">Verified campus attendees</p>
            </div>
          </div>

          {attendees.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              No attendees registered yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Personal Email (Delivery)</TableHead>
                  <TableHead>College Email</TableHead>
                  <TableHead>Phone (OTP)</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Branch & Year</TableHead>
                  <TableHead>Passes</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendees.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-bold text-white text-xs">{a.fullName}</TableCell>
                    <TableCell className="text-xs">
                      <p className="text-emerald-400 font-mono">{a.personalEmail || "—"}</p>
                      {a.emailVerified && (
                        <span className="text-[10px] text-emerald-400 font-bold">✓ Verified</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-300 font-mono">{a.email}</TableCell>
                    <TableCell className="text-xs font-mono">
                      <p className="text-white">+91 {a.phone}</p>
                      {a.phoneVerified ? (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                          ✓ OTP VERIFIED
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-500">Unverified</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-300">{a.college}</TableCell>
                    <TableCell className="text-xs">
                      <p className="text-primary font-medium">{a.branch}</p>
                      <p className="text-[10px] text-slate-400">{a.academicYear}</p>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-emerald-400">{a.passes.length}</TableCell>
                    <TableCell className="text-[11px] text-slate-400">{formatDate(a.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
