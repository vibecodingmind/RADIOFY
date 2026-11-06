# Radiofy (AetherCast Broadcast OS)

Next.js 15 control plane for multi-tenant internet radio: stations, media library, AutoDJ, scheduling, billing, and public web players.

## Quick start

```bash
cp .env.example .env
docker compose up -d postgres icecast
pnpm install
# If upgrading from Azam Pay: rename DB enum value, then push schema
npx prisma db execute --file scripts/migrate-azampay-to-pesapal.sql --schema prisma/schema.prisma
npx prisma db push
pnpm run db:seed
pnpm run dev
```

Run unit tests: `pnpm test`

CI: GitHub Actions runs `pnpm run lint`, `pnpm test`, and `pnpm run build` on pushes/PRs to `main`/`master`.

Open [http://localhost:3000](http://localhost:3000)

### Demo accounts (seed)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | elena.rostova@radiofy.com | AdminPass123! |
| Broadcaster | alex@neonhorizon.fm | Broadcaster123! |

## Architecture

| Layer | Technology |
|-------|------------|
| App | Next.js App Router, React 19, Tailwind |
| Data | PostgreSQL + Prisma |
| Auth | JWT httpOnly cookie, RBAC (`AuthorizationService`) |
| Media | Local disk (`STORAGE_LOCAL_PATH`) + ID3 parsing |
| Streaming | Icecast (Docker) + Liquidsoap configs (generated per station) |
| AutoDJ | DB rotation + broadcast logs; cron sync endpoint |
| Payments | Stripe / PayPal / PesaPal adapters + webhook activation |

**PayPal:** Configure a webhook in the PayPal developer app pointing to  
`{NEXT_PUBLIC_APP_URL}/api/billing/webhooks?gateway=PAYPAL`  
and set `PAYPAL_WEBHOOK_ID` (plus client id/secret and optional `PAYPAL_PLAN_MONTHLY_ID` / `PAYPAL_PLAN_ANNUAL_ID` for fixed billing plans). Subscriptions carry `custom_id` as `orgId|planId|MONTHLY` or `orgId|planId|ANNUAL` for activation.

**PesaPal:** Register your IPN URL in the PesaPal dashboard to obtain `PESAPAL_NOTIFICATION_ID`. Point IPN to `{NEXT_PUBLIC_APP_URL}/api/billing/webhooks?gateway=PESAPAL` (POST). Set `PESAPAL_CONSUMER_KEY`, `PESAPAL_CONSUMER_SECRET`, `PESAPAL_IPN_SECRET` (for signed IPN if you enable it), and optionally `PESAPAL_CURRENCY` / `PESAPAL_COUNTRY_CODE` / `PESAPAL_ENVIRONMENT` (`sandbox` or `live`). On IPN, the server calls **GetTransactionStatus** and activates on `COMPLETED`.

## Streaming

1. **Icecast**: `docker compose up -d icecast` (listener port **8010** → container 8000).
2. **Start a station** from Studio or Live Control — writes `storage/liquidsoap/<stationId>/*.liq` and marks ON AIR.
3. **Managed mode** (default): AutoDJ advances playlists via cron (no Liquidsoap binary required).
4. **Liquidsoap mode**: set `ENABLE_LIQUIDSOAP=true` and install Liquidsoap locally, or run the external supervisor:

```bash
STREAM_SUPERVISOR_TOKEN=dev node services/supervisor/server.mjs
# In .env: STREAM_SUPERVISOR_URL=http://127.0.0.1:4010
```

Set public player stream URL:

```env
NEXT_PUBLIC_STREAM_BASE_URL=http://localhost:8010
```

## Cron / telemetry sync

```bash
curl -X POST http://localhost:3000/api/cron/stream-sync \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

Configure `CRON_SECRET` in `.env` and schedule every 1–5 minutes in production.

## Production checklist

- Strong `JWT_SECRET` and `CRON_SECRET`
- HTTPS + `NEXT_PUBLIC_APP_URL`
- PostgreSQL backups
- Object storage (S3) instead of local `./storage` for multi-node deploys
- Real payment gateway keys in Super Admin → Gateways (stored in `payment_gateway_configs`)
- Process supervisor on a dedicated streaming node (not serverless)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:push` | Apply Prisma schema |
| `npm run db:seed` | Demo data |
