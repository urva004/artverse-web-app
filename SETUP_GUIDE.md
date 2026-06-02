# 🎨 ArtVerse — Complete Setup & Run Guide

> **Full-stack Art E-Commerce + Community Platform**
> Backend: Express + Prisma + PostgreSQL + Redis + Socket.io
> Frontend: Next.js 14 + Zustand + Tailwind CSS

---

## 📋 Table of Contents

1. [Prerequisites](#1--prerequisites)
2. [Clone & Install](#2--clone--install)
3. [Database Setup (Neon PostgreSQL)](#3--database-setup-neon-postgresql)
4. [Redis Setup (Upstash — Optional)](#4--redis-setup-upstash--optional)
5. [Environment Configuration](#5--environment-configuration)
6. [Prisma — Generate Client & Push Schema](#6--prisma--generate-client--push-schema)
7. [Seed the Database (Test Data)](#7--seed-the-database-test-data)
8. [Run the Project](#8--run-the-project)
9. [Verify Everything Works](#9--verify-everything-works)
10. [Test Accounts](#10--test-accounts)
11. [Common Errors & Fixes](#11--common-errors--fixes)
12. [Project Architecture](#12--project-architecture)

---

## 1. 🔧 Prerequisites

Make sure you have the following installed:

| Tool       | Version  | Check Command        |
|------------|----------|----------------------|
| **Node.js**| ≥ 18.x   | `node -v`            |
| **npm**    | ≥ 9.x    | `npm -v`             |
| **Git**    | Any      | `git --version`      |

> [!NOTE]
> No need to install PostgreSQL or Redis locally — we use **Neon** (cloud Postgres) and **Upstash** (cloud Redis). Redis is **optional**; the app runs fine without it (caching is disabled).

---

## 2. 📦 Clone & Install

```bash
# Step 1: Navigate to the project directory
cd "c:\Users\BAPS\artverse web app"

# Step 2: Install all dependencies (root + all workspaces)
npm install
```

This installs dependencies for all workspace packages:
- `apps/backend` — Express API server
- `apps/frontend` — Next.js frontend
- `packages/utils` — Shared types, schemas, utilities
- `packages/ui` — Shared UI components
- `packages/config` — Shared ESLint/TS config

---

## 3. 🐘 Database Setup (Neon PostgreSQL)

ArtVerse uses **Neon Serverless PostgreSQL** as its database.

### Option A: Use the Existing Neon Database

Your `.env.local` already has a `DATABASE_URL` configured. However, Neon **auto-suspends** free-tier databases after ~5 minutes of inactivity.

**If the database is suspended:**

1. Go to **[https://console.neon.tech](https://console.neon.tech)**
2. Log in to your account
3. Find your project (look for `ep-withered-water-a19jcl5s`)
4. If it shows "Suspended", click **"Resume"** or simply run a query — it auto-wakes
5. Wait ~5-10 seconds for the database to become active

### Option B: Create a New Neon Database

1. Go to [https://neon.tech](https://neon.tech) → Sign up (free tier)
2. Click **"New Project"**
3. Choose a region close to you (e.g., `ap-southeast-1` for India)
4. Copy the **connection string** from the dashboard
5. Paste it into `.env.local` as `DATABASE_URL`

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
```

### Option C: Use Local PostgreSQL

If you have PostgreSQL installed locally:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/artverse?schema=public"
```

---

## 4. 🔴 Redis Setup (Upstash — Optional)

> [!TIP]
> Redis is **100% optional** for development. The app gracefully falls back to running without cache. You'll just see warning messages in the console — everything still works.

### If You Want Redis:

1. Go to [https://upstash.com](https://upstash.com) → Sign up (free tier)
2. Create a new **Redis Database**
3. Copy the **connection URL** (starts with `rediss://`)
4. Paste it into `.env.local`:

```env
REDIS_URL="rediss://default:YOUR_PASSWORD@your-redis.upstash.io:6379"
```

> [!WARNING]
> The `REDIS_URL` must start with `rediss://` (with double 's' for TLS). Do NOT use `redis-cli` commands as the URL — it must be a proper connection string.

### Current Issue with Your Redis:

Your `.env.local` has a `redis-cli` command as the URL instead of a connection string. To fix:
- Either set it to a valid `rediss://...` URL from Upstash
- Or leave it empty/invalid — the app will skip Redis gracefully

---

## 5. ⚙️ Environment Configuration

The project uses **two** env files:

| File                         | Used By              | Purpose                    |
|------------------------------|----------------------|----------------------------|
| `/.env.local`                | Backend (Express)    | Server, DB, JWT, APIs      |
| `/apps/frontend/.env.local`  | Frontend (Next.js)   | Public API URL, Razorpay   |

### Required Variables in `/.env.local`:

```env
# ── REQUIRED ──────────────────────────────
PORT=4000
NODE_ENV=development
API_VERSION=v1
CORS_ORIGIN=http://localhost:3000

DATABASE_URL="postgresql://..."     # ← Your Neon/local PostgreSQL URL

JWT_SECRET="your-random-64-char-hex"
JWT_REFRESH_SECRET="another-random-64-char-hex"
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_SALT_ROUNDS=12

# ── OPTIONAL (but recommended) ───────────
REDIS_URL="rediss://..."            # ← Upstash Redis URL (optional)

CLOUDINARY_CLOUD_NAME=...           # ← For image uploads
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

RAZORPAY_KEY_ID=...                 # ← For payments
RAZORPAY_KEY_SECRET=...

# ── Frontend vars (also in root) ─────────
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

### Required Variables in `/apps/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_RAZORPAY_KEY_ID=        # ← Optional
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

### Generate JWT Secrets (if needed):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run it twice — once for `JWT_SECRET`, once for `JWT_REFRESH_SECRET`.

---

## 6. 🔷 Prisma — Generate Client & Push Schema

```bash
# Step 1: Generate the Prisma Client (creates typed DB client)
npx prisma generate --schema=./prisma/schema.prisma

# Step 2: Push the schema to your database (creates/updates tables)
npx prisma db push --schema=./prisma/schema.prisma
```

**Expected output for Step 2:**
```
🚀 Your database is now in sync with your Prisma schema.
```

> [!IMPORTANT]
> You must run `prisma generate` every time you change the schema. Run `prisma db push` to sync changes to the database.

### Verify Tables Were Created:

```bash
npx prisma studio --schema=./prisma/schema.prisma
```

This opens a visual database browser at `http://localhost:5555`.

---

## 7. 🌱 Seed the Database (Test Data)

Populate the database with sample users, products, orders, and reviews:

```bash
npx ts-node prisma/seed.ts
```

**Expected output:**
```
🌱 Seeding ArtVerse database...
✅ Cleared existing data
✅ Created users
✅ Created products
✅ Created orders
...
🎉 Seeding complete!
```

> [!NOTE]
> Seeding is optional but highly recommended — it creates test accounts, sample art products, and demo data so you can immediately explore the platform.

---

## 8. 🚀 Run the Project

### Option A: Run Everything at Once (Recommended)

From the project root:

```bash
npm run dev
```

This uses **Turborepo** to start both apps in parallel:
- **Backend** → `http://localhost:4000`
- **Frontend** → `http://localhost:3000`

### Option B: Run Backend and Frontend Separately

**Terminal 1 — Backend:**
```bash
cd apps/backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd apps/frontend
npm run dev
```

### ✅ Success Indicators

**Backend (Terminal output):**
```
☁️  Cloudinary configured
✅ PostgreSQL connected
⚡ Socket.io initialized
🚀 ArtVerse API running on http://localhost:4000/api/v1
📊 Environment: development
```

**Frontend (Terminal output):**
```
▲ Next.js 14.2.35
- Local: http://localhost:3000
✓ Ready in 5.2s
```

---

## 9. ✅ Verify Everything Works

### Quick Health Checks:

| Check                        | URL / Action                                   | Expected                    |
|------------------------------|------------------------------------------------|-----------------------------|
| Frontend loads               | Open `http://localhost:3000`                    | ArtVerse homepage           |
| Backend API responds         | Open `http://localhost:4000/api/v1/products`    | JSON with products          |
| Database connected           | Check backend terminal                         | `✅ PostgreSQL connected`   |
| Socket.io working            | Check backend terminal                         | `⚡ Socket.io initialized`  |

### Test Login:
1. Go to `http://localhost:3000/auth/login`
2. Use: `rahul@artverse.com` / `Password@123`
3. You should be redirected to the homepage as a logged-in user

---

## 10. 👤 Test Accounts

| Role     | Email                 | Password       | Description           |
|----------|-----------------------|----------------|-----------------------|
| **Admin**| admin@artverse.com    | Password@123   | Full platform access  |
| **Seller** | priya@artverse.com  | Password@123   | Can list/sell art     |
| **Seller** | arjun@artverse.com  | Password@123   | Can list/sell art     |
| **Seller** | fatima@artverse.com | Password@123   | Can list/sell art     |
| **Buyer**  | rahul@artverse.com  | Password@123   | Can browse/buy art    |
| **Buyer**  | sneha@artverse.com  | Password@123   | Can browse/buy art    |

> [!NOTE]
> These accounts are created by the seed script (Step 7). If you skipped seeding, you can register a new account via the signup page.

---

## 11. 🛠️ Common Errors & Fixes

### ❌ `Can't reach database server`

**Cause:** Neon database is suspended or unreachable.

**Fix:**
1. Go to [console.neon.tech](https://console.neon.tech)
2. Resume your project if suspended
3. Check your `DATABASE_URL` in `.env.local`
4. Try again after 10 seconds

---

### ❌ `EADDRINUSE: address already in use :::3000`

**Cause:** A previous process is still occupying port 3000 (or 4000).

**Fix (Windows):**
```bash
# Find what's using the port
netstat -aon | findstr :3000 | findstr LISTENING

# Kill the process (replace PID with the actual number)
taskkill /F /PID <PID>
```

---

### ❌ `Redis connection error` (Warning)

**Cause:** Redis URL is missing, invalid, or Upstash is unreachable.

**Fix:** This is **not critical** — the app works without Redis. If you want Redis:
- Check your `REDIS_URL` in `.env.local`
- Make sure it starts with `rediss://` (not `redis-cli`)

---

### ❌ `MODULE_NOT_FOUND` errors on startup

**Cause:** Dependencies not installed or Prisma client not generated.

**Fix:**
```bash
npm install
npx prisma generate --schema=./prisma/schema.prisma
```

---

### ❌ `P1017: Server has closed the connection`

**Cause:** Database connection dropped (timeout, suspended).

**Fix:**
1. Wake the Neon database (visit console.neon.tech)
2. Remove `&channel_binding=require` from `DATABASE_URL` if present
3. Retry the command

---

### ❌ `Prisma schema out of sync`

**Cause:** Schema was changed but not pushed to the database.

**Fix:**
```bash
npx prisma db push --schema=./prisma/schema.prisma
npx prisma generate --schema=./prisma/schema.prisma
```

---

## 12. 🏗️ Project Architecture

```
artverse web app/
├── apps/
│   ├── backend/          ← Express API (Port 4000)
│   │   └── src/
│   │       ├── config/       — DB, Redis, Socket, Cloudinary
│   │       ├── controllers/  — Request handlers
│   │       ├── middleware/    — Auth, errors, rate limiting
│   │       ├── routes/       — API route definitions
│   │       ├── services/     — Business logic
│   │       └── index.ts      — Server entry point
│   │
│   └── frontend/         ← Next.js App (Port 3000)
│       └── src/
│           ├── app/          — Pages (App Router)
│           ├── components/   — UI components
│           ├── lib/          — API client, utilities
│           ├── providers/    — React context providers
│           └── store/        — Zustand state stores
│
├── packages/
│   ├── utils/            ← Shared types, Zod schemas, helpers
│   ├── ui/               ← Shared UI component library
│   └── config/           ← Shared ESLint/TS config
│
├── prisma/
│   ├── schema.prisma     ← Database schema
│   └── seed.ts           ← Test data seeder
│
├── .env.local            ← Backend environment variables
├── package.json          ← Root workspace config
└── turbo.json            ← Turborepo pipeline config
```

### Key API Endpoints:

| Method   | Endpoint                          | Description              |
|----------|-----------------------------------|--------------------------|
| `POST`   | `/api/v1/auth/register`           | Register new user        |
| `POST`   | `/api/v1/auth/login`              | Login                    |
| `GET`    | `/api/v1/products`                | List all products        |
| `GET`    | `/api/v1/products/:id`            | Get single product       |
| `POST`   | `/api/v1/products`                | Create product (Seller)  |
| `GET`    | `/api/v1/cart`                    | Get user cart            |
| `POST`   | `/api/v1/cart/items`              | Add to cart              |
| `PATCH`  | `/api/v1/cart/items/:id/save`     | Save for later toggle    |
| `POST`   | `/api/v1/cart/sync`               | Sync guest cart          |
| `POST`   | `/api/v1/orders`                  | Create order             |
| `POST`   | `/api/v1/reviews/:productId`      | Submit review            |

---

## 🎯 Quick Start (TL;DR)

```bash
# 1. Install
npm install

# 2. Generate Prisma
npx prisma generate --schema=./prisma/schema.prisma

# 3. Push schema to DB (first time only)
npx prisma db push --schema=./prisma/schema.prisma

# 4. Seed test data (optional but recommended)
npx ts-node prisma/seed.ts

# 5. Run!
npm run dev
```

Then open **http://localhost:3000** 🎨
