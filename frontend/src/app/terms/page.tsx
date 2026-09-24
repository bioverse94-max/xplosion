import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicNavbar />

      <main className="flex-1 pt-28">
        <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-3">
              <FileText className="h-3.5 w-3.5" />
              LEGAL TERMS
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white font-display uppercase tracking-tight">
              Terms & Conditions
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Official event ticketing, admission, and pass agreement.
            </p>
          </div>

          <Card glass className="p-8 space-y-6 text-sm text-slate-300 leading-relaxed">
            <CardContent className="p-0 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-2 font-display">1. Digital Pass Validity & Admission</h3>
                <p>
                  Each digital pass contains an encrypted cryptographic QR code. Possession of a pass grants admission only to the individual verified at check-in alongside a valid physical College ID card and Government Photo ID.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2 font-display">2. No Re-Entry Policy</h3>
                <p>
                  Once scanned and verified at the venue gate, passes are permanently marked as CHECKED IN within the central system. Pass re-use or door re-entry is strictly disallowed.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2 font-display">3. Cancellation & Refund Guidelines</h3>
                <p>
                  Refund requests may be submitted up to 72 hours prior to event start time. Approved refunds will be reversed via the original payment source. Processing fees may apply.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2 font-display">4. Code of Conduct & Venue Safety</h3>
                <p>
                  The organizing committee and venue security reserve complete right of admission. Any disorderly conduct, possession of banned substances, or policy violation will result in immediate pass revocation without refund.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
