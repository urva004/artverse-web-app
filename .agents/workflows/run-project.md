---
description: How to run the ArtVerse project locally
---

# Running ArtVerse Locally

## Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- PostgreSQL database (Neon / Supabase / local)
- Redis instance (Upstash / local)

## Steps

### 1. Install dependencies
// turbo
```bash
npm install
```

### 2. Generate Prisma client
// turbo
```bash
npx prisma generate --schema=./prisma/schema.prisma
```

### 3. Start the Backend (Terminal 1)
```bash
cd apps/backend
npm run dev
```
Backend runs at: **http://localhost:4000**

### 4. Start the Frontend (Terminal 2)
```bash
cd apps/frontend
npm run dev
```
Frontend runs at: **http://localhost:3000**

### Alternative: Run both at once from root
```bash
npm run dev
```

## Test Accounts

| Role   | Email               | Password     |
|--------|---------------------|--------------|
| Admin  | admin@artverse.com  | Password@123 |
| Seller | priya@artverse.com  | Password@123 |
| Seller | arjun@artverse.com  | Password@123 |
| Seller | fatima@artverse.com | Password@123 |
| Buyer  | rahul@artverse.com  | Password@123 |
| Buyer  | sneha@artverse.com  | Password@123 |

## Notes
- Backend reads env from `../../.env.local` (relative to `apps/backend/`)
- Frontend reads env from its own `apps/frontend/.env.local`
- Make sure `DATABASE_URL` and `REDIS_URL` are properly configured in `.env.local`
