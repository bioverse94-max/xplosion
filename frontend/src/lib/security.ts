import crypto from "crypto";
import { APP_CONFIG } from "./config";

function toBase64Url(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf-8").toString("base64url");
  }
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(base64url: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(base64url, "base64url").toString("utf-8");
  }
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return decodeURIComponent(escape(atob(base64)));
}

/**
 * Generates an opaque, cryptographically tamper-proof token for QR codes.
 * Unified compact format: v1.<encodedPayload>.<hmacSignature>
 */
export function generateQrToken(passId: string, eventId: string): string {
  const timestamp = Date.now().toString();
  const payload = `${passId}:${eventId}:${timestamp}`;
  const hmac = crypto.createHmac("sha256", APP_CONFIG.hmacSecret);
  hmac.update(payload);
  const signature = hmac.digest("hex");
  const encodedPayload = Buffer.from(payload, "utf-8").toString("base64url");
  return `v1.${encodedPayload}.${signature}`;
}

export const generateQrVerificationToken = generateQrToken;

/**
 * Validates whether an incoming QR token has a valid signature.
 * Supports both unified 3-part and legacy 4-part token formats.
 */
export function verifyQrToken(token: string, eventId: string): { isValid: boolean; passId?: string } {
  try {
    if (!token || !token.startsWith("v1.")) {
      return { isValid: false };
    }

    const parts = token.split(".");

    // Unified 3-part format: v1.<encodedPayload>.<signature>
    if (parts.length === 3) {
      const [, encodedPayload, providedSignature] = parts;
      const payload = Buffer.from(encodedPayload, "base64url").toString("utf-8");
      const [passId, tokenEventId] = payload.split(":");

      if (tokenEventId !== eventId) {
        return { isValid: false };
      }

      const hmac = crypto.createHmac("sha256", APP_CONFIG.hmacSecret);
      hmac.update(payload);
      const expectedSignature = hmac.digest("hex");

      let matches = false;
      if (providedSignature.length === expectedSignature.length) {
        matches = crypto.timingSafeEqual(
          Buffer.from(providedSignature, "utf-8"),
          Buffer.from(expectedSignature, "utf-8")
        );
      } else if (providedSignature.length === 32) {
        matches = crypto.timingSafeEqual(
          Buffer.from(providedSignature, "utf-8"),
          Buffer.from(expectedSignature.slice(0, 32), "utf-8")
        );
      }

      return { isValid: matches, passId: matches ? passId : undefined };
    }

    // Legacy 4-part format: v1.<passId>.<timestamp>.<signature>
    if (parts.length === 4) {
      const [, passId, timestamp, receivedSignature] = parts;
      const payload = `${passId}:${eventId}:${timestamp}`;
      const expectedSignature = crypto
        .createHmac("sha256", APP_CONFIG.hmacSecret)
        .update(payload)
        .digest("hex");

      if (receivedSignature.length !== expectedSignature.length) {
        return { isValid: false };
      }

      const isValid = crypto.timingSafeEqual(
        Buffer.from(receivedSignature, "utf-8"),
        Buffer.from(expectedSignature, "utf-8")
      );

      return { isValid, passId: isValid ? passId : undefined };
    }

    return { isValid: false };
  } catch {
    return { isValid: false };
  }
}

/**
 * Generates a standard HMAC signature for payment webhook verification.
 */
export function verifyPaymentWebhookSignature(
  rawBody: string,
  signature: string,
  secret = APP_CONFIG.paymentWebhookSecret
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (signature.length !== expectedSignature.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(signature, "utf-8"),
      Buffer.from(expectedSignature, "utf-8")
    );
  } catch {
    return false;
  }
}

export { signSession, verifySession } from "./session";

