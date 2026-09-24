"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { EventDetailDTO, TicketTierDTO } from "@/types";
import { StageLight, SectionMarker, NoiseOverlay } from "@/components/effects/visual-engine";
import {
  User,
  Ticket,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Plus,
  Minus,
  Lock,
  Edit3,
  Flame,
  Smartphone,
  Mail,
  Send,
  Check,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTierId = searchParams.get("tier");
  const initialQty = parseInt(searchParams.get("qty") || "1", 10);
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [event, setEvent] = useState<EventDetailDTO | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "", // College Email
    personalEmail: "", // Personal Email for pass delivery & receipts
    phone: "",
    college: "",
    academicYear: "1st Year (Freshers Batch '26)",
    branch: "",
  });

  // Phone OTP Verification States
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneVerificationToken, setPhoneVerificationToken] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState("");
  const [phoneVerificationId, setPhoneVerificationId] = useState("");
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);
  const [phoneOtpCountdown, setPhoneOtpCountdown] = useState(0);

  // Personal Email Verification States (Optional / Recommended)
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailVerificationId, setEmailVerificationId] = useState("");
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [emailOtpCountdown, setEmailOtpCountdown] = useState(0);

  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Countdown timer for Phone OTP resend
  useEffect(() => {
    if (phoneOtpCountdown <= 0) return;
    const timer = setInterval(() => setPhoneOtpCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [phoneOtpCountdown]);

  // Countdown timer for Email OTP resend
  useEffect(() => {
    if (emailOtpCountdown <= 0) return;
    const timer = setInterval(() => setEmailOtpCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [emailOtpCountdown]);

  useEffect(() => {
    async function loadEvent() {
      try {
        const res = await fetch("/api/events");
        const json = await res.json();
        if (json.success && json.data) {
          setEvent(json.data);
          // Pre-select tier from query param if provided
          if (initialTierId) {
            const requestedTier = json.data.ticketTypes.find((t: TicketTierDTO) => t.id === initialTierId);
            if (requestedTier && !requestedTier.isSoldOut) {
              const qty = Math.min(requestedTier.maxPerOrder, Math.min(requestedTier.availableCount, initialQty || 1));
              setSelectedTickets({ [initialTierId]: qty });
            }
          } else if (json.data.ticketTypes.length > 0) {
            const firstAvail = json.data.ticketTypes.find((t: TicketTierDTO) => !t.isSoldOut);
            if (firstAvail) {
              setSelectedTickets({ [firstAvail.id]: 1 });
            }
          }
        }
      } catch (err) {
        console.error("Failed to load event data:", err);
      } finally {
        setLoadingEvent(false);
      }
    }
    loadEvent();
  }, [initialTierId, initialQty]);

  const updateQuantity = (tierId: string, delta: number, maxAllowed: number, availableCount: number) => {
    setSelectedTickets((prev) => {
      const current = prev[tierId] || 0;
      const limit = Math.min(maxAllowed, availableCount);
      const updated = Math.max(0, Math.min(limit, current + delta));
      if (updated === 0) {
        const copy = { ...prev };
        delete copy[tierId];
        return copy;
      }
      return { ...prev, [tierId]: updated };
    });
  };

  const calculateSubtotal = () => {
    if (!event) return 0;
    return Object.entries(selectedTickets).reduce((sum, [tierId, qty]) => {
      const tier = event.ticketTypes.find((t) => t.id === tierId);
      return sum + (tier ? tier.price * qty : 0);
    }, 0);
  };

  const totalQuantity = Object.values(selectedTickets).reduce((a, b) => a + b, 0);

  // Phone OTP: Dispatch code
  const handleSendPhoneOtp = async () => {
    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      toast({
        title: "Invalid Mobile Number",
        message: "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
        type: "error",
      });
      return;
    }

    setIsSendingPhoneOtp(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: cleanPhone, type: "PHONE" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to dispatch OTP.");
      }

      setPhoneOtpSent(true);
      setPhoneVerificationId(json.data.verificationId);
      setPhoneOtpCountdown(30);

      toast({
        title: "OTP Dispatched",
        message: `6-digit verification code sent to +91 ${cleanPhone}.`,
        type: "success",
      });
    } catch (err) {
      toast({
        title: "OTP Error",
        message: err instanceof Error ? err.message : "Failed to send OTP.",
        type: "error",
      });
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  // Phone OTP: Verify code
  const handleVerifyPhoneOtp = async () => {
    const cleanCode = phoneOtpCode.trim().replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      toast({ title: "Incomplete Code", message: "Please enter the complete 6-digit OTP code.", type: "warning" });
      return;
    }

    setIsVerifyingPhoneOtp(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: formData.phone.replace(/\D/g, ""),
          type: "PHONE",
          code: cleanCode,
          verificationId: phoneVerificationId,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Incorrect OTP code.");
      }

      setIsPhoneVerified(true);
      setPhoneVerificationToken(json.token);
      setPhoneOtpSent(false);

      toast({
        title: "Mobile Verified ✓",
        message: "Your phone number is confirmed and locked.",
        type: "success",
      });
    } catch (err) {
      toast({
        title: "Verification Failed",
        message: err instanceof Error ? err.message : "Incorrect OTP.",
        type: "error",
      });
    } finally {
      setIsVerifyingPhoneOtp(false);
    }
  };

  // Personal Email OTP: Dispatch code
  const handleSendEmailOtp = async () => {
    const cleanEmail = formData.personalEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast({
        title: "Invalid Email",
        message: "Please enter a valid personal email address (e.g. name@gmail.com).",
        type: "error",
      });
      return;
    }

    setIsSendingEmailOtp(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: cleanEmail, type: "EMAIL" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to send email verification code.");
      }

      setEmailOtpSent(true);
      setEmailVerificationId(json.data.verificationId);
      setEmailOtpCountdown(30);

      toast({
        title: "Email Code Sent",
        message: `Verification code dispatched to ${cleanEmail}. Check your inbox.`,
        type: "success",
      });
    } catch (err) {
      toast({
        title: "Email Error",
        message: err instanceof Error ? err.message : "Failed to dispatch email code.",
        type: "error",
      });
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  // Personal Email OTP: Verify code
  const handleVerifyEmailOtp = async () => {
    const cleanCode = emailOtpCode.trim().replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      toast({ title: "Incomplete Code", message: "Please enter the complete 6-digit email code.", type: "warning" });
      return;
    }

    setIsVerifyingEmailOtp(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: formData.personalEmail.trim().toLowerCase(),
          type: "EMAIL",
          code: cleanCode,
          verificationId: emailVerificationId,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Incorrect email code.");
      }

      setIsEmailVerified(true);
      setEmailVerificationToken(json.token);
      setEmailOtpSent(false);

      toast({
        title: "Personal Email Verified ✓",
        message: "Your personal email has been confirmed.",
        type: "success",
      });
    } catch (err) {
      toast({
        title: "Verification Failed",
        message: err instanceof Error ? err.message : "Incorrect email code.",
        type: "error",
      });
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errors.fullName = "Full name must be at least 2 characters";
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      errors.email = "Valid college email required (e.g. rollno@kiit.ac.in)";
    }
    if (!formData.personalEmail.trim() || !formData.personalEmail.includes("@")) {
      errors.personalEmail = "Valid personal email required for pass delivery (e.g. name@gmail.com)";
    }
    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = "Valid 10-digit Indian mobile number required (starts with 6, 7, 8, 9)";
    } else if (!isPhoneVerified) {
      errors.phone = "Mobile number must be verified using the 6-digit OTP";
    }
    if (!formData.college.trim()) errors.college = "College / Institution is required";
    if (!formData.branch.trim()) errors.branch = "Department / Branch is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      } else {
        if (!isPhoneVerified) {
          toast({
            title: "Phone Verification Required",
            message: "Please click 'Send OTP' and verify your 10-digit mobile number before proceeding.",
            type: "warning",
          });
        } else {
          toast({
            title: "Incomplete Details",
            message: "Please complete all attendee fields including personal email.",
            type: "warning",
          });
        }
      }
    } else if (step === 2) {
      if (totalQuantity === 0) {
        toast({
          title: "No Passes Selected",
          message: "Please select at least 1 pass to continue.",
          type: "warning",
        });
      } else {
        setStep(3);
      }
    }
  };

  const handleReserveAndPay = async () => {
    if (!event) return;
    setIsSubmitting(true);

    try {
      const items = Object.entries(selectedTickets).map(([ticketTypeId, quantity]) => ({
        ticketTypeId,
        quantity,
      }));

      const res = await fetch("/api/checkout/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          attendee: {
            ...formData,
            phoneVerificationToken,
            emailVerificationToken: emailVerificationToken || undefined,
          },
          items,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Reservation hold failed");
      }

      toast({
        title: "Passes Reserved Successfully",
        message: "Your ticket hold is locked for 10 minutes. Proceeding to checkout...",
        type: "success",
      });

      router.push(
        `/checkout?registrationId=${json.data.registrationId}&regNo=${json.data.registrationNo}&amount=${json.data.totalAmount}`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to hold ticket reservation.";
      toast({ title: "Reservation Error", message: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, label: "01 DETAILS" },
    { num: 2, label: "02 TICKET" },
    { num: 3, label: "03 REVIEW" },
    { num: 4, label: "04 PAYMENT" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#030303] text-[#F5F5F5]">
      <PublicNavbar />

      <main className="flex-1 pt-28 pb-20 relative overflow-hidden">
        <StageLight position="top" intensity="medium" />
        <NoiseOverlay opacity={0.03} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#080808] border border-[#FF0000]/40 text-[#FF0000] text-xs font-mono font-bold tracking-widest uppercase mb-3 shadow-[0_0_15px_rgba(255,0,0,0.25)]">
              <Flame className="h-3.5 w-3.5" />
              TICKET REGISTRATION
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white font-display uppercase tracking-tight">
              GET YOUR <span className="text-[#FF0000] glow-red">PASS</span>
            </h1>
            <p className="text-xs sm:text-sm font-mono text-[#A0A0A0] mt-2 uppercase tracking-wider">
              OFFICIAL PASS REGISTRATION &bull; OTP SECURED MOBILE VALIDATION
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-4 gap-2 mb-10">
            {stepsList.map((s) => {
              const isActive = s.num === step;
              const isPast = s.num < step;
              return (
                <div key={s.num} className="space-y-2">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? "bg-[#FF0000] shadow-[0_0_10px_#FF0000]"
                        : isPast
                        ? "bg-[#00DF8F]"
                        : "bg-[#1E1E1E]"
                    }`}
                  />
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span
                      className={`font-bold ${
                        isActive ? "text-[#FF0000]" : isPast ? "text-[#00DF8F]" : "text-[#555555]"
                      }`}
                    >
                      {s.label}
                    </span>
                    {isPast && <CheckCircle2 className="h-3 w-3 text-[#00DF8F]" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step 1: Attendee Details + OTP Verification */}
          {step === 1 && (
            <div className="p-6 sm:p-8 rounded-2xl bg-[#080808] border border-[#222222] space-y-6 shadow-[0_10px_35px_rgba(0,0,0,0.8)] animate-in fade-in duration-200">
              <div className="border-b border-[#1A1A1A] pb-4">
                <SectionMarker number="01" title="ATTENDEE IDENTIFICATION &amp; VERIFICATION" />
                <h3 className="text-2xl font-black text-white font-display uppercase tracking-wide">
                  Step 1: Attendee &amp; Verification Details
                </h3>
                <p className="text-xs font-mono text-[#A0A0A0] mt-1 uppercase">
                  Mobile number must be validated via OTP. Passes and invoices are dispatched to your personal email.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* 1. Full Name */}
                <div className="sm:col-span-2">
                  <Input
                    label="Full Name *"
                    placeholder="e.g. Aryan Sharma"
                    value={formData.fullName}
                    error={formErrors.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>

                {/* 2. Personal Email (Primary Pass Delivery & Email Verification) */}
                <div className="space-y-3 p-4 rounded-xl bg-[#0D0D0D] border border-[#222222]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold tracking-wider text-white uppercase flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#FF0000]" />
                      <span>Personal Email (Pass & Bill Delivery) *</span>
                    </label>
                    {isEmailVerified ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#00DF8F]/15 border border-[#00DF8F]/40 text-[#00DF8F] text-[11px] font-mono font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> EMAIL VERIFIED
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEmailVerified(false);
                            setEmailOtpSent(false);
                            setEmailVerificationToken("");
                          }}
                          className="text-[11px] font-mono text-[#A0A0A0] hover:text-white underline"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono text-[#A0A0A0]">
                        PRIMARY PASS INBOX
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      disabled={isEmailVerified}
                      placeholder="e.g. aryan@gmail.com"
                      value={formData.personalEmail}
                      onChange={(e) => {
                        setFormData({ ...formData, personalEmail: e.target.value });
                        setIsEmailVerified(false);
                        setEmailOtpSent(false);
                      }}
                      className={`flex-1 rounded-xl bg-[#080808] border px-4 py-3 text-sm text-[#F5F5F5] placeholder:text-[#555555] focus:outline-none ${
                        isEmailVerified
                          ? "border-[#00DF8F] bg-[#00DF8F]/5 text-[#00DF8F]"
                          : formErrors.personalEmail
                          ? "border-rose-500"
                          : "border-[#222222] focus:border-[#FF0000]"
                      }`}
                      required
                    />

                    {!isEmailVerified && (
                      <Button
                        type="button"
                        variant={emailOtpSent ? "outline" : "secondary"}
                        size="md"
                        disabled={
                          !formData.personalEmail.includes("@") ||
                          isSendingEmailOtp ||
                          emailOtpCountdown > 0
                        }
                        isLoading={isSendingEmailOtp}
                        onClick={handleSendEmailOtp}
                        leftIcon={<Mail className="h-3.5 w-3.5 text-black" />}
                        className="sm:w-auto shrink-0 text-xs"
                      >
                        {emailOtpCountdown > 0
                          ? `Resend in ${emailOtpCountdown}s`
                          : emailOtpSent
                          ? "Resend Code"
                          : "Verify Email"}
                      </Button>
                    )}
                  </div>

                  {formErrors.personalEmail && (
                    <p className="text-xs text-rose-500 font-mono">{formErrors.personalEmail}</p>
                  )}

                  {/* Email OTP Input Card when Code is Dispatched */}
                  {emailOtpSent && !isEmailVerified && (
                    <div className="p-3.5 rounded-xl bg-[#141414] border border-[#FF0000]/40 space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase font-mono">
                          Enter 6-Digit Email Verification Code
                        </span>
                        <span className="text-[10px] text-[#A0A0A0] font-mono">
                          Dispatched to {formData.personalEmail}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="&bull; &bull; &bull; &bull; &bull; &bull;"
                          value={emailOtpCode}
                          onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="flex-1 rounded-xl bg-[#080808] border border-[#333333] px-4 py-2 text-center text-lg font-mono font-bold tracking-[0.4em] text-white focus:outline-none focus:border-[#FF0000]"
                          autoFocus
                        />
                        <Button
                          type="button"
                          variant="neon"
                          size="md"
                          disabled={emailOtpCode.length !== 6 || isVerifyingEmailOtp}
                          isLoading={isVerifyingEmailOtp}
                          onClick={handleVerifyEmailOtp}
                          leftIcon={<Check className="h-4 w-4 text-black" />}
                        >
                          Confirm
                        </Button>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-[#A0A0A0] font-sans">
                    All digital admission QR passes and invoices are dispatched directly to this inbox upon approval.
                  </p>
                </div>

                {/* 3. College Email (Student ID Verification) */}
                <div>
                  <Input
                    label="College Email Address *"
                    type="email"
                    placeholder="e.g. aryan@kiit.ac.in"
                    value={formData.email}
                    error={formErrors.email}
                    helperText="Used to confirm collegiate student status at the venue gate."
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                {/* 4. Phone Number with Integrated OTP Verification */}
                <div className="sm:col-span-2 space-y-3 p-4 rounded-xl bg-[#0D0D0D] border border-[#222222]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold tracking-wider text-white uppercase flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-[#FF0000]" />
                      <span>10-Digit Mobile Number (OTP Verified) *</span>
                    </label>
                    {isPhoneVerified ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#00DF8F]/15 border border-[#00DF8F]/40 text-[#00DF8F] text-[11px] font-mono font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> PHONE VERIFIED
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsPhoneVerified(false);
                            setPhoneOtpSent(false);
                            setPhoneVerificationToken("");
                          }}
                          className="text-[11px] font-mono text-[#A0A0A0] hover:text-white underline"
                        >
                          Change Number
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono text-[#FF0000] font-bold">
                        OTP VERIFICATION MANDATORY
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#A0A0A0]">
                        +91
                      </div>
                      <input
                        type="tel"
                        disabled={isPhoneVerified}
                        placeholder="9876543210 (10 digits starting 6-9)"
                        value={formData.phone}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setFormData({ ...formData, phone: digits });
                          setIsPhoneVerified(false);
                          setPhoneOtpSent(false);
                        }}
                        className={`w-full rounded-xl bg-[#080808] border pl-12 pr-4 py-3 text-sm text-[#F5F5F5] font-mono placeholder:text-[#555555] focus:outline-none ${
                          isPhoneVerified
                            ? "border-[#00DF8F] text-[#00DF8F]"
                            : formErrors.phone
                            ? "border-rose-500"
                            : "border-[#222222] focus:border-[#FF0000]"
                        }`}
                      />
                    </div>

                    {!isPhoneVerified && (
                      <Button
                        type="button"
                        variant={phoneOtpSent ? "outline" : "neon"}
                        size="md"
                        disabled={
                          formData.phone.replace(/\D/g, "").length !== 10 ||
                          isSendingPhoneOtp ||
                          phoneOtpCountdown > 0
                        }
                        isLoading={isSendingPhoneOtp}
                        onClick={handleSendPhoneOtp}
                        leftIcon={<Send className="h-3.5 w-3.5 text-black" />}
                        className="sm:w-auto shrink-0"
                      >
                        {phoneOtpCountdown > 0
                          ? `Resend OTP in ${phoneOtpCountdown}s`
                          : phoneOtpSent
                          ? "Resend Code"
                          : "Send OTP Code"}
                      </Button>
                    )}
                  </div>

                  {formErrors.phone && (
                    <p className="text-xs text-rose-500 font-mono">{formErrors.phone}</p>
                  )}

                  {/* OTP Input Card when Code is Dispatched */}
                  {phoneOtpSent && !isPhoneVerified && (
                    <div className="p-4 rounded-xl bg-[#141414] border border-[#FF0000]/40 space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase font-mono">
                          Enter 6-Digit SMS OTP Code
                        </span>
                        <span className="text-[10px] text-[#A0A0A0] font-mono">
                          Sent to +91 {formData.phone}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="&bull; &bull; &bull; &bull; &bull; &bull;"
                          value={phoneOtpCode}
                          onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="flex-1 rounded-xl bg-[#080808] border border-[#333333] px-4 py-2.5 text-center text-lg font-mono font-bold tracking-[0.4em] text-white focus:outline-none focus:border-[#FF0000]"
                          autoFocus
                        />
                        <Button
                          type="button"
                          variant="neon"
                          size="md"
                          disabled={phoneOtpCode.length !== 6 || isVerifyingPhoneOtp}
                          isLoading={isVerifyingPhoneOtp}
                          onClick={handleVerifyPhoneOtp}
                          leftIcon={<Check className="h-4 w-4 text-black" />}
                        >
                          Verify &amp; Confirm
                        </Button>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-[#A0A0A0] font-sans">
                    Your 10-digit mobile number serves as your permanent security identifier on the door check-in scanner and pass portal.
                  </p>
                </div>

                {/* 5. College Name */}
                <div>
                  <Input
                    label="College / Institute Name *"
                    placeholder="e.g. KIIT University"
                    value={formData.college}
                    error={formErrors.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    required
                  />
                </div>

                {/* 6. Academic Year */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold tracking-wider text-[#E5E5E5] uppercase">
                    Academic Year *
                  </label>
                  <select
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full rounded-xl bg-[#080808] border border-[#222222] px-4 py-3 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000]"
                  >
                    <option value="1st Year (Freshers Batch '26)">1st Year (Freshers Batch &apos;26)</option>
                    <option value="2nd Year (Senior)">2nd Year (Senior)</option>
                    <option value="3rd Year (Senior)">3rd Year (Senior)</option>
                    <option value="4th Year (Senior)">4th Year (Senior)</option>
                    <option value="Alumni / Guest">Alumni / Guest</option>
                  </select>
                </div>

                {/* 7. Branch / Department */}
                <div className="sm:col-span-2">
                  <Input
                    label="Department / Branch *"
                    placeholder="e.g. Computer Science &amp; Engineering"
                    value={formData.branch}
                    error={formErrors.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-[#1A1A1A] flex justify-end">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleNextStep}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Continue to Pass Selection
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Ticket Selection */}
          {step === 2 && (
            <div className="p-6 sm:p-8 rounded-2xl bg-[#080808] border border-[#222222] space-y-6 shadow-[0_10px_35px_rgba(0,0,0,0.8)] animate-in fade-in duration-200">
              <div className="border-b border-[#1A1A1A] pb-4">
                <SectionMarker number="02" title="TIER &amp; INVENTORY SELECTION" />
                <h3 className="text-2xl font-black text-white font-display uppercase tracking-wide">
                  Step 2: Select Your Passes
                </h3>
                <p className="text-xs font-mono text-[#A0A0A0] mt-1 uppercase">
                  Select pass tier and quantity. Maximum {event?.ticketTypes[0]?.maxPerOrder || 5} passes per order.
                </p>
              </div>

              {loadingEvent ? (
                <div className="text-center py-12 text-[#A0A0A0] font-mono text-xs">
                  Loading available pass tiers from atomic inventory...
                </div>
              ) : (
                <div className="space-y-4">
                  {event?.ticketTypes.map((tier) => {
                    const selectedQty = selectedTickets[tier.id] || 0;
                    const isSoldOut = tier.isSoldOut;

                    return (
                      <div
                        key={tier.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          selectedQty > 0
                            ? "bg-[#0D0D0D] border-[#FF0000] shadow-[0_0_20px_rgba(255,0,0,0.2)]"
                            : isSoldOut
                            ? "bg-[#050505] border-[#1A1A1A] opacity-50"
                            : "bg-[#080808] border-[#222222] hover:border-[#333333]"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-lg font-black text-white font-display uppercase">
                                {tier.name}
                              </h4>
                              {isSoldOut ? (
                                <Badge variant="danger" size="sm">
                                  SOLD OUT
                                </Badge>
                              ) : tier.availableCount <= 10 ? (
                                <Badge variant="warning" size="sm">
                                  ONLY {tier.availableCount} LEFT
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-xs text-[#A0A0A0] font-mono">
                              {tier.benefits?.join(" • ") || "Full Access Pass"}
                            </p>
                            <p className="text-base font-black text-[#FF0000] font-display pt-1">
                              {formatCurrency(tier.price)}{" "}
                              <span className="text-[10px] text-[#A0A0A0] font-mono font-normal">/ pass</span>
                            </p>
                          </div>

                          {!isSoldOut && (
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                disabled={selectedQty <= 0}
                                onClick={() => updateQuantity(tier.id, -1, tier.maxPerOrder, tier.availableCount)}
                                className="h-9 w-9 rounded-xl bg-[#141414] border border-[#2A2A2A] text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#222222] transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-8 text-center text-base font-bold font-mono text-white">
                                {selectedQty}
                              </span>
                              <button
                                type="button"
                                disabled={selectedQty >= Math.min(tier.maxPerOrder, tier.availableCount)}
                                onClick={() => updateQuantity(tier.id, 1, tier.maxPerOrder, tier.availableCount)}
                                className="h-9 w-9 rounded-xl bg-[#141414] border border-[#2A2A2A] text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#222222] transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-6 border-t border-[#1A1A1A] flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                  Back to Details
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleNextStep}
                  disabled={totalQuantity === 0}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Review Order ({formatCurrency(calculateSubtotal())})
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <div className="p-6 sm:p-8 rounded-2xl bg-[#080808] border border-[#222222] space-y-6 shadow-[0_10px_35px_rgba(0,0,0,0.8)] animate-in fade-in duration-200">
              <div className="border-b border-[#1A1A1A] pb-4">
                <SectionMarker number="03" title="REVIEW &amp; CONFIRM" />
                <h3 className="text-2xl font-black text-white font-display uppercase tracking-wide">
                  Step 3: Review &amp; Lock Reservation
                </h3>
                <p className="text-xs font-mono text-[#A0A0A0] mt-1 uppercase">
                  Verify attendee data and pass quantities before triggering atomic hold.
                </p>
              </div>

              {/* Attendee Profile Box */}
              <div className="p-5 rounded-xl bg-[#0D0D0D] border border-[#222222] space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-[#1A1A1A]">
                  <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <User className="h-4 w-4 text-[#FF0000]" />
                    ATTENDEE PROFILE
                  </span>
                  <button
                    onClick={() => setStep(1)}
                    className="text-[#FF0000] hover:underline font-bold flex items-center gap-1 text-xs"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    EDIT
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[#A0A0A0]">
                  <p><span className="text-[#6F6F6F]">NAME:</span> <strong className="text-white">{formData.fullName}</strong></p>
                  <p>
                    <span className="text-[#6F6F6F]">PERSONAL EMAIL:</span>{" "}
                    <strong className="text-[#00DF8F]">{formData.personalEmail}</strong>{" "}
                    {isEmailVerified && <span className="text-[#00DF8F] font-bold text-[10px] ml-1">(VERIFIED ✓)</span>}
                  </p>
                  <p><span className="text-[#6F6F6F]">COLLEGE EMAIL:</span> <strong className="text-white">{formData.email}</strong></p>
                  <p>
                    <span className="text-[#6F6F6F]">PHONE:</span>{" "}
                    <strong className="text-white">+91 {formData.phone}</strong>{" "}
                    <span className="text-[#00DF8F] font-bold text-[10px] ml-1">(VERIFIED ✓)</span>
                  </p>
                  <p><span className="text-[#6F6F6F]">COLLEGE:</span> <strong className="text-white">{formData.college}</strong></p>
                  <p><span className="text-[#6F6F6F]">YEAR:</span> <strong className="text-white">{formData.academicYear}</strong></p>
                  <p><span className="text-[#6F6F6F]">BRANCH:</span> <strong className="text-white">{formData.branch}</strong></p>
                </div>
              </div>

              {/* Order Summary Breakdown */}
              <div className="space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-[#FF0000]" />
                    ORDER SUMMARY
                  </h4>
                  <button
                    onClick={() => setStep(2)}
                    className="text-[#FF0000] hover:underline font-bold flex items-center gap-1 text-xs"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    MODIFY
                  </button>
                </div>

                <div className="divide-y divide-[#1A1A1A] border border-[#222222] rounded-xl bg-[#080808]">
                  {Object.entries(selectedTickets).map(([tierId, qty]) => {
                    const tier = event?.ticketTypes.find((t) => t.id === tierId);
                    if (!tier) return null;
                    return (
                      <div key={tierId} className="p-4 flex items-center justify-between text-xs sm:text-sm">
                        <div>
                          <p className="font-bold text-white uppercase font-display text-base">
                            {tier.name} &times; {qty}
                          </p>
                          <p className="text-[#A0A0A0] text-xs">{formatCurrency(tier.price)} per pass</p>
                        </div>
                        <span className="font-bold text-white font-display text-lg">
                          {formatCurrency(tier.price * qty)}
                        </span>
                      </div>
                    );
                  })}

                  <div className="p-4 bg-[#0D0D0D] flex items-center justify-between text-xs text-[#A0A0A0]">
                    <span>PLATFORM &amp; CONVENIENCE FEE</span>
                    <span className="text-[#00DF8F] font-bold">₹0 (WAIVED FOR BATCH &apos;26)</span>
                  </div>

                  <div className="p-5 bg-[#121212] flex items-center justify-between text-base sm:text-lg font-bold">
                    <span className="text-white font-display uppercase tracking-wider">TOTAL PAYABLE</span>
                    <span className="text-[#FF0000] font-display text-2xl sm:text-3xl font-black glow-red">
                      {formatCurrency(calculateSubtotal())}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security guarantee notice */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[#0D0D0D] border border-[#FF0000]/30 text-xs text-[#A0A0A0] font-mono">
                <ShieldCheck className="h-5 w-5 text-[#FF0000] shrink-0" />
                <p>
                  Proceeding will hold your passes in the database for 10 minutes. Complete payment on the merchant gateway to generate your pass.
                </p>
              </div>

              <div className="pt-6 border-t border-[#1A1A1A] flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                  Back
                </Button>
                <Button
                  variant="neon"
                  size="xl"
                  isLoading={isSubmitting}
                  onClick={handleReserveAndPay}
                  leftIcon={<Lock className="h-4 w-4 text-black" />}
                >
                  Continue to Payment ({formatCurrency(calculateSubtotal())})
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
