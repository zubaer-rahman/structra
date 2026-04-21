<h1 align="center">
  <br />
  <img src="public/images/brand/structra_logo.png" alt="Structra" width="200" />
  <br />
  Structra
  <br />
</h1>

<h4 align="center">A full-stack marketplace connecting homeowners with verified contractors — built for transparency, trust, and speed.</h4>

<p align="center">
  <a href="https://structra-two.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-structra.vercel.app-6366f1?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
  &nbsp;
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" />
  &nbsp;
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  &nbsp;
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white" />
  &nbsp;
  <img src="https://img.shields.io/badge/tRPC-Type--safe%20API-2596BE?style=for-the-badge&logo=trpc&logoColor=white" />
  &nbsp;
  <img src="https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel" />
</p>

---

## What is Structra?

Structra is a **production-grade SaaS marketplace** that bridges the gap between property owners and construction professionals. Homeowners post projects with a one-time publishing fee; verified contractors discover, bid, and win work — all within a secured, role-gated platform.

The platform handles the entire project lifecycle: **authentication → project creation → payment → proposal bidding → contract signing → reviews** — without a single manual handoff.

---

## Key Features

| Area | Capability |
|---|---|
| **Auth** | Role-based signup (Homeowner / Contractor / Admin) with Supabase JWT + auto profile creation |
| **Projects** | Multi-step project creation with file uploads, budget ranges, and draft/publish states |
| **Payments** | Stripe Checkout for $29 project publishing fee; webhook-driven activation |
| **Proposals** | Full proposal lifecycle — submit, compare, accept/reject, with messaging |
| **Contracts** | Digital signature capture with SHA-256 hash verification and audit trail |
| **Reviews** | Bidirectional 5-star review system with photo-use consent flow |
| **Admin** | Contractor document verification queue, featured content management, platform analytics |
| **Security** | Row-Level Security (RLS) on every table, role-gated middleware, encrypted file storage |

---

## Tech Stack

```
Frontend          Next.js 15 (App Router) · React 19 · TypeScript 5
Styling           Tailwind CSS v4 · Radix UI · Framer Motion
API Layer         tRPC v11 · TanStack Query v5
Backend           Supabase (PostgreSQL + Auth + Storage + Realtime)
Payments          Stripe (Checkout Sessions + Webhooks)
PDF Generation    @react-pdf/renderer
Forms             React Hook Form + Zod v4
Deployment        Vercel (Edge + Serverless Functions)
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 15 App                        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  App Router  │  │  tRPC Layer  │  │  Middleware    │  │
│  │  (RSC + CSR) │  │  (Type-safe) │  │  (Auth Guard) │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
│         └─────────────────┴──────────────────┘           │
│                           │                              │
│              ┌────────────▼────────────┐                 │
│              │       Supabase           │                 │
│              │  PostgreSQL + RLS        │                 │
│              │  Auth (JWT)              │                 │
│              │  Storage (S3-compatible) │                 │
│              │  Realtime (WebSockets)   │                 │
│              └─────────────────────────┘                 │
│                                                           │
│              ┌─────────────────────────┐                 │
│              │         Stripe           │                 │
│              │  Checkout Sessions       │                 │
│              │  Webhook Handler         │                 │
│              └─────────────────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

---

## Database Schema (Core Tables)

```
users              → profiles, roles, ratings, verification status
projects           → homeowner projects with status, visibility, slug
proposals          → contractor bids linked to projects
contracts          → generated agreements tied to accepted proposals
signatures         → digital signature data with SHA-256 hash + audit log
reviews            → bidirectional ratings and written feedback
messages           → project-scoped real-time messaging
migrations         → versioned, sequential schema migrations (057 migrations run)
```

All tables are protected by **Supabase Row-Level Security (RLS)** policies — users can only read and write records they own or are permitted to access.

---

## Project Structure

```
structra/
├── app/                     # Next.js 15 App Router (pages + API routes)
│   ├── (auth)/              # Login, signup, role selection
│   ├── (dashboard)/         # Homeowner, Contractor, Admin dashboards
│   └── api/                 # tRPC handler + Stripe webhook endpoint
├── components/
│   ├── features/            # Feature-specific components (landing, proposals…)
│   ├── shared/              # Navbar, UserMenu, LoadingSpinner
│   └── ui/                  # Radix-based design system (Button, Card, Dialog…)
├── server/
│   ├── api/routers/         # tRPC routers: auth, projects, proposals, users…
│   └── database/
│       ├── migrations/      # 057 sequential TypeScript migrations
│       └── schemas/         # Table schema definitions
├── lib/                     # Supabase client, env config, PDF utils
├── hooks/                   # Custom React hooks
├── contexts/                # Auth context, global state
├── types/                   # Shared TypeScript interfaces
└── utils/                   # Zod validators, constants, helpers
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io) (recommended) or npm
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account (test mode is fine)

### 1. Clone & Install

```bash
git clone https://github.com/zubaer-rahman/structra.git
cd structra
pnpm install
```

### 2. Configure Environment

```bash
cp env.example .env.local
```

Fill in your `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Database Migrations

```bash
pnpm db:migrate
```

### 4. Start the Dev Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | TypeScript strict check |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:rollback` | Rollback last migration |
| `pnpm db:status` | View migration status |

---

## Deployment

The app is deployed on **Vercel** with environment variables configured per-environment (dev/prod). Stripe webhooks are registered separately in the Stripe Dashboard for production — see [`docs/WEBHOOK_SETUP.md`](docs/WEBHOOK_SETUP.md) for the full guide.

---

## Documentation

| File | Contents |
|---|---|
| [`docs/WEBHOOK_SETUP.md`](docs/WEBHOOK_SETUP.md) | Stripe webhook configuration (dev + prod) |
| [`docs/SIGNATURE_SYSTEM.md`](docs/SIGNATURE_SYSTEM.md) | Digital signature architecture |
| [`docs/ADMIN_SETUP.md`](docs/ADMIN_SETUP.md) | Creating and managing admin accounts |
| [`docs/OPTION_SETS.md`](docs/OPTION_SETS.md) | Project category and option configuration |

---

## Security Highlights

- **RLS everywhere** — no table is left unprotected; every query is scoped to the authenticated user's role
- **Stripe webhook signature verification** — all incoming events are validated with `stripe.webhooks.constructEvent`
- **Environment variable validation** — `@t3-oss/env-nextjs` enforces type-safe env access at build time
- **SHA-256 signature hashing** — digital signatures are hashed server-side before storage
- **No secrets in client code** — all sensitive operations go through tRPC server procedures

---

## License

MIT © [Zubaer Rahman](https://github.com/zubaer-rahman)
