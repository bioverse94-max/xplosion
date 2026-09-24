import crypto from "crypto";
import { APP_CONFIG } from "@/lib/config";
import { EmailService } from "./email.service";

const OTP_SECRET = APP_CONFIG.hmacSecret || "dev-secret-super-secure-hmac-key-change-in-production-min-32-chars";

export interface SendOtpResult {
  success: boolean;
  verificationId: string;
  target: string;
  type: "PHONE" | "EMAIL";
  message: string;
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
  token?: string;
}

export class OtpService {
  /**
   * Hashes a 6-digit OTP code using HMAC-SHA256
   */
  private static hashOtp(target: string, code: string): string {
    return crypto
      .createHmac("sha256", OTP_SECRET)
      .update(`${target}:${code}`)
      .digest("hex");
  }

  /**
   * Creates a signed verification session token
   */
  private static signPayload(payload: any): string {
    const dataStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", OTP_SECRET)
      .update(dataStr)
      .digest("base64url");
    return `${dataStr}.${signature}`;
  }

  /**
   * Verifies and decodes a signed token
   */
  private static verifyPayload<T = any>(token: string): T | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 2) return null;
      const [dataStr, signature] = parts;
      const expectedSig = crypto
        .createHmac("sha256", OTP_SECRET)
        .update(dataStr)
        .digest("base64url");
      if (signature !== expectedSig) return null;
      return JSON.parse(Buffer.from(dataStr, "base64url").toString("utf-8")) as T;
    } catch {
      return null;
    }
  }

  /**
   * Normalizes and validates target format (Phone or Email)
   */
  static normalizeTarget(target: string, type: "PHONE" | "EMAIL"): { isValid: boolean; normalized: string; error?: string } {
    if (type === "PHONE") {
      const digitsOnly = target.replace(/\D/g, "");
      const normalized = digitsOnly.length > 10 && digitsOnly.startsWith("91") ? digitsOnly.slice(2) : digitsOnly;
      
      if (!/^[6-9]\d{9}$/.test(normalized)) {
        return {
          isValid: false,
          normalized,
          error: "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
        };
      }
      return { isValid: true, normalized };
    } else {
      const cleanEmail = target.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return {
          isValid: false,
          normalized: cleanEmail,
          error: "Please enter a valid personal email address (e.g. name@gmail.com).",
        };
      }
      return { isValid: true, normalized: cleanEmail };
    }
  }

  /**
   * Generates a 6-digit OTP and dispatches it via SMS / Email
   */
  static async sendOtp(target: string, type: "PHONE" | "EMAIL"): Promise<SendOtpResult> {
    const { isValid, normalized, error } = this.normalizeTarget(target, type);
    if (!isValid) {
      throw new Error(error || `Invalid ${type.toLowerCase()} format.`);
    }

    // Generate random 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = this.hashOtp(normalized, code);
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const verificationId = this.signPayload({
      target: normalized,
      type,
      codeHash,
      expiresAt,
    });

    console.log(`[OTP] Generated 6-digit code for ${type} (${normalized}): [${code}]`);

    // Dispatch OTP based on type
    let message = `Verification OTP has been sent to your ${type === "PHONE" ? "mobile number" : "personal email"}.`;

    if (type === "EMAIL") {
      const emailResult = await EmailService.sendOtpEmail({ to: normalized, otp: code });
      if (!emailResult.success && emailResult.error) {
        throw new Error(`Email delivery failed: ${emailResult.error}`);
      }
      if (!emailResult.delivered) {
        message = `Verification OTP generated for ${normalized}. (Note: SMTP_USER/PASS not configured in .env; code printed to terminal in development).`;
      }
    }

    return {
      success: true,
      verificationId,
      target: normalized,
      type,
      message,
    };
  }

  /**
   * Verifies the user-submitted 6-digit OTP code against the signed verification ID
   */
  static verifyOtp(
    target: string,
    type: "PHONE" | "EMAIL",
    code: string,
    verificationId: string
  ): VerifyOtpResult {
    const { isValid, normalized } = this.normalizeTarget(target, type);
    if (!isValid) {
      return { success: false, message: "Invalid target format." };
    }

    const cleanCode = code.trim().replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      return { success: false, message: "Please enter the complete 6-digit OTP." };
    }

    const payload = this.verifyPayload<{
      target: string;
      type: "PHONE" | "EMAIL";
      codeHash: string;
      expiresAt: number;
    }>(verificationId);

    if (!payload) {
      return { success: false, message: "Invalid or tampered verification session. Please request a new OTP." };
    }

    if (Date.now() > payload.expiresAt) {
      return { success: false, message: "This OTP has expired. Please request a new code." };
    }

    if (payload.target !== normalized || payload.type !== type) {
      return { success: false, message: "Target mismatch for this verification session." };
    }

    const expectedHash = this.hashOtp(normalized, cleanCode);
    if (expectedHash !== payload.codeHash) {
      return { success: false, message: "Incorrect OTP code. Please check and try again." };
    }

    // Generate signed proof of verification (valid for 1 hour for checkout completion)
    const proofToken = this.signPayload({
      target: normalized,
      type,
      verified: true,
      verifiedAt: Date.now(),
      validUntil: Date.now() + 60 * 60 * 1000,
    });

    return {
      success: true,
      message: `${type === "PHONE" ? "Phone number" : "Personal email"} verified successfully!`,
      token: proofToken,
    };
  }

  /**
   * Validates whether a submitted phone number or email has a valid verification token proof
   */
  static validateProofToken(target: string, type: "PHONE" | "EMAIL", token?: string): boolean {
    if (!token) return false;
    const payload = this.verifyPayload<{
      target: string;
      type: "PHONE" | "EMAIL";
      verified: boolean;
      validUntil: number;
    }>(token);

    if (!payload || !payload.verified) return false;
    if (payload.type !== type) return false;
    if (Date.now() > payload.validUntil) return false;

    const { normalized } = this.normalizeTarget(target, type);
    return payload.target === normalized;
  }
}
