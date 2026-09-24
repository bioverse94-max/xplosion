import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";
import { signSession } from "@/lib/security";
import { cookies } from "next/headers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // Rate Limiting: Max 5 failed login attempts per 15 minutes per IP
    const loginAttemptLimit = checkRateLimit(`admin_login_${ip}`, {
      limit: 6,
      windowSeconds: 900,
    });

    if (!loginAttemptLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts. Access temporarily locked for security. Please try again in ${Math.ceil(loginAttemptLimit.resetInSeconds / 60)} minutes.`,
        },
        { status: 429, headers: { "Retry-After": String(loginAttemptLimit.resetInSeconds) } }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await AuthService.authenticateAdmin(email, password);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid admin credentials or account inactive." },
        { status: 401 }
      );
    }

    // Set secure HTTP-only signed session cookie
    const signedToken = await signSession(user);
    const cookieStore = cookies();
    cookieStore.set("admin_session", signedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: "Admin authentication successful.",
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ success: false, error: "Authentication failed." }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete("admin_session");
  return NextResponse.json({ success: true, message: "Logged out." });
}
