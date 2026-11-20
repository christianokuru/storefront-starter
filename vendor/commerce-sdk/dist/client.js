import { AuthApi } from "./auth.js";
import { CartApi } from "./cart.js";
import { CommerceError, isCommerceError } from "./errors.js";
import { Http, seg } from "./http.js";
import { defaultStorage } from "./storage.js";
/** Small TTL cache with in-flight de-duplication (settings/config are read by many components). */
function memo(ttlMs, load) {
    let value = null;
    let pending = null;
    const get = (force = false) => {
        if (!force && value && Date.now() - value.at < ttlMs)
            return Promise.resolve(value.v);
        return (pending ??= load().then((v) => { value = { v, at: Date.now() }; return v; }).finally(() => { pending = null; }));
    };
    return Object.assign(get, { clear: () => { value = null; } });
}
export function createCommerce(options) {
    if (!/^https?:\/\//.test(options.baseUrl ?? ""))
        throw new CommerceError("invalid_data", "createCommerce: baseUrl must be an absolute http(s) URL");
    const storage = options.storage ?? defaultStorage();
    const prefix = options.storageKey ?? "nce";
    const keys = { cart: `${prefix}_cart`, token: `${prefix}_token`, currency: `${prefix}_currency` };
    const mode = options.auth ?? "token";
    const fetchImpl = options.fetch ?? ((...a) => globalThis.fetch(...a));
    const authRef = {};
    const tokens = {
        get: async () => (mode === "token" ? (await storage.get(keys.token)) || null : null),
        set: async (t) => { if (mode === "token")
            await storage.set(keys.token, t); },
        clear: async () => { await storage.remove(keys.token); },
    };
    const http = new Http({
        baseUrl: options.baseUrl.replace(/\/+$/, ""),
        fetch: fetchImpl,
        timeoutMs: options.timeoutMs ?? 15_000,
        retries: options.retries ?? 2,
        credentials: mode === "cookie" ? "include" : "omit",
        getToken: tokens.get,
        onToken: tokens.set,
        onUnauthorized: async () => {
            if (mode === "token" && (await tokens.get())) {
                await tokens.clear();
                authRef.current?.emit(false);
            }
        },
    });
    const auth = (authRef.current = new AuthApi(http, tokens, mode));
    const settings = memo(60_000, () => http.request("/api/store/settings"));
    const config = memo(60_000, () => http.request("/api/store/config"));
    const currency = {
        /** Shopper's chosen currency, if any (else the store default applies). */
        get: async () => ((await storage.get(keys.currency)) || undefined)?.toUpperCase(),
        /** Remember a currency and move the cart to it. Returns items that aren't sold in that currency. */
        set: async (code) => {
            const c = code.trim().toUpperCase();
            const s = await settings();
            if (!s.currencies.includes(c))
                throw new CommerceError("invalid_data", `${c} is not available in this store`);
            await storage.set(keys.currency, c);
            return cart.changeCurrency(c);
        },
    };
    const cart = new CartApi(http, storage, keys.cart, currency.get);
    const notFoundToNull = async (p) => {
        try {
            return await p;
        }
        catch (e) {
            if (isCommerceError(e, "not_found"))
                return null;
            throw e;
        }
    };
    return {
        http,
        store: {
            settings: (o = {}) => settings(o.fresh),
            /** Features this store has. Out-of-plan features are simply absent. */
            config: (o = {}) => config(o.fresh),
            hasFeature: async (f) => (await config()).features.includes(f),
        },
        currency,
        products: {
            list: async (q = {}, o = {}) => http.request("/api/store/products", {
                query: {
                    q: q.q?.trim().slice(0, 100), category: q.category, collection: q.collection,
                    limit: q.limit === undefined ? undefined : Math.min(100, Math.max(1, Math.floor(q.limit))),
                    offset: q.offset === undefined ? undefined : Math.min(10_000, Math.max(0, Math.floor(q.offset))),
                    currency: q.currency ?? (await currency.get()),
                },
                ...o,
            }),
            /** null when the product doesn't exist or isn't published. */
            get: async (handle, q = {}, o = {}) => notFoundToNull(http.request(`/api/store/products/${seg(handle)}`, { query: { currency: q.currency ?? (await currency.get()) }, ...o }).then((r) => r.product)),
        },
        categories: { list: (o = {}) => http.request("/api/store/categories", o).then((r) => r.categories) },
        collections: {
            list: (o = {}) => notFoundToNull(http.request("/api/store/collections", o).then((r) => r.collections)).then((c) => c ?? []),
        },
        cart,
        checkout: {
            /** What's still missing before payment (for step UIs). Server re-checks everything. */
            readiness(c, opts = {}) {
                const missing = [];
                if (!c || !c.items.length)
                    missing.push("items");
                if (c?.items.some((i) => !i.purchasable))
                    missing.push("unavailable_items");
                if (!c?.email)
                    missing.push("email");
                if (!c?.shippingAddress)
                    missing.push("shipping_address");
                if (c?.shippingAddress && !c.shippingOption && opts.shippingOptionsAvailable !== false)
                    missing.push("shipping_option");
                if (c?.promotion && c.totals.promotionError)
                    missing.push("promotion");
                return { ready: missing.length === 0, missing };
            },
            /**
             * Start payment and (in the browser) go to the provider's secure page.
             * Double clicks are safe: one request in flight, and the engine reuses an open payment session.
             * `returnUrl` receives `?status=…&order=…&number=…`; `cancelUrl` is used if the shopper backs out.
             */
            pay: (() => {
                let inFlight = null;
                return (provider, o = {}) => (inFlight ??= (async () => {
                    const id = await cart.id();
                    if (!id)
                        throw new CommerceError("not_found", "Your cart is empty");
                    const session = await http.request(`/api/store/carts/${seg(id)}/payment`, {
                        method: "POST", auth: true, body: { provider, ...(o.returnUrl ? { returnUrl: o.returnUrl } : {}), ...(o.cancelUrl ? { cancelUrl: o.cancelUrl } : {}) },
                    });
                    if (o.redirect !== false && typeof window !== "undefined")
                        window.location.assign(session.redirectUrl);
                    return session;
                })().finally(() => { inFlight = null; }));
            })(),
            /**
             * Read the result the engine appended to your returnUrl. Only `succeeded` means an order exists;
             * it also clears the local cart. Treat it as display info: the engine has already verified the payment.
             */
            async handleReturn(input) {
                const p = input instanceof URLSearchParams ? input : new URL(String(input), "http://x").searchParams;
                const known = ["succeeded", "pending", "failed", "requires_action", "canceled", "invalid", "error"];
                const raw = p.get("status") ?? "";
                const status = known.includes(raw) ? raw : "error";
                const orderId = p.get("order");
                const number = Number(p.get("number"));
                const result = {
                    status,
                    orderId: status === "succeeded" && orderId && /^order_[0-9A-Z]{26}$/.test(orderId) ? orderId : null,
                    orderNumber: status === "succeeded" && Number.isInteger(number) && number > 0 ? number : null,
                    reference: p.get("reference"),
                };
                if (status === "succeeded")
                    await cart.reset();
                return result;
            },
        },
        auth,
        customer: {
            /** null when signed out (or accounts are off for this store). */
            me: async (o = {}) => {
                if (!(await auth.hasToken()))
                    return null;
                try {
                    return (await http.request("/api/store/customers/me", { auth: true, ...o })).customer;
                }
                catch (e) {
                    if (isCommerceError(e, "unauthorized") || isCommerceError(e, "not_found"))
                        return null;
                    throw e;
                }
            },
            update: async (patch) => (await http.request("/api/store/customers/me", { method: "PATCH", auth: true, body: patch })).customer,
            orders: {
                list: (q = {}, o = {}) => http.request("/api/store/customers/me/orders", { auth: true, query: q, ...o }),
                get: (id, o = {}) => notFoundToNull(http.request(`/api/store/customers/me/orders/${seg(id)}`, { auth: true, ...o }).then((r) => r.order)),
            },
            addresses: {
                list: async (o = {}) => (await http.request("/api/store/customers/me/addresses", { auth: true, ...o })).addresses,
                add: async (address, opts = {}) => (await http.request("/api/store/customers/me/addresses", { method: "POST", auth: true, body: { ...address, isDefault: opts.isDefault } })).id,
                remove: async (id) => {
                    await http.request(`/api/store/customers/me/addresses/${seg(id)}`, { method: "DELETE", auth: true });
                },
            },
        },
    };
}
