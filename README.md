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
- **GitHub-backed downloads** — sellers attach a GitHub repo to a listing;
  buyers download it as a `.zip` streamed through the app (they're never sent to
  GitHub). See below.

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

# Optional — only needed to serve PRIVATE repos as downloads (see below).
# GITHUB_APP_ID="123456"
# GITHUB_APP_SLUG="your-app-slug"
# GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
# GITHUB_TOKEN="ghp_..."   # fallback token for public/private repos without the App
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
    api/               # Route handlers (auth, listings, orders, github, messages…)
    auth/              # Sign in / sign up pages
    listings/          # Browse, detail, create, and edit pages
    messages/          # Conversations and message threads
    orders/            # Buyer purchases & seller sales (release downloads)
    profile/           # Seller profile, payment methods, GitHub connection
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

## GitHub-backed downloads

A seller can attach a **GitHub repo URL** to a listing. Buyers never see or get
redirected to GitHub — the app fetches the repo server-side and streams it back
as a `.zip` from its own domain (`/api/listings/[id]/download`).

### The order flow (payment happens off-platform)

The marketplace does **not** process payments. Instead:

1. The buyer clicks **Request to purchase**. This records an order
   (`status: "requested"`) and opens a conversation with the seller.
2. Buyer and seller **negotiate in chat** — price, scope, add-ons — and the
   seller shares where to send payment (their Venmo / Cash App / PayPal, set up
   under **Payment methods** on the profile page).
3. Once the seller has actually **received payment**, they click **Release
   download** on the **Orders** page (`status: "released"`).
4. The buyer's **Download .zip** button unlocks. The download route enforces
   this — it only serves the file to the listing owner or a buyer with a
   released order.

### Serving private repos (optional GitHub App)

Public repos work with no configuration. For **private** repos, each seller must
authorize us to read their repo via a **GitHub App** installation:

1. [Register a GitHub App](https://docs.github.com/apps/creating-github-apps)
   with **Repository permissions → Contents: Read-only**, and set its
   **Setup URL** to `https://<your-domain>/api/github/setup`.
2. Put the App's id, slug, and private key in the env vars shown above.
3. A seller connects from their **profile** ("Connect GitHub") and installs the
   app on just the repo(s) they sell.

We store only the **installation id** — never a long-lived secret. When a cleared
buyer downloads, the server mints a short-lived, read-only installation token
on demand (`src/lib/githubApp.ts`) to fetch the zip, then discards it.

## Deployment

The app is configured for [Railway](https://railway.app) via `railway.json`
and the included `Dockerfile` (Node 22). Set `DATABASE_URL` and `AUTH_SECRET`
in your Railway project's environment variables. The `start` script runs
`prisma db push` before booting, so the schema is synced on each deploy.
