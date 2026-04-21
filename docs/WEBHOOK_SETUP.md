# Stripe Webhook Setup

This guide covers webhook configuration for both development and production environments.

## Architecture

```
Development:  Stripe CLI → localhost:3000/api/webhooks/stripe
Production:   Stripe Dashboard → https://structra-two.vercel.app/api/webhooks/stripe
```

## Development Setup

The Stripe CLI forwards events to your local server. Run both processes in parallel:

```bash
# Terminal 1 — Dev server
pnpm dev

# Terminal 2 — Stripe event forwarding
./stripe-cli/stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The CLI auto-generates a `STRIPE_WEBHOOK_SECRET` for each session.

## Production Setup

### 1. Register the Endpoint

1. Open [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Set URL: `https://structra-two.vercel.app/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded` / `invoice.payment_failed`
   - `customer.subscription.created` / `updated` / `deleted`

### 2. Add the Secret to Vercel

Go to **Vercel → Settings → Environment Variables**:

```
STRIPE_WEBHOOK_SECRET_PRODUCTION = whsec_...   (Production only)
```

Redeploy after adding the variable.

## How Environment Detection Works

```typescript
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
const webhookSecret = isProduction
  ? process.env.STRIPE_WEBHOOK_SECRET_PRODUCTION
  : process.env.STRIPE_WEBHOOK_SECRET;
```

## Troubleshooting

| Issue | Fix |
|---|---|
| `Webhook signature verification failed` (dev) | Restart Stripe CLI to refresh the secret |
| `Webhook signature verification failed` (prod) | Verify `STRIPE_WEBHOOK_SECRET_PRODUCTION` in Vercel |
| Webhook endpoint not found | Confirm the Vercel deployment succeeded |
| Webhook timeout | Check Vercel function logs for handler errors |

> **Never commit webhook secrets to git.** Use test-mode secrets in development and live-mode secrets in production.
