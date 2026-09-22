# Production Deployment

## Required services

- Clerk application with Google and/or email sign-in.
- Managed PostgreSQL database.
- Gemini API key.
- payOS payment channel for real credit purchases.
- Vercel project connected to the repository.

## Environment variables

Configure separate Preview and Production values in Vercel:

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
DATABASE_URL
ADMIN_USER_IDS
GEMINI_API_KEY
GEMINI_MODEL
PAYOS_CLIENT_ID
PAYOS_API_KEY
PAYOS_CHECKSUM_KEY
```

`ADMIN_USER_IDS` is a comma-separated allowlist of Clerk user IDs used to seed
the first administrator. The database role remains the server-side product
authorization source.

## First deployment

1. Copy `.env.example` to `.env.local` and set development credentials.
2. Generate migration files with `npm run db:generate` after schema changes.
3. Apply committed migrations with `npm run db:migrate`.
4. Run `npm run typecheck`, `npm run lint`, and `npm run build`.
5. Deploy a Vercel Preview and complete the smoke test.
6. Add the production webhook URL in payOS:
   `https://YOUR_DOMAIN/api/payments/payos/webhook`.
7. Deploy production and run one low-value payment test.

On Vercel, the `vercel-build` package script runs `npm run db:migrate` before
`next build`. As long as `DATABASE_URL` is configured in the Vercel environment,
committed migrations are applied automatically and safely skipped on later
deployments.

After deployment, open `/api/health`. Core deployment is ready when it returns
HTTP 200 with `status: "ready"`. Billing can remain `false` until payOS is
configured; `/app/billing` stays disabled in that state.

## Smoke test

- Opening `/` redirects to `/app`; Clerk requests sign-in when needed.
- The optional public product explanation remains available at `/welcome`.
- A new project appears in the sidebar after creation.
- The owner can launch and restore its guided workflow.
- Another user cannot load that project ID.
- One successful Gemini call debits the configured credit cost.
- A failed Gemini call creates a matching refund.
- A repeated payOS webhook does not duplicate credits.
- A normal user cannot load `/admin`.
- The configured administrator sees global metrics and orders.

## Release commands

```bash
npm ci
npm run db:migrate
npm run typecheck
npm run lint
npm run build
```

Do not run `db:generate` during deployment. Generate and review migration SQL in
development, commit it, then apply the committed migration in deployment.
