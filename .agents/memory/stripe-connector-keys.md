---
name: Stripe Replit connector key names
description: The Replit Stripe integration connector returns settings keys named `secret` and `publishable`, not `secret_key`/`publishable_key` as older docs suggested.
---

When reading Stripe credentials from the Replit connector API (`/api/v2/connection?include_secrets=true&connector_names=stripe`), the `settings` object has:

- `settings.secret` — the Stripe secret key (sk_test_… or sk_live_…)
- `settings.publishable` — the Stripe publishable key (pk_test_… or pk_live_…)

**NOT** `settings.secret_key` or `settings.publishable_key`.

**Why:** Discovered when Stripe init kept failing with "missing secret key" even after credentials were confirmed connected. The validation guard was checking `settings?.secret_key` which was always falsy.

**How to apply:** Always use `settings?.secret ?? settings?.secret_key` in the credential extraction to be resilient to both naming conventions. The validation guard must check the resolved value, not the raw field name.
