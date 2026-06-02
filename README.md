# 🎨 ArtVerse — Art E-Commerce + Community Platform

A modern, mobile-first web application that combines marketplace, portfolio, social, and community features for the art world.

## Tech Stack

| Layer    | Technology                                                                 |
| -------- | -------------------------------------------------------------------------- |
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS, ShadCN UI, Framer Motion |
| Backend  | Node.js, Express, TypeScript, Socket.io                                    |
| Database | PostgreSQL (Prisma ORM), Redis (caching)                                   |
| Auth     | JWT (access + refresh tokens), bcrypt                                      |
| Payments | Razorpay (India) / Stripe (International)                                  |
| Uploads  | Multer → Cloudinary                                                        |
| Monorepo | Turborepo                                                                  |

## Project Structure

```
artverse/
├── apps/
│   ├── frontend/          # Next.js 14 app
│   └── backend/           # Express API
├── packages/
│   ├── config/            # Shared ESLint, Tailwind, TSConfig
│   ├── ui/                # Shared ShadCN components
│   └── utils/             # Shared types, validators, helpers
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed script
├── turbo.json
├── package.json
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL database (or [Neon](https://neon.tech) / [Supabase](https://supabase.com))
- Redis instance
- Cloudinary account
- Razorpay account (for payments)

### Installation

```bash
# 1. Clone and install
git clone https://github.com/your-username/artverse.git
cd artverse
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Set up database
cd ..\..
npx prisma generate

taskkill /f /im node.exe & npx prisma generate --schema=./prisma/schema.prisma





npx prisma generate --schema=./prisma/schema.prisma
npx prisma migrate dev --schema=./prisma/schema.prisma

npm run db:seed

npm run dev
# 4. Seed databasecd


# 5. Start development

```

The frontend runs on `http://localhost:3000` and the backend on `http://localhost:4000`.

### Test Accounts

| Role   | Email               | Password     |
| ------ | ------------------- | ------------ |
| Admin  | admin@artverse.com  | Password@123 |
| Seller | priya@artverse.com  | Password@123 |
| Seller | arjun@artverse.com  | Password@123 |
| Seller | fatima@artverse.com | Password@123 |
| Buyer  | rahul@artverse.com  | Password@123 |
| Buyer  | sneha@artverse.com  | Password@123 |

## Environment Variables

See [`.env.example`](.env.example) for all required variables. Key ones:

| Variable              | Required | Description                                |
| --------------------- | -------- | ------------------------------------------ |
| `DATABASE_URL`        | ✅       | PostgreSQL connection string               |
| `REDIS_URL`           | ✅       | Redis connection string                    |
| `JWT_SECRET`          | ✅       | Access token signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET`  | ✅       | Refresh token signing secret               |
| `CLOUDINARY_*`        | ✅       | Image upload credentials                   |
| `RAZORPAY_*`          | ✅       | Payment gateway keys                       |
| `NEXT_PUBLIC_API_URL` | ✅       | Backend API URL for frontend               |

## API Endpoints

### Auth (`/api/v1/auth`)

- `POST /register` — Register with email + password
- `POST /login` — Returns JWT access + refresh tokens
- `POST /logout` — Blacklist refresh token
- `POST /refresh` — Rotate access token
- `GET /me` — Current user profile

### Products (`/api/v1/products`)

- `GET /` — List with filters (category, price, rating, sort)
- `GET /trending` — Top by views
- `GET /search?q=` — Full-text search
- `GET /:id` — Product detail + reviews
- `POST /` — Create (Seller only, multipart)
- `PUT /:id` — Update (owner only)
- `DELETE /:id` — Delete (owner/admin)

### Orders (`/api/v1/orders`)

- `POST /` — Create order + Razorpay
- `POST /verify` — Verify payment
- `GET /my` — Buyer's order history
- `GET /:id` — Order detail

## Scripts

| Command               | Description                   |
| --------------------- | ----------------------------- |
| `npm run dev`         | Start all apps in development |
| `npm run build`       | Build all apps                |
| `npm run lint`        | Lint all packages             |
| `npm run db:generate` | Generate Prisma client        |
| `npm run db:migrate`  | Run database migrations       |
| `npm run db:seed`     | Seed database with test data  |
| `npm run db:studio`   | Open Prisma Studio            |

## License

MIT
