import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicNavbar />

      <main className="flex-1 pt-28">
        <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              PRIVACY & DATA PROTECTION
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white font-display uppercase tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              How we collect, use, and protect your collegiate and payment data.
            </p>
          </div>

          <Card glass className="p-8 space-y-6 text-sm text-slate-300 leading-relaxed">
            <CardContent className="p-0 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-2 font-display">1. Information Collection</h3>
                <p>
                  We collect only necessary information required for attendee verification and event operations: Full Name, College Email, Phone Number, College Name, Academic Year, and Branch.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2 font-display">2. Zero PII Exposure in QR Codes</h3>
                <p>
                  Your digital pass QR code contains an opaque, cryptographically signed token. Sensitive personal details such as phone numbers and private addresses are NEVER embedded directly inside the public QR matrix.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2 font-display">3. Payment Security</h3>
                <p>
                  All payment transactions are handled through PCI-DSS compliant payment gateways. We never store or log credit/debit card numbers or UPI MPINs on our application servers.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2 font-display">4. Media & Photography Consent</h3>
                <p>
                  Official event photographers and 360 photo booth operators will capture event footage. By attending, you acknowledge that event recap photos may be shared within official campus media galleries.
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
