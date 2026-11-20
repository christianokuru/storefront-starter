# @commerce-engine/sdk

Typed client for the engine's **Store API**: catalogue, cart, checkout, customer accounts.
Zero dependencies, ~10 KB. Works in the browser, Node, Next.js server components and Cloudflare Workers.
No UI: design every storefront however you like.

```ts
import { createCommerce, formatMoney } from "@commerce-engine/sdk";

const commerce = createCommerce({ baseUrl: "https://admin.clientbrand.com" });

const { products } = await commerce.products.list({ category: "dresses", limit: 12 });
await commerce.cart.add(products[0].variants[0].id, 2);
```

## Install in a storefront

From the engine repo (builds the SDK and copies it into the storefront):

```bash
npm run sdk:sync -- ../storefront-starter
```

Then `npm install` in the storefront (it depends on `"@commerce-engine/sdk": "file:vendor/commerce-sdk"`).

**Engine side:** allow the storefront's origin with `STORE_CORS=https://clientbrand.com` (and set Admin → Settings → Storefront URL).
In local development any `http://localhost:*` origin is allowed automatically.

## API

| Area | Calls |
|---|---|
| Store | `store.settings()`, `store.config()` (features this store has), `store.hasFeature("discounts")` |
| Currency | `currency.get()`, `currency.set("USD")` (moves the cart; returns items not sold in that currency) |
| Catalogue | `products.list({ q, category, collection, limit, offset })`, `products.get(handle)` → `null` if missing, `categories.list()`, `collections.list()` |
| Cart | `cart.get()`, `cart.add(variantId, qty)`, `cart.setQuantity(lineId, qty)` (0 removes), `cart.remove(lineId)`, `cart.update({ email, shippingAddress, billingAddress })`, `cart.shippingOptions()`, `cart.setShippingOption(id)`, `cart.applyCode(code)`, `cart.removeCode()`, `cart.paymentProviders()`, `cart.reset()`, `cart.subscribe(fn)` |
| Checkout | `checkout.readiness(cart)` (what's missing), `checkout.pay(provider, { returnUrl, cancelUrl })` (redirects to the provider), `checkout.handleReturn(url)` (reads the result, clears the cart on success) |
| Auth | `auth.signUp({ name, email, password, callbackURL })`, `auth.signIn()`, `auth.signOut()`, `auth.session()`, `auth.requestPasswordReset(email, redirectTo)`, `auth.resetPassword(token, pw)`, `auth.sendVerificationEmail()`, `auth.changePassword()`, `auth.onChange(fn)` |
| Customer | `customer.me()` → `null` when signed out, `customer.update()`, `customer.orders.list()/get(id)`, `customer.addresses.list()/add()/remove()` |
| Utils | `formatMoney(minor, currency, locale)`, `toMajor`, `toMinor`, `CommerceError`, `isCommerceError(e, code)` |

All money is an integer in the currency's minor unit (kobo, cents).

### React (`@commerce-engine/sdk/react`)

```tsx
<CommerceProvider client={commerce}>…</CommerceProvider>

const { cart, count, add, setQuantity, remove, applyCode, pending, error } = useCart(); // live, synced across tabs
const { customer, signedIn } = useCustomer();
const { has } = useStoreConfig(); // has("customerAccounts")
```

### Server rendering (Next.js)

```ts
const jar = await cookies();
const commerce = createCommerce({ baseUrl, storage: readOnlyStorage((k) => jar.get(k)?.value) });
const product = await commerce.products.get(handle, {}, { init: { next: { revalidate: 60 } } });
```

The browser instance stores the cart id, sign-in token and currency in first-party cookies, so server-rendered pages see the same cart and currency.

## Edge cases handled for you

- **Carts are created lazily** on the first add: browsing never creates carts or hits the engine's cart rate limit.
- **One cart under double-clicks:** parallel adds share a single cart creation; cart writes run one at a time, in order, so a slow response can't overwrite a newer one.
- **Stale carts recover:** a deleted or already-paid cart is dropped and a fresh one created on the next add. Malformed/tampered ids in storage never reach the server.
- **A missing line ≠ a missing cart:** "Line item not found" never throws your cart away.
- **Tabs stay in sync** (BroadcastChannel in browsers).
- **Safe retries:** only GETs are retried (network errors, timeouts, 429, 5xx), with backoff and `Retry-After`. Writes are never retried, so nothing is added twice and no second payment starts.
- **Timeouts and cancellation:** every call has a timeout (15s default) and accepts an `AbortSignal`.
- **Double "Pay" clicks** send one request; the engine also reuses an open payment session.
- **Payment return is validated:** unknown statuses become `error`; order ids/numbers are checked before display; the cart is cleared only on `succeeded`.
- **Expired sign-in:** a 401 clears the token and fires `auth.onChange(false)`; `customer.me()` returns `null`. Sign-out clears locally even when offline.
- **No route injection:** handles and ids are URL-encoded.
- **Public catalogue calls send no Authorization header**, so they stay CDN-cacheable and need no CORS preflight.
- **Input checked before the network:** quantities, emails, password length.
- **Useful errors:** HTML error pages from proxies/CDNs, Better Auth errors and Store API errors all become `CommerceError` with a stable `code`.

## Errors

```ts
try { await commerce.cart.applyCode(code); }
catch (e) { if (isCommerceError(e, "not_allowed")) show(e.message); }
```

| code | meaning |
|---|---|
| `network_error`, `timeout`, `aborted` | connection problems / you cancelled |
| `invalid_data` | bad input (`details` has field issues) |
| `unauthorized` | not signed in or session expired |
| `not_found` | doesn't exist, or the feature isn't in this store's plan |
| `not_allowed` | business rule: out of stock, cart completed, code expired… |
| `rate_limited` | slow down (`retryAfter` seconds) |
| `payment_error` | the provider couldn't start the payment |
| `email_not_verified`, `invalid_credentials`, `user_exists`, `weak_password`, `invalid_token` | sign-in / sign-up |
| `origin_not_allowed` | add this site to the engine's `STORE_CORS` |
| `unexpected` | anything else |

## Auth modes

- `auth: "token"` (default): the session token comes back in the `set-auth-token` header and is sent as `Authorization: Bearer …`. Works across domains.
- `auth: "cookie"`: storefront and engine on the same site (e.g. `shop.brand.com` + `admin.brand.com`); uses the engine's own session cookie.

Email verification and password reset links go to the engine, which redirects to your `callbackURL` / `redirectTo` (must be an allowed storefront origin).

## Tests

`npm test` in the engine runs the SDK unit tests (mocked fetch, edge cases above). The storefront-starter repo has a full browser E2E against a real engine.
