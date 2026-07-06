# Handoff Log

A running log of who's working on what and what's next. When we sync up, point
your agent at this file first.

---

## 2026-07-06 (later) — Handing back to Brandon

**Status:** Handing back over to **Brandon**.

**Next task (planned below, not started):** Seller phone numbers for SMS
updates — see "Next up: seller phone number + SMS updates" at the end of this
entry.

### What we did this session

- **Picked up Brandon's `TRAVIS_RAILWAY_INSTRUCTIONS.md`** and completed the
  two repo-side items (PR #12, merged):
  - Owner identity is now env-driven: `OWNER_EMAIL` env var, defaulting to
    Brandon's account (`bbrumbaugh13@gmail.com`) — no more hardcoded owner in
    `src/lib/auth.ts`.
  - `.github/workflows/deploy.yml` now triggers on `master` (was `main`, so it
    had never run).

- **SMS without Twilio (feature).** SMS now rides on the email provider
  (Resend) via carrier **email-to-SMS gateways** — emailing
  `<10-digit-number>@<gateway>` (e.g. `vtext.com`) delivers as a text. No
  second provider account.
  - `src/lib/email.ts` gained a shared `sendProviderEmail()`; `src/lib/sms.ts`
    sends through the user's stored gateway domain. `isSmsConfigured()` ===
    email configured.
  - **Configurable carrier catalog**: new `SmsGateway` table managed at
    `/staff/sms-gateways` (add/enable/disable/remove/restore defaults), with a
    built-in default list as fallback when the table is empty.
  - Users pick a carrier on their profile **or choose "Other" and type any
    gateway domain** — odd/regional carriers work without a code change. The
    gateway domain is stored per user in `User.phoneCarrier`.

- **Abuse containment (feature).** Defense against a leaked/abused API key
  mass-publishing bad listings:
  - **Cooldown: max 3 new listings per rolling 5 minutes, all roles**, on both
    creation paths (`/api/listings` and `/api/v1/listings`); over-limit → 429 +
    `Retry-After`. Quota counts an append-only `ListingCreationEvent` ledger
    (deleting listings doesn't refund quota) and the check+create runs behind a
    per-user Postgres advisory lock (parallel scripted requests can't race past
    the cap).
  - **Admin "Danger" tools on `/staff/roster`**: *Purge catalog* (delete every
    listing + revoke all API keys, one transaction) and *Delete account* (full
    cascade delete; pre-checks the moderation-audit `Restrict` constraint;
    requires typing the member's email). Guards: never the owner, yourself, or
    an ADMIN. Both audited + Discord alerts.

- **Railway/env status (Travis's side, in progress):** `AUTH_SECRET`,
  `AUTH_URL`, `DATABASE_URL` are set in Railway. Still pending:
  `RESEND_API_KEY` + `EMAIL_FROM` (Travis has the key; goes in Railway service
  Variables, **not** the repo), Resend **domain verification** for
  `vibemarket.biz` (DNS records at the domain provider), and OpenRouter vars.
  Once the Resend vars land, **both email and SMS alerts turn on** — SMS needs
  no extra config. Twilio vars are no longer needed at all.

### Next up: seller phone number + SMS updates (plan for Brandon)

Goal: sellers can provide a phone number to get SMS updates; later, more SMS
features (reminders, etc.).

**What already exists — don't rebuild:** `User.phoneNumber`,
`User.phoneCarrier` (gateway domain), `User.phoneNotificationsEnabled`,
`User.phoneVerifiedAt` (in schema but **never set** — verification was never
built), the profile "Contact and notifications" form
(`ProfileContactSettings`), send plumbing (`lib/sms.ts` over Resend), and
delivery logging for staff broadcasts (`SiteNotificationDelivery`).

**Plan:**

1. **Surface it for sellers.** The phone form lives only on the profile page
   today. Add a "Get SMS updates" prompt where sellers actually work: Seller
   Studio sidebar (and/or the API-keys page), reusing `ProfileContactSettings`
   or a slim variant. Show it only when no verified number exists.
2. **Verify the number (recommended before expanding SMS).** Send a short
   code via the gateway ("VibeMarket code: 123456"), user enters it, set
   `phoneVerifiedAt`. This proves number + carrier gateway are right before we
   depend on them. Store code hash + expiry (new small table or fields);
   rate-limit attempts (reuse the advisory-lock pattern from
   `lib/listing-rate-limit.ts`). Send SMS only to verified numbers once this
   ships.
3. **Per-event preferences.** Today SMS only fires for staff broadcasts. Add
   seller-facing toggles (e.g. new buyer inquiry, new message, review/feedback
   received, security alerts like "new API key created") — either boolean
   columns or a JSON prefs blob on `User`.
4. **Wire the triggers.** Call `sendSmsNotification()` from the events chosen
   in (3) — conversation/message creation is the high-value one. Log every
   send: generalize `SiteNotificationDelivery` (nullable `notificationId`) or
   add a small `SmsDelivery` table.
5. **Throttle.** Cap SMS per user per day and keep bodies short — carrier
   gateways are best-effort and will filter chatty senders. Consider quiet
   hours.
6. **Later: reminders/scheduled SMS.** Needs a scheduler (Railway cron hitting
   an authenticated route, or an in-app queue) — separate milestone.

Suggested order: 1 → 2 → 3 → 4 (one milestone), 5 alongside 4, 6 later.

---

## 2026-07-06 — Handing back to Brandon

**Status:** Handing this back over to **Brandon**. He's about to push some
updates / get synced up.

**Next step:** Brandon pushes his updates and gets synced, then we bring it back
to continue.

### What we did this session

- **Seller API keys (feature).** Added the ability for a seller to generate a
  personal API key so their local app or AI agent can connect to the marketplace
  and manage their listings.
  - New `/seller/api-keys` page (linked from Seller Studio) to generate, copy
    (shown once), list, and revoke keys.
  - `SellerApiKey` model — stores only a SHA-256 hash of the token plus a short
    display prefix; plaintext is never persisted, only revocable.
  - `src/lib/api-keys.ts` — token generation, hashing, and `Authorization:
    Bearer` request authentication.
  - Programmatic API under `/api/v1` (`me`, `listings`, `listings/:id`), scoped
    strictly to the key owner's own listings.
  - Merged via PR #4.

- **API key documentation (feature).** Added a "What you can do with a key"
  section to the `/seller/api-keys` page — plain-language capabilities, an
  endpoint reference table, and the accepted listing fields. Merged via PR #5.

- **Production outage — diagnosed and fixed.** The site was crash-looping.
  - **Root cause:** the container start command runs `prisma db push` before
    `next start`. A recent schema change (from other work merged to master)
    added a **unique constraint on `Conversation.directKey`**. `prisma db push`
    treats adding a unique constraint as potentially destructive and refuses to
    apply it non-interactively, exiting non-zero — so `next start` never ran and
    Railway's `ON_FAILURE` policy restart-looped the container.
  - **Fix:** added `--accept-data-loss` to the startup `prisma db push`.
    - PR #9 added it to `package.json`'s `start` script — but that was the
      **wrong entrypoint**: Railway runs the image via the **Dockerfile `CMD`**,
      which hardcodes `npx prisma db push && npx next start` and never calls
      `npm start`. So #9 had no effect and it kept looping.
    - PR #10 fixed the **Dockerfile `CMD`** (the line that actually runs):
      `CMD npx prisma db push --accept-data-loss && npx next start`. This is the
      real fix. `package.json` keeps the flag too, for local `npm start`
      consistency.

### ✅ Resolved — confirmed fixed

- **The fix worked. The system is back up and running fine.** The Dockerfile
  `CMD` change (PR #10, merged to master `b04e082`) resolved the crash-loop —
  the redeploy came up green and production is stable. No duplicate-`directKey`
  issue materialized; the unique constraint applied cleanly.

### Recommended follow-ups (not done)

- **Move production off `prisma db push` to versioned migrations**
  (`prisma migrate deploy`). Then destructive schema changes are caught in a
  reviewed migration instead of being force-applied at container boot. This is
  the durable fix for the class of outage above.
- **`.github/workflows/deploy.yml` triggers on push to `main`, but the default
  branch is `master`** — so that workflow has never run. Either point it at
  `master` or remove it to avoid confusion. (Railway deploys via its own GitHub
  integration, independent of this workflow.)

### Environment notes for the next agent

- Railway CLI is **not** preinstalled in the web session; installing it works
  (`npm i -g @railway/cli`), but this session's **egress policy blocks Railway's
  API** (`backboard.railway.com` → 403 at the proxy), so the CLI can't reach the
  project even with a token. Pulling Railway logs currently means pasting them in
  manually, or loosening the environment's network policy to allow that host.
- Deploys go out when `master` is updated (Railway GitHub integration).
