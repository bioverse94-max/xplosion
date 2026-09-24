"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { APP_CONFIG } from "@/lib/config";
import {
  QrCode,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Zap,
  Check,
  Copy,
  AlertTriangle,
  Loader2,
  Flame,
  Info,
  ExternalLink,
} from "lucide-react";

interface MerchantGatewayProps {
  registrationId: string;
  registrationNo: string;
  amount: number;
  onPaymentSuccess: (result: { status: string; message: string; passIds?: string[]; utr?: string }) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

export const MerchantGateway: React.FC<MerchantGatewayProps> = ({
  registrationId,
  registrationNo,
  amount,
  onPaymentSuccess,
  isProcessing,
  setIsProcessing,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"qr" | "apps">("qr");
  const [customUpiId, setCustomUpiId] = useState<string>("");
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedAmount, setCopiedAmount] = useState<boolean>(false);
  const [submittingStage, setSubmittingStage] = useState<string | null>(null);

  const upiVpa = APP_CONFIG.upiPayeeVpa || "xplosion2k26@sbi";
  const upiName = APP_CONFIG.upiPayeeName || "XPLOSION 2K26";
  const note = `Pass ${registrationNo}`;

  const upiPaymentUri = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(
    upiName
  )}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

  useEffect(() => {
    QRCode.toDataURL(upiPaymentUri, {
      width: 420,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error("UPI QR Generation Error:", err));
  }, [upiPaymentUri]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiVpa);
    setCopied(true);
    toast({
      title: "UPI ID Copied",
      message: `${upiVpa} copied to clipboard.`,
      type: "success",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(amount.toString());
    setCopiedAmount(true);
    toast({
      title: "Amount Copied",
      message: `₹${amount} copied to clipboard.`,
      type: "success",
    });
    setTimeout(() => setCopiedAmount(false), 2500);
  };

  /**
   * Submit the attendee's 12-digit UPI UTR / Transaction ID for manual gate-checker approval
   */
  const handleUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utrNumber.trim().toUpperCase();

    if (!cleanUtr || cleanUtr.length < 6) {
      toast({
        title: "Transaction ID Required",
        message: "Please enter your 12-digit UPI UTR or bank transaction reference number.",
        type: "warning",
      });
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUtr)) {
      toast({
        title: "Invalid Characters",
        message: "Transaction ID must contain only alphanumeric characters.",
        type: "error",
      });
      return;
    }

    setIsProcessing(true);
    setSubmittingStage("Encrypting transaction reference...");

    try {
      await new Promise((r) => setTimeout(r, 400));
      setSubmittingStage("Logging to atomic database ledger...");

      const res = await fetch("/api/checkout/submit-utr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          utrNumber: cleanUtr,
          payerUpiId: customUpiId.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to record transaction ID.");
      }

      setSubmittingStage("Queued for gate checker approval...");
      await new Promise((r) => setTimeout(r, 400));

      toast({
        title: "Transaction ID Submitted",
        message: "Your payment reference was saved. Awaiting Gate Checker verification.",
        type: "success",
      });

      onPaymentSuccess({
        status: json.data?.status || "PENDING_VERIFICATION",
        message: json.message || "Awaiting Gate Checker approval.",
        utr: cleanUtr,
        passIds: json.data?.passIds,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to record transaction ID.";
      toast({ title: "Submission Error", message: msg, type: "error" });
      setIsProcessing(false);
      setSubmittingStage(null);
    }
  };

  const upiApps = [
    {
      id: "gpay",
      name: "Google Pay",
      uri: `gpay://upi/pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`,
      badge: "POPULAR",
    },
    {
      id: "phonepe",
      name: "PhonePe",
      uri: `phonepe://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`,
      badge: "FAST",
    },
    {
      id: "paytm",
      name: "Paytm UPI",
      uri: `paytmmp://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`,
      badge: "DIRECT",
    },
    {
      id: "cred",
      name: "CRED UPI",
      uri: `cred://upi/pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`,
      badge: "REWARDS",
    },
  ];

  return (
    <div className="rounded-2xl border border-[#222222] bg-[#080808] shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden font-mono">
      {/* Merchant Header */}
      <div className="px-6 py-4 bg-[#0D0D0D] border-b border-[#1F1F1F] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#FF0000] flex items-center justify-center text-black font-black font-display text-lg shadow-[0_0_15px_rgba(255,0,0,0.5)]">
            <Flame className="h-5 w-5 fill-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white tracking-wider uppercase font-display">
                XPLOSION 2K26
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#FF0000]/15 border border-[#FF0000]/30 text-[#FF0000] text-[9px] font-bold">
                <CheckCircle2 className="h-2.5 w-2.5" /> OFFICIAL UPI GATEWAY
              </span>
            </div>
            <p className="text-[11px] text-[#A0A0A0]">
              REF: <strong className="text-white">{registrationNo}</strong>
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] text-[#A0A0A0] uppercase font-bold block">EXACT PAYABLE AMOUNT</span>
          <span className="text-2xl sm:text-3xl font-black text-white font-display">
            {formatCurrency(amount)}
          </span>
        </div>
      </div>

      {/* Processing State Overlay */}
      {isProcessing && (
        <div className="p-8 sm:p-12 text-center space-y-6 animate-in fade-in duration-200">
          <div className="relative h-20 w-20 mx-auto">
            <div className="absolute inset-0 rounded-full bg-[#FF0000]/20 animate-ping" />
            <div className="relative h-20 w-20 rounded-full bg-[#0D0D0D] border-2 border-[#FF0000] flex items-center justify-center text-[#FF0000] shadow-[0_0_35px_rgba(255,0,0,0.5)]">
              <Loader2 className="h-9 w-9 animate-spin" />
            </div>
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <Badge variant="primary" size="md">
              <ShieldCheck className="h-3 w-3 mr-1" /> ATOMIC DATABASE LEDGER
            </Badge>
            <h3 className="text-xl font-bold text-white font-display uppercase tracking-wide">
              {submittingStage || "Submitting Transaction Reference..."}
            </h3>
            <p className="text-xs text-[#A0A0A0] font-sans">
              Please wait while your transaction reference is logged into the verification queue.
            </p>
          </div>
        </div>
      )}

      {/* Payment Interface */}
      {!isProcessing && (
        <div className="p-6 sm:p-8 space-y-8 bg-[#080808]">
          {/* Instructions Step Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F] flex items-start gap-3">
              <span className="h-6 w-6 rounded-full bg-[#FF0000] text-black font-black flex items-center justify-center text-xs shrink-0">
                1
              </span>
              <div>
                <p className="font-bold text-white uppercase text-[11px]">Scan QR or Pay via App</p>
                <p className="text-[10px] text-[#A0A0A0] font-sans mt-0.5">
                  Scan QR with GPay, PhonePe, Paytm, BHIM, or CRED.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F] flex items-start gap-3">
              <span className="h-6 w-6 rounded-full bg-[#FF0000] text-black font-black flex items-center justify-center text-xs shrink-0">
                2
              </span>
              <div>
                <p className="font-bold text-white uppercase text-[11px]">Copy 12-Digit UTR</p>
                <p className="text-[10px] text-[#A0A0A0] font-sans mt-0.5">
                  Copy the 12-digit UTR or Txn ID from your payment receipt.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F] flex items-start gap-3">
              <span className="h-6 w-6 rounded-full bg-[#FF0000] text-black font-black flex items-center justify-center text-xs shrink-0">
                3
              </span>
              <div>
                <p className="font-bold text-white uppercase text-[11px]">Enter UTR & Submit</p>
                <p className="text-[10px] text-[#A0A0A0] font-sans mt-0.5">
                  Gate checker verifies UTR and unlocks pass in real time.
                </p>
              </div>
            </div>
          </div>

          {/* Main Payment & UTR Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Dynamic QR & UPI ID */}
            <div className="lg:col-span-6 flex flex-col items-center p-6 rounded-2xl bg-[#0D0D0D] border border-[#1F1F1F] space-y-4">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-bold text-[#FF0000] uppercase tracking-widest block">
                  STEP 1 &bull; SCAN & PAY
                </span>
                <h4 className="text-base font-bold text-white font-display uppercase">
                  Official Merchant UPI QR
                </h4>
              </div>

              {/* High Contrast Merchant QR Card */}
              <div className="p-4 rounded-2xl bg-white border-2 border-[#FF0000] shadow-[0_0_30px_rgba(255,0,0,0.35)] flex flex-col items-center">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="UPI Payment QR Code"
                    className="w-48 h-48 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-lg">
                    <QrCode className="h-20 w-20 text-slate-400 animate-pulse" />
                  </div>
                )}
                <div className="mt-2 text-center">
                  <span className="text-[11px] font-mono font-black text-black bg-slate-100 px-3 py-1 rounded border border-slate-300 block">
                    {formatCurrency(amount)} &bull; {registrationNo}
                  </span>
                </div>
              </div>

              {/* UPI ID & Amount Quick Copy */}
              <div className="w-full space-y-2 pt-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080808] border border-[#222222] text-xs">
                  <span className="text-[#A0A0A0] text-[11px]">UPI ID:</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-white font-mono">{upiVpa}</strong>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#222222] text-[#A0A0A0] hover:text-white transition-colors"
                      title="Copy UPI ID"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-[#00DF8F]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080808] border border-[#222222] text-xs">
                  <span className="text-[#A0A0A0] text-[11px]">Payable Amount:</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-[#FF0000] font-mono text-sm">{formatCurrency(amount)}</strong>
                    <button
                      type="button"
                      onClick={handleCopyAmount}
                      className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#222222] text-[#A0A0A0] hover:text-white transition-colors"
                      title="Copy Amount"
                    >
                      {copiedAmount ? (
                        <Check className="h-3.5 w-3.5 text-[#00DF8F]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Direct UPI App launcher on mobile */}
              <div className="w-full pt-1">
                <a
                  href={upiPaymentUri}
                  className="block w-full py-2.5 px-4 rounded-xl bg-[#141414] hover:bg-[#1C1C1C] border border-[#2A2A2A] text-center text-xs font-bold text-white transition-all sm:hidden"
                >
                  Open in UPI App (Mobile Only) &rarr;
                </a>
              </div>
            </div>

            {/* Right: Mandatory UTR Entry Form */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-[#0D0D0D] border border-[#1F1F1F] space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#00DF8F] uppercase tracking-widest block">
                  STEP 2 &bull; ENTER TRANSACTION ID
                </span>
                <h4 className="text-lg font-black text-white font-display uppercase tracking-wide">
                  Verify Your Payment
                </h4>
                <p className="text-xs text-[#A0A0A0] font-sans">
                  After completing payment in your UPI app, enter your 12-digit UTR / Transaction ID below.
                </p>
              </div>

              <form onSubmit={handleUtrSubmit} className="space-y-5">
                {/* Mandatory UTR / Transaction ID */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white uppercase flex items-center justify-between">
                    <span>UPI Reference / UTR Number *</span>
                    <span className="text-[10px] text-[#FF0000] font-normal">REQUIRED (12 DIGITS)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 426819402847 or T2409..."
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                    className="w-full rounded-xl bg-[#080808] border-2 border-[#333333] px-4 py-3 text-sm text-white font-mono placeholder:text-[#555555] focus:outline-none focus:border-[#FF0000] focus:shadow-[0_0_20px_rgba(255,0,0,0.3)] transition-all"
                    autoFocus
                  />
                  <p className="text-[10px] text-[#A0A0A0] font-sans">
                    Found under &ldquo;UPI Ref No&rdquo; or &ldquo;UTR&rdquo; or &ldquo;Google Transaction ID&rdquo; in your payment app receipt.
                  </p>
                </div>

                {/* Optional Payer UPI ID / Mobile */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#E5E5E5] uppercase flex items-center justify-between">
                    <span>Your UPI ID / Mobile (Optional)</span>
                    <span className="text-[10px] text-[#6F6F6F]">FOR FASTER RECONCILIATION</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. yourname@oksbi or mobile number"
                    value={customUpiId}
                    onChange={(e) => setCustomUpiId(e.target.value)}
                    className="w-full rounded-xl bg-[#080808] border border-[#222222] px-4 py-2.5 text-xs text-white placeholder:text-[#555555] focus:outline-none focus:border-[#FF0000]"
                  />
                </div>

                {/* Info Notice */}
                <div className="p-3.5 rounded-xl bg-[#141414] border border-[#222222] text-xs text-[#A0A0A0] space-y-1.5 font-sans">
                  <div className="flex items-center gap-1.5 text-white font-bold text-[11px] font-mono">
                    <Info className="h-3.5 w-3.5 text-[#FF0000]" />
                    <span>GATE CHECKER VERIFICATION POLICY:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Once submitted, your transaction reference will appear immediately in the Gate Checker Admin console. Your holographic pass will unlock in real time upon approval.
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="neon"
                  size="xl"
                  className="w-full py-4 text-sm font-black tracking-wider"
                  leftIcon={<ShieldCheck className="h-5 w-5 text-black" />}
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                >
                  SUBMIT TRANSACTION ID FOR VERIFICATION
                </Button>
              </form>
            </div>
          </div>

          {/* Security Banner */}
          <div className="pt-4 border-t border-[#1F1F1F] flex flex-wrap items-center justify-between gap-4 text-[11px] text-[#6F6F6F]">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-[#FF0000]" />
              <span>Real-Time Gate Verification &bull; Anti-Duplication Cryptographic Check</span>
            </div>
            <span>PCI-DSS Level 1 &bull; 256-Bit SSL Secured</span>
          </div>
        </div>
      )}
    </div>
  );
};
