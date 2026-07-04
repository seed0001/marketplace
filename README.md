# Marketplace

**The marketplace for developers.** Buy, sell, and trade dev tools, domains,
side projects, and more — built by developers, for developers.

Marketplace is a full-stack web app where developers can list what they've
built (or no longer need), browse other people's listings, and message each
other directly to close a deal.

## Features

- **Listings** — create, edit, and browse listings with images, price,
  category, and description.
- **Search & filters** — full-text search plus category and price filters,
  and sort by newest or price.
- **Accounts** — email/password authentication via NextAuth.
- **Direct messaging** — buyers and sellers message each other in-app.
- **Profiles** — a public profile page for each seller.

## Tech stack

| Layer      | Choice                                    |
| ---------- | ----------------------------------------- |
| Framework  | [Next.js](https://nextjs.org) (App Router) |
| Language   | TypeScript + React                        |
| Styling    | Tailwind CSS v4                           |
| Auth       | NextAuth (credentials provider)           |
| Database   | PostgreSQL via [Prisma](https://prisma.io) |
| Validation | Zod                                       |
| Hosting    | [Railway](https://railway.app)            |

## Getting started

### Prerequisites

- Node.js 22+
- A PostgreSQL database

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```bash
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/marketplace"

# NextAuth secret — generate one with: openssl rand -base64 32
AUTH_SECRET="your-generated-secret"
```

### 3. Set up the database

```bash
npm run db:push      # sync the Prisma schema to your database
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available scripts

| Script              | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start the development server             |
| `npm run build`     | Generate the Prisma client and build     |
| `npm run start`     | Push the schema and start the prod server |
| `npm run lint`      | Run ESLint                               |
| `npm run db:migrate`| Create and apply a migration (dev)       |
| `npm run db:push`   | Push the schema without a migration      |
| `npm run db:studio` | Open Prisma Studio                       |

## Project structure

```
src/
  app/                 # Next.js App Router pages & API routes
    api/               # Route handlers (auth, listings, messages, search)
    auth/              # Sign in / sign up pages
    listings/          # Browse, detail, create, and edit pages
    messages/          # Conversations and message threads
    profile/           # Seller profile
    layout.tsx         # Root layout (Navbar + Footer + Providers)
    globals.css        # Design system tokens & base styles
  components/          # Shared UI (Navbar, Footer, ListingCard, SearchBar…)
  lib/                 # Prisma client, auth config, helpers
prisma/                # Prisma schema
```

## Design & branding

The visual system lives in `src/app/globals.css` as CSS variables consumed by
Tailwind. Marketplace ships a single, consistent **light theme**:

- **Accent:** emerald (`emerald-600`) for primary actions, links, and prices.
- **Surfaces:** white cards on a warm off-white page background.
- **Type:** Geist sans/mono via `next/font`.

To retheme the site, adjust the tokens under `:root` and `@theme inline` in
`globals.css` and the accent utility classes in the components.

## Deployment

The app is configured for [Railway](https://railway.app) via `railway.json`
and the included `Dockerfile` (Node 22). Set `DATABASE_URL` and `AUTH_SECRET`
in your Railway project's environment variables. The `start` script runs
`prisma db push` before booting, so the schema is synced on each deploy.
