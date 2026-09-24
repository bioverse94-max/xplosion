// Edge-safe cryptographic session management using standard Web Crypto API (supported natively in Edge & Node.js)

const AUTH_SECRET = process.env.AUTH_SECRET || "dev-secret-admin-session-secret-change-in-production-min-32-chars";

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
 * Cryptographically signs an admin session payload using Web Crypto HMAC-SHA256.
 * Completely free of Node.js modules for seamless Next.js Edge Runtime compatibility.
 */
export async function signSession(payload: any, secret = AUTH_SECRET): Promise<string> {
  const enc = new TextEncoder();
  const rawPayload = JSON.stringify({
    ...payload,
    _signedAt: Date.now(),
  });
  const encodedData = toBase64Url(rawPayload);

  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Web Crypto API is not available in this environment.");
  }

  const key = await subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuffer = await subtle.sign("HMAC", key, enc.encode(encodedData));
  const signature = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${encodedData}.${signature}`;
}

/**
 * Verifies and decodes a signed admin session token using Web Crypto HMAC-SHA256.
 */
export async function verifySession<T = any>(token: string, secret = AUTH_SECRET): Promise<T | null> {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [encodedData, signature] = parts;
    const enc = new TextEncoder();
    const subtle = globalThis.crypto?.subtle;

    if (!subtle) {
      return null;
    }

    const key = await subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = new Uint8Array(
      signature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );

    const isValid = await subtle.verify("HMAC", key, sigBytes, enc.encode(encodedData));
    if (!isValid) return null;

    const jsonStr = fromBase64Url(encodedData);
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}
