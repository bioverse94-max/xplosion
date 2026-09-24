# Deployment & Architecture Guide: Supabase + Render + Vercel

The project has been separated into two self-contained folders for simple deployment:
- **`frontend/`**: Next.js 14 Web Application $\rightarrow$ Deployed to **Vercel**
- **`backend/`**: Node.js / Express API Service $\rightarrow$ Deployed to **Render**
- **Database**: PostgreSQL $\rightarrow$ Hosted on **Supabase**

```
Fresher party website/
├── frontend/                  <-- DEPLOY THIS FOLDER TO VERCEL
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── .env
│   ├── .env.example
│   └── .gitignore
│
├── backend/                   <-- DEPLOY THIS FOLDER TO RENDER
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── render.yaml
│   ├── .env
│   ├── .env.example
│   └── .gitignore
│
├── DEPLOYMENT_GUIDE.md
└── README.md
```

---

## 1. Supabase PostgreSQL Database (Already Configured)

Your Supabase project is active and seeded with the initial admin accounts, event, and ticket tiers.

- **Transaction Connection Pooled (Port 6543)** (`DATABASE_URL`):
  ```
  postgresql://postgres.xtedfmllmjjdwaqvvgvk:Drish%407200.@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
  ```
- **Direct Session Connection (Port 5432)** (`DIRECT_URL`):
  ```
  postgresql://postgres.xtedfmllmjjdwaqvvgvk:Drish%407200.@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
  ```

---

## 2. Deploying Backend to Render

1. Go to **[render.com](https://render.com)** and sign in.
2. Click **New +** > **Web Service**.
3. Select your GitHub repository.
4. Configure the Web Service:
   - **Name**: `freshers-party-backend`
   - **Region**: `Singapore` (or closest region)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   | Key | Value | Note |
   |---|---|---|
   | `NODE_ENV` | `production` | Production environment |
   | `PORT` | `10000` | Render default port |
   | `DATABASE_URL` | `postgresql://...:6543/...` | Supabase pooled URL |
   | `DIRECT_URL` | `postgresql://...:5432/...` | Supabase direct URL |
   | `FRONTEND_URL` | `https://your-app.vercel.app` | Allowed CORS origin |
   | `HMAC_SECRET` | `dev-secret-super-secure-hmac-key-change-in-production-min-32-chars` | Pass signature HMAC key |
   | `AUTH_SECRET` | `dev-secret-admin-session-secret-change-in-production-min-32-chars` | Admin session auth secret |
   | `AUTO_APPROVE_PAYMENTS` | `true` | Automated instant payment verification |
   | `NOTIFICATION_PROVIDER` | `SMTP` | Automated email engine |
   | `SMTP_HOST` | `smtp.gmail.com` | E.g., Gmail / SendGrid / Resend |
   | `SMTP_PORT` | `587` | Standard TLS port |
   | `SMTP_USER` | `your-email@gmail.com` | Your email address |
   | `SMTP_PASS` | `your-16-char-app-password` | Gmail App Password or API Key |
   | `EMAIL_FROM` | `Neon Genesis <tickets@neongenesis2026.com>` | Sender header |
6. Click **Create Web Service**.
7. Once deployed, test the health check:
   `https://freshers-party-backend.onrender.com/health` $\rightarrow$ `{ "status": "healthy" }`.

---

## 3. Deploying Frontend to Vercel

1. Go to **[vercel.com](https://vercel.com)** and sign in.
2. Click **Add New...** > **Project** and select your GitHub repository.
3. Configure the Project:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and select `frontend`
4. Under **Environment Variables**, configure:
   | Key | Value |
   |---|---|
   | `BACKEND_API_URL` | `https://freshers-party-backend.onrender.com` |
   | `NEXT_PUBLIC_API_URL` | `https://freshers-party-backend.onrender.com` |
   | `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` |
   | `DATABASE_URL` | `postgresql://postgres.xtedfmllmjjdwaqvvgvk:Drish%407200.@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
   | `DIRECT_URL` | `postgresql://postgres.xtedfmllmjjdwaqvvgvk:Drish%407200.@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres` |
   | `AUTH_SECRET` | `dev-secret-admin-session-secret-change-in-production-min-32-chars` |
   | `HMAC_SECRET` | `dev-secret-super-secure-hmac-key-change-in-production-min-32-chars` |
   | `AUTO_APPROVE_PAYMENTS` | `true` |
5. Click **Deploy**.

`frontend/next.config.mjs` automatically rewrites all browser `/api/*` calls directly to your Render backend URL, avoiding all CORS issues while keeping frontend and backend decoupled.

---

## 4. Local Development

To run both services locally:

- **Frontend**:
  ```bash
  cd frontend
  npm run dev
  # Runs on http://localhost:3000
  ```

- **Backend**:
  ```bash
  cd backend
  npm run dev
  # Runs on http://localhost:5000
  ```
