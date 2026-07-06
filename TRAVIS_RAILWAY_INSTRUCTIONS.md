# Travis Railway Instructions

These are the operational instructions for Travis. Travis owns Railway, domain/DNS, and OpenRouter configuration. Brandon owns the GitHub repo and platform direction.

## Current Ownership Split

- Travis handles Railway access, Railway deploy settings, domain/DNS records, and OpenRouter billing/key setup.
- Brandon has GitHub contributor access and platform control.
- Brandon should be listed as an admin in the app environment now. A later code update should replace any hardcoded owner identity with Brandon's owner information.

## Railway Deployment

1. Confirm Railway is connected to this GitHub repo:
   - Repo: `seed0001/marketplace`
   - Branch: `master`
   - Deploy trigger: push to `master`

2. Confirm Railway is using the repo `Dockerfile`.
   - The current Dockerfile start command is:
     ```sh
     npx prisma db push --accept-data-loss && npx next start
     ```
   - This fixed the previous crash loop.

3. Confirm the Railway service has a Postgres database attached and `DATABASE_URL` is set.

4. After each deploy, verify:
   - The deployment is green.
   - The public site loads.
   - `/auth/signin` loads.
   - `/notifications` loads for a signed-in user.
   - `/staff/notifications` loads for an admin/staff user.
   - `/seller/api-keys` loads for a seller/admin user.

## Required Railway Variables

Set these in Railway for the web service:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="long-random-secret"
AUTH_URL="https://www.vibemarket.biz"
ADMIN_EMAILS="brandon-email@example.com"
STAFF_EMAILS=""
AI_SETTINGS_ENCRYPTION_KEY="long-random-secret-different-from-auth-secret"
```

Notes:

- `AUTH_SECRET` must stay stable. Rotating it can sign users out.
- `AUTH_URL` should match the final canonical production domain.
- Put Brandon's real login email in `ADMIN_EMAILS`.
- `AI_SETTINGS_ENCRYPTION_KEY` protects saved provider keys in the database. Keep it stable.
- `STAFF_EMAILS` is optional and should be comma-separated if used.

## OpenRouter Setup

Travis needs to configure OpenRouter so Seller Studio AI can work.

Set:

```env
OPENROUTER_API_KEY="sk-or-..."
OPENROUTER_MODEL="openrouter/auto"
```

Checks:

- Confirm the OpenRouter account has billing/credits available.
- Confirm the key is active.
- Confirm Seller Studio chat no longer shows: `Seller AI is not configured yet`.
- If a specific model is preferred later, replace `OPENROUTER_MODEL` with that model ID.

## Email Notifications

The code is ready to send email notifications through Resend-compatible email delivery.

Set:

```env
RESEND_API_KEY="re_..."
EMAIL_FROM="VibeMarket <updates@vibemarket.biz>"
```

Domain/DNS task:

- Verify the sending domain in Resend.
- Add the required DNS records from Resend at the domain provider.
- Do not use an unverified production sender domain.

Checks:

- User turns on Email alerts in profile settings.
- Staff sends a test message from `/staff/notifications`.
- Confirm delivery in the recipient inbox and in provider logs.

## SMS Notifications

SMS is optional but supported if Twilio is configured.

Set only if Travis wants SMS live:

```env
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_FROM_NUMBER="+1..."
```

Checks:

- User adds a phone number and enables phone alerts.
- Staff sends a test notification.
- Confirm SMS delivery and provider logs.

## Domain Setup

Travis needs to handle the domain connection in Railway and DNS.

1. Choose the canonical production domain:
   - Recommended: `https://www.vibemarket.biz`

2. Add the custom domain in Railway for the web service.

3. Add the DNS records Railway provides at the domain provider.

4. If both root and `www` are used, choose one canonical URL and redirect the other to it if the DNS/provider supports that.

5. After DNS is live, set:
   ```env
   AUTH_URL="https://www.vibemarket.biz"
   ```

6. Verify:
   - SSL certificate is issued.
   - `https://www.vibemarket.biz` loads without certificate warnings.
   - Sign in works on the custom domain.
   - Staff/admin pages work on the custom domain.

## Optional Provider Variables

Fish Audio text-to-speech can be configured through the admin dashboard or environment variables.

```env
FISH_API_KEY="..."
FISH_TTS_MODEL="s2.1-pro-free"
FISH_TTS_REFERENCE_ID=""
```

Discord settings are managed through the staff Discord dashboard and stored encrypted in the database.

## GitHub / Workflow Note

The existing GitHub Actions deploy workflow listens to `main`, but the repo uses `master`.

Travis does not need to fix this for Railway deploys because Railway deploys from GitHub directly. It should be cleaned up later by Brandon:

- Change `.github/workflows/deploy.yml` from `main` to `master`, or
- Remove it if Railway is the only deployment path.

## What Travis Should Report Back

After configuration, Travis should report:

- Railway production deploy URL.
- Custom domain connected and verified.
- Exact canonical domain to use in code/settings.
- Confirmation that `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `ADMIN_EMAILS`, and `AI_SETTINGS_ENCRYPTION_KEY` are set.
- Whether OpenRouter is configured and working.
- Whether Resend/email notifications are configured and working.
- Whether Twilio/SMS is configured or intentionally skipped.
- Any Railway deploy/runtime errors copied from logs.

