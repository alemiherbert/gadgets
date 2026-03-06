# Gadgets Store Uganda

E-commerce store built with SvelteKit, deployed on Cloudflare Pages with Supabase (PostgreSQL) and Cloudflare R2 for image storage.

## Tech Stack

- **Framework:** SvelteKit + TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Image Storage:** Cloudflare R2
- **Hosting:** Cloudflare Pages
- **Auth:** Custom session-based (customer + admin)

## Prerequisites

- Node.js 20+
- npm
- Supabase account & project
- Cloudflare account with Pages & R2 enabled
- Wrangler CLI (`npm i -g wrangler`)
- Supabase CLI (`npx supabase`)

## Local Development

```sh
# Install dependencies
npm install

# Start dev server
npm run dev
```

For local development, set environment variables in a `.dev.vars` file (not committed):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Database Setup

### 1. Link Supabase Project

```sh
npx supabase link --project-ref <your-project-ref>
```

### 2. Push Migrations

```sh
npx supabase db push
```

This applies all migrations in `supabase/migrations/` in order:
- `20260307000000_initial_schema.sql` — Tables, indexes
- `20260307000001_rpc_functions.sql` — PostgreSQL functions (shop filters, search, recommendations, etc.)
- `20260307000002_seed_data.sql` — Seed data (brands, categories, sample products)
- `20260307000003_cleanup_and_indexes.sql` — Cleanup functions & performance indexes
- `20260307000004_product_slug_sku.sql` — Product slugs, SKUs, navigation helpers

### 3. Periodic Cleanup

Run this SQL periodically (e.g. weekly via Supabase SQL Editor) to clean up expired sessions, tokens, and old analytics:

```sql
SELECT * FROM run_all_cleanup();
```

## Cloudflare Deployment

### 1. Create R2 Bucket

```sh
wrangler r2 bucket create gadgets-images
```

### 2. Set Secrets

```sh
wrangler pages secret put SUPABASE_URL
wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY
```

Enter the values when prompted. These are set on the **production** environment.

### 3. Build & Deploy

```sh
# Build
npm run build

# Deploy to production
npx wrangler pages deploy .svelte-kit/cloudflare --project-name gadgets-store-uganda --branch main
```

> **Important:** Use `--branch main` to deploy to production. Without it, deploys go to a preview environment that won't have access to your secrets.

### Subsequent Deploys

```sh
npm run build && npx wrangler pages deploy .svelte-kit/cloudflare --project-name gadgets-store-uganda --branch main
```

### Applying New Migrations

```sh
npx supabase db push
```

## Project Structure

```
src/
  lib/
    db.ts          — Supabase data layer (all DB queries)
    types.ts       — TypeScript interfaces
    r2.ts          — R2 image upload/delete helpers
    cart.svelte.ts — Client-side cart (localStorage)
    auth.ts        — Session/password helpers
    utils.ts       — Formatting, validation
    components/    — Reusable Svelte components
  routes/
    (auth)/        — Customer auth (login, register, forgot/reset password)
    account/       — Customer account page
    admin/         — Admin dashboard & CRUD
    api/           — API routes (search, images, products)
    cart/          — Shopping cart
    checkout/      — Checkout flow
    products/[slug]/ — Product detail page (slug-based URLs)
    shop/          — Shop with filters & pagination
supabase/
  migrations/      — PostgreSQL migrations
```
