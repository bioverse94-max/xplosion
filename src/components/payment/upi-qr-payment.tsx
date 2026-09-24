"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  QrCode,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  ExternalLink,
  ArrowRight,
  AlertTriangle,
  Info,
  Sparkles,
  Lock,
} from "lucide-react";

interface UpiQrPaymentProps {
  registrationId: string;
  registrationNo: string;
  amount: number;
  onPaymentSubmitted: (result: { status: string; message: string; passIds?: string[] }) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

export const UpiQrPayment: React.FC<UpiQrPaymentProps> = ({
  registrationId,
  registrationNo,
  amount,
  onPaymentSubmitted,
  isProcessing,
  setIsProcessing,
}) => {
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [payerUpiId, setPayerUpiId] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>("");

  const upiVpa = process.env.NEXT_PUBLIC_UPI_VPA || "neongenesis2026@sbi";
  const upiName = process.env.NEXT_PUBLIC_UPI_NAME || "Neon Genesis 2026";
  const note = `Pass ${registrationNo}`;

  // Build standard UPI Payment URI
  const upiPaymentUri = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(
    upiName
  )}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

  useEffect(() => {
    QRCode.toDataURL(upiPaymentUri, {
      width: 400,
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
      title: "UPI ID Copied!",
      message: `${upiVpa} copied to clipboard.`,
      type: "success",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenUpiApp = () => {
    window.location.href = upiPaymentUri;
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    const cleanedUtr = utrNumber.trim().toUpperCase();
    if (!cleanedUtr) {
      setValidationError("Please enter the 12-digit UPI Transaction ID / UTR Number.");
      return;
    }

    if (cleanedUtr.length < 6 || cleanedUtr.length > 30) {
      setValidationError("Transaction ID must be between 6 and 30 characters.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/checkout/submit-utr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          utrNumber: cleanedUtr,
          payerUpiId: payerUpiId.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to submit Transaction ID.");
      }

      onPaymentSubmitted(json.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error submitting transaction.";
      setValidationError(msg);
      toast({
        title: "Transaction Submission Failed",
        message: msg,
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Instruction */}
      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white uppercase tracking-wider">Official UPI Payment QR</p>
            <p className="text-[11px] text-slate-300">
              Scan with Google Pay, PhonePe, Paytm, BHIM, or any banking app.
            </p>
          </div>
        </div>
        <Badge variant="paid">Instant QR</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: QR Code Display */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[280px] p-4 rounded-2xl bg-white border-2 border-primary/50 shadow-[0_0_35px_rgba(0,240,255,0.25)] flex flex-col items-center relative group">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="UPI Payment QR Code"
                className="w-full aspect-square object-contain rounded-lg"
              />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center bg-slate-100 rounded-lg">
                <QrCode className="h-16 w-16 text-slate-400 animate-pulse" />
              </div>
            )}

            <div className="mt-2 text-center w-full">
              <span className="text-[10px] font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 block truncate">
                {note}
              </span>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                Amount: {formatCurrency(amount)}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons for Mobile */}
          <div className="w-full max-w-[280px] space-y-2 mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyUpi}
              className="w-full text-xs font-mono"
              leftIcon={copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            >
              {copied ? "Copied UPI ID!" : `Copy: ${upiVpa}`}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleOpenUpiApp}
              className="w-full text-xs text-primary hover:text-white"
              leftIcon={<Smartphone className="h-3.5 w-3.5" />}
            >
              Open in UPI App
            </Button>
          </div>
        </div>

        {/* Right Column: Steps & UTR Submission Form */}
        <div className="md:col-span-7 space-y-5">
          {/* Step Guide */}
          <div className="p-4 rounded-xl bg-surface/60 border border-surface-border space-y-2 text-xs text-slate-300">
            <p className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              How to Complete Your Payment:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed text-[11px]">
              <li>Scan the QR code with your UPI app or copy the UPI ID.</li>
              <li>
                Pay the exact total amount: <strong className="text-white">{formatCurrency(amount)}</strong>.
              </li>
              <li>
                Find the <span className="text-primary font-bold">12-digit UTR / UPI Transaction ID</span> in your payment receipt.
              </li>
              <li>Enter it below to confirm your passes.</li>
            </ol>
          </div>

          {/* UTR Submission Form */}
          <form onSubmit={handleSubmitUtr} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>12-Digit UPI Transaction ID / UTR *</span>
                <span className="text-[10px] text-slate-400 font-normal">Found on bank/app receipt</span>
              </label>
              <input
                type="text"
                required
                value={utrNumber}
                onChange={(e) => {
                  setUtrNumber(e.target.value);
                  if (validationError) setValidationError("");
                }}
                placeholder="e.g. 426819402847 or T240923..."
                className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Your UPI ID / VPA (Optional)</span>
                <span className="text-[10px] text-slate-500 font-normal">For instant account matching</span>
              </label>
              <input
                type="text"
                value={payerUpiId}
                onChange={(e) => setPayerUpiId(e.target.value)}
                placeholder="e.g. yourname@oksbi / mobile@paytm"
                className="w-full rounded-xl bg-surface border border-surface-border px-4 py-2.5 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-primary"
              />
            </div>

            {validationError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="neon"
              size="lg"
              className="w-full"
              isLoading={isProcessing}
              leftIcon={<Lock className="h-4 w-4 text-black" />}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Submit Transaction & Request Pass
            </Button>
          </form>

          {/* Security Guarantee Stamp */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              Anti-Fraud Protected &bull; Each UTR is cryptographically mapped & deduplicated in the database ledger.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
