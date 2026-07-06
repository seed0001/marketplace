# Handoff Log

A running log of who's working on what and what's next. When we sync up, point
your agent at this file first.

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
