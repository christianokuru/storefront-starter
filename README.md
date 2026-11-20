# Storefront starter

A working, deliberately plain storefront for the commerce engine: the skeleton you restyle for each client.
Next.js 16, Tailwind 4, PWA, mobile-first, deploys to Cloudflare Workers. All commerce logic comes from
[`@commerce-engine/sdk`](vendor/commerce-sdk/README.md), so your time goes into design.

## Quick start

You need the engine running locally (it needs no config):

```bash
# terminal 1: the engine
cd ../Next-Commerce-Engine && npm run dev
# terminal 2: demo products (once)
cd ../Next-Commerce-Engine && npm run seed
# terminal 3: this storefront
npm install
npm run dev          # → http://localhost:3001
```

Locally, checkout uses the engine's **test-mode payments** (a fake payment page where you can pay, decline or cancel). Emails such as verification and password reset print in the engine's terminal.

## What's included

| Page | Path | Notes |
|---|---|---|
| Home | `/` | hero, categories, featured collection, latest products |
| Shop | `/products` | search, category filter, pagination, empty states, loading skeleton |
| Product | `/products/[handle]` | gallery (swipe on phones), variant picker (sold-out sizes struck through), quantity, sale prices, SEO metadata + JSON-LD |
| Bag | drawer + `/cart` | quantities, remove, unavailable-item warnings, synced across tabs |
| Checkout | `/checkout` | contact + address (saved addresses when signed in), delivery options, discount code, payment method, live totals |
| Result | `/checkout/complete` | succeeded / pending / failed / cancelled, each with the right next step |
| Account | `/account/*` | sign up (email verification), sign in, forgot/reset password, orders, order detail, addresses |

Plan-aware: if the store's plan has no customer accounts or discounts, the account pages, sign-in links and discount box don't exist (read from the engine's `/api/store/config`).
A currency switcher appears when the store sells in more than one currency.

## Making it the client's brand

1. **Colours, radius:** `src/app/globals.css` → the `BRAND` block at the top. Every component uses these tokens.
2. **Fonts:** `src/app/layout.tsx` → swap the two `next/font` imports.
3. **Copy:** `src/lib/config.ts` (`NEXT_PUBLIC_STORE_TAGLINE`, locale).
4. **Layout & pages:** edit or replace anything under `src/app` and `src/components`. Keep using the SDK hooks (`useCart`, `useCustomer`, `useStoreConfig`) and the cart, checkout and account logic keeps working.
5. **Icons:** replace `public/icons/*` and the logo (the store logo from Admin → Settings is used automatically if set).

## Configuration

| Variable | |
|---|---|
| `NEXT_PUBLIC_COMMERCE_URL` | the engine's URL (default `http://localhost:3000`) |
| `NEXT_PUBLIC_STORE_TAGLINE`, `NEXT_PUBLIC_LOCALE` | optional copy / formatting |

On the **engine**, allow this storefront: `STORE_CORS=https://clientbrand.com` and Admin → Settings → Storefront URL.

## Deploy (Cloudflare Workers)

```bash
NEXT_PUBLIC_COMMERCE_URL=https://admin.clientbrand.com npm run deploy
```

`npm run preview` runs the built Worker locally (workerd).

## Updating the SDK

From the engine repo: `npm run sdk:sync -- ../storefront-starter`, then `npm install` here.

## Tests

Full browser E2E (browse, search, variants, bag, tab sync, currency, three payment outcomes, sign-up with email verification, sign-in, addresses, password reset, mobile):

```bash
ENGINE_LOG=../Next-Commerce-Engine/engine.log npm run e2e      # engine started with: npm run dev > engine.log
STARTER=1 npm run e2e                                         # against an engine running PLAN=starter
STORE=http://localhost:8788 npm run e2e                       # against `npm run preview` (Workers runtime)
```

Run it against a freshly seeded engine: it places real (test-mode) orders, so stock goes down each run.

## Security

- CSP, `X-Frame-Options: DENY`, `nosniff`, strict referrer policy (`next.config.ts`).
- Card details never touch the storefront: payment happens on the provider's page.
- Redirects after sign-in only go to same-site paths; the engine only returns shoppers to allowed origins.
- The sign-in token lives in a first-party cookie readable by scripts (needed for cross-domain token auth). The CSP limits script sources; if the storefront and engine share a site, `auth: "cookie"` uses the engine's httpOnly cookie instead.
