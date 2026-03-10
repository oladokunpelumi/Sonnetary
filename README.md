<div align="center">
<img width="1200" height="475" alt="Sonnetary Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Sonnetary

**Custom songs, crafted for your story.**

Sonnetary is a full-stack web platform where customers commission personalised songs — filling out a brief about the recipient, occasion, and mood, paying securely via Paystack, and receiving a professionally produced track within 3 days.

</div>

---

## Features

- **Song brief wizard** — multi-step form capturing recipient details, genre, voice preference, and personal story
- **Paystack payments** — secure NGN checkout with webhook-verified order creation
- **Order tracking** — customers track their order status via email or order ID
- **AI production brief** — Gemini AI generates a structured production brief for the music team from the customer's inputs
- **Admin dashboard** — protected dashboard for the team to view orders, update status, and trigger completion emails
- **Transactional emails** — confirmation, magic link, and completion emails via Resend
- **Magic link auth** — passwordless sign-in for customers to view their orders

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express 5 |
| Database | SQLite (better-sqlite3) · Postgres-ready via `DATABASE_URL` |
| Payments | Paystack |
| Email | Resend |
| AI | Google Gemini |
| Deployment | Railway |

---

## Local Development

**Prerequisites:** Node.js 18+

**1. Clone and install**
```bash
git clone https://github.com/oladokunpelumi/Sonnetary.git
cd Sonnetary
npm install
```

**2. Configure environment variables**
```bash
cp .env.example .env.local
```
Fill in the values in `.env.local` — at minimum you need `PAYSTACK_SECRET_KEY` and `VITE_PAYSTACK_PUBLIC_KEY` to test the payment flow.

**3. Run the app**
```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Admin dashboard: http://localhost:3000/#/admin

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PAYSTACK_SECRET_KEY` | Always | Paystack secret key (sk_test_... or sk_live_...) |
| `VITE_PAYSTACK_PUBLIC_KEY` | Always | Paystack public key for frontend checkout |
| `PAYSTACK_WEBHOOK_SECRET` | Production | Webhook signing secret from Paystack dashboard |
| `JWT_SECRET` | Production | Long random string for signing auth tokens |
| `ADMIN_USERNAME` | Production | Admin dashboard username |
| `ADMIN_PASSWORD` | Production | Admin dashboard password |
| `ADMIN_EMAIL` | Optional | Email address granted admin role via magic link |
| `RESEND_API_KEY` | Optional | Resend API key for transactional emails |
| `FROM_EMAIL` | Optional | Sender address e.g. `Sonnetary <noreply@yourdomain.com>` |
| `GEMINI_API_KEY` | Optional | Google Gemini key for AI production brief generation |
| `CLIENT_URL` | Production | Full URL of the deployed frontend e.g. `https://sonnetary.up.railway.app` |
| `DB_PATH` | Optional | Custom SQLite file path (use with Railway volume) |

---

## Deployment (Railway)

This app is configured for one-click Railway deployment.

**1.** Create a new project on [railway.app](https://railway.app) → Deploy from GitHub → select this repo

**2.** Set the environment variables listed above in the Railway dashboard (Variables tab)

**3.** Add a persistent volume for the SQLite database
   - Railway dashboard → your service → Volumes → Add Volume
   - Mount path: `/app/server`
   - Set env var: `DB_PATH=/app/server/sonnetary.db`

**4.** Update Paystack settings with your Railway domain
   - Callback URL: `https://<your-domain>.up.railway.app/#/payment-success`
   - Webhook URL: `https://<your-domain>.up.railway.app/api/paystack/webhook`

Railway auto-detects Node.js, runs `npm run build` to compile the frontend, then starts the Express server which serves both the API and the compiled SPA.

> **Postgres:** Set `DATABASE_URL` to automatically switch from SQLite to Postgres — no code changes needed.

---

## Project Structure

```
sonnetary/
├── pages/              # React page components
│   ├── Home.tsx
│   ├── CreateSong.tsx  # Multi-step song brief wizard
│   ├── PaymentSuccess.tsx
│   ├── OrderStatus.tsx
│   └── Admin.tsx
├── components/         # Shared UI components
├── contexts/           # React context providers
├── server/
│   ├── server.cjs      # Express app entry point
│   ├── db.cjs          # SQLite/Postgres adapter
│   ├── email.cjs       # Transactional email templates
│   └── routes/
│       ├── paystack.cjs  # Payment init, verify, webhook
│       ├── orders.cjs    # Order creation and retrieval
│       ├── admin.cjs     # Admin dashboard API
│       ├── auth.cjs      # Magic link auth
│       └── songs.cjs     # Song library
├── railway.json        # Railway deployment config
└── .env.example        # Environment variable template
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/paystack/initialize` | Create a Paystack checkout session |
| `GET` | `/api/paystack/verify/:ref` | Verify a transaction by reference |
| `POST` | `/api/paystack/webhook` | Paystack webhook (order creation) |
| `POST` | `/api/orders` | Create an order (client-side fallback) |
| `GET` | `/api/orders/:id` | Get order by ID |
| `POST` | `/api/auth/request` | Request a magic link |
| `GET` | `/api/auth/verify` | Exchange magic link token for JWT |
| `GET` | `/api/admin/orders` | List all orders (admin) |
| `PATCH` | `/api/admin/orders/:id/status` | Update order status (admin) |
| `GET` | `/api/health` | Health check |

---

<div align="center">
  <p>Built with care · Sonnetary © 2026</p>
</div>
