---
name: stripe-replit-sync schema initialization
description: stripe-replit-sync's findOrCreateManagedWebhook requires a stripe.accounts DB table; for simple PaymentIntent-only flows, skip StripeSync entirely.
---

`stripe-replit-sync@1.0.0`'s `StripeSync.findOrCreateManagedWebhook()` internally queries `stripe.accounts` (a table it expects `runMigrations()` to create). In testing, `runMigrations()` reported success but the table did not exist, causing a `relation "stripe.accounts" does not exist` error on every startup.

**Why:** For wallet top-up via one-time PaymentIntents, StripeSync is unnecessary overhead — it's designed for syncing Stripe entities (subscriptions, products, customers) to a local PostgreSQL mirror. 

**How to apply:** For simple PaymentIntent flows:
1. Remove `runMigrations` and `getStripeSync` / `findOrCreateManagedWebhook` from server startup
2. Just verify credentials at startup with `stripe.accounts.retrieve()` (fast, no DB writes)
3. Create PaymentIntents directly via the Stripe SDK per-request
4. If webhooks are needed later, register them manually in the Stripe dashboard rather than programmatically via StripeSync
