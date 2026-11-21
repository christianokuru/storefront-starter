# Project memory — Storefront starter

The per-client storefront skeleton for the owner's e-commerce business. Full business context, rules and history live in the engine repo's `CLAUDE.md` (`christianokuru/Next-Commerce-Engine`) — read it when available.

## Key facts

- Owner (Lagos developer) sells e-commerce sites one-time to African and foreign clients. **Engine + dashboards are identical for every client; each client gets a custom storefront made from this repo.**
- Owner rules: **push to `main` when done**, short answers, save tokens, **PWA + mobile-first**, Next.js + Tailwind + shadcn, deploy on Cloudflare, zero-config dev.
- Talks to the engine only through `@commerce-engine/sdk` (vendored in `vendor/commerce-sdk`; update with `npm run sdk:sync -- ../storefront-starter` from the engine repo).
- Plan-aware: reads `/api/store/config`; account pages, sign-in links and the discount box don't exist when the client's plan lacks them.
- Restyle per client: brand tokens at the top of `src/app/globals.css`, fonts in `src/app/layout.tsx`, copy in `src/lib/config.ts`.
- Config: `NEXT_PUBLIC_COMMERCE_URL` (engine URL, baked in at build). The engine must list this storefront in `STORE_CORS`.

## Run / test / deploy

- Local: engine `npm run dev` (port 3000) + `npm run seed`, then here `npm install && npm run dev` (port 3001).
- E2E: `ENGINE_LOG=… npm run e2e` (55 browser checks; use a freshly seeded engine), `STARTER=1` for Starter plan, `STORE=http://localhost:8788` against `npm run preview` (Workers runtime).
- Deploy: GitHub Actions `.github/workflows/deploy.yml` (secret `CLOUDFLARE_API_TOKEN`, input `commerce_url`).
- Owner's live test: https://storefront-starter.okuruchristian.workers.dev → engine https://next-commerce-engine.okuruchristian.workers.dev
