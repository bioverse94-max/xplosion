# XPLOSION 2K26 — Collegiate Ticketing & Event Gate Control System

> **Event:** Saturday 26.09.26 • 12 PM Onwards  
> **Venue:** Reborn Club & Kitchen, Outer Ring Road, Bhubaneswar  
> **Core Architecture:** Next.js 14 App Router • Tailwind CSS • Prisma ORM • Supabase PostgreSQL • WebCrypto HMAC-SHA256 Door Gate Security

---

## 🌟 Key Highlights & Security Architecture

1. **Dual OTP Identity Verification**:
   - Strict Indian 10-digit mobile verification (`/^[6-9]\d{9}$/`).
   - Personal email verification for ticket delivery and official payment invoices.
   - Zero-autofill and zero-leakage security: codes are transmitted strictly via SMS / SMTP.
2. **Atomic Inventory Locks**:
   - 10-minute reservation hold window prevents overbooking during peak checkout bursts.
3. **Manual Bank UTR & Gate Desk Approval Workflow**:
   - Attendees submit their 12-digit UPI Transaction ID / UTR.
   - **Zero Pass Generation Before Verification**: Entry passes are cryptographically minted *only after* the desk admin validates the transaction against the venue POS / bank receipt.
4. **Door Gate Check-In & Scanner Console**:
   - Live optical camera scanner with back-camera priority (`html5-qrcode`).
   - Supports multi-identifier lookup (Pass Code, Registration ID, Phone, Personal Email).
   - Visual audio indicators:
     - 🟢 **VALID**: Displays verified attendee dossier & logs entry timestamp.
     - 🟡 **ALREADY_CHECKED_IN**: Blocks duplicate entry attempts with HTTP 409 Conflict.
     - 🔴 **INVALID**: Rejects forged or tampered HMAC tokens with HTTP 400.
5. **Cybersecurity Hardened**:
   - In-memory sliding-window rate limiting (`src/lib/rate-limit.ts`) guarding OTP endpoints, admin logins, and UTR submissions.
   - Comprehensive HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
   - Fingerprint removal (`poweredByHeader: false`).
6. **Sub-20ms Ultra-Low Latency**:
   - 20-second sliding in-memory query cache reducing public tier API latency from 1,827ms to **16ms** (99% reduction).
   - Long-term immutable caching (`max-age=31536000, immutable`) for cinematic scroll frames.

---

## 📁 Repository Structure

```
.
├── src/ / frontend/src/        # Next.js 14 Full-Stack Source
│   ├── app/                    # App Router pages and API routes
│   │   ├── admin/              # Admin login, analytics, check-in, registrations
│   │   ├── api/                # REST endpoints (auth, checkout, passes, admin)
│   │   ├── my-pass/            # Attendee digital pass lookup portal
│   │   ├── register/           # 3-step registration & OTP checkout
│   │   └── tickets/            # Tier overview & benefits
│   ├── components/             # Reusable UI components & canvas visual engines
│   ├── lib/                    # Security, rate limiter, session, DB client
│   └── services/               # Business logic (event, pass, checkin, otp, email)
├── prisma/                     # Database schema & seed scripts
├── public/                     # Static assets & 130-frame sequence
├── AUDIT_REPORT.md             # Authoritative Cybersecurity & Operational Audit Record
├── DEPLOYMENT_GUIDE.md         # Full deployment guide (Supabase, Render, Vercel)
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
Copy `.env.example` to `.env` and configure your database and email credentials:

```env
DATABASE_URL="postgresql://postgres.xtedfmllmjjdwaqvvgvk:Drish%407200.@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xtedfmllmjjdwaqvvgvk:Drish%407200.@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

# Automated Email Configuration (Optional for development; required for live email)
NOTIFICATION_PROVIDER="SMTP"
EMAIL_FROM="XPLOSION 2K26 <your-email@gmail.com>"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-char-app-password"
```

### 3. Run Prisma Migrations & Seed
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔐 Administrative & Gate Desk Credentials

| Role | Email Address | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Desk In-Charge / Gate Staff** | `staff@freshersparty.internal` | `StaffPassword@2026!` | Live Camera QR Scanner, Manual Attendee Search, Bank UTR Verification & Approval |
| **Super Admin** | `admin@freshersparty.internal` | `AdminPassword@2026!` | Full Dashboard, Analytics, Tier Management, Payment Refunds, Audit Logs |

---

## 🧪 Testing & Verification

Run the full end-to-end integration test suite simulating all 3 perspectives (Attendee, Gate Desk Staff, and Post-Approval Portal):

```bash
node scratch/test_complete_perspectives.js
```

To run the cybersecurity penetration and low-latency benchmark:

```bash
node scratch/benchmark_security_latency.js
```

---

## 📚 Related Documentation

- **[AUDIT_REPORT.md](./AUDIT_REPORT.md)**: Full Cybersecurity Audit, Benchmark Logs, and Bug Fix Record.
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**: Production Deployment instructions for Supabase, Render, and Vercel.
