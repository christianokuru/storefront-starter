import { AuthApi } from "./auth.js";
import { CartApi } from "./cart.js";
import { Http, type RequestOptions } from "./http.js";
import { type StorageAdapter } from "./storage.js";
import type { Address, Cart, Category, Collection, Customer, CustomerAddress, Feature, Order, OrderList, PaymentSession, Product, ProductList, StoreConfig, StoreSettings } from "./types.js";
export type CommerceOptions = {
    /** The engine's URL, e.g. "https://admin.clientbrand.com". */
    baseUrl: string;
    /** Where cart id / token / currency are kept. Default: first-party cookies in the browser, memory on the server. */
    storage?: StorageAdapter;
    /** "token" (default, works across domains) or "cookie" (storefront + engine on the same site). */
    auth?: "token" | "cookie";
    /** Key prefix in storage. Change it if two stores share one domain. */
    storageKey?: string;
    fetch?: typeof fetch;
    /** Per request. Default 15s. */
    timeoutMs?: number;
    /** Retries for safe (GET) requests on network errors, timeouts, 429 and 5xx. Default 2. Writes are never retried. */
    retries?: number;
};
type Fetch = Pick<RequestOptions, "signal" | "init">;
export declare function createCommerce(options: CommerceOptions): {
    http: Http;
    store: {
        settings: (o?: {
            fresh?: boolean;
        }) => Promise<StoreSettings>;
        /** Features this store has. Out-of-plan features are simply absent. */
        config: (o?: {
            fresh?: boolean;
        }) => Promise<StoreConfig>;
        hasFeature: (f: Feature) => Promise<boolean>;
    };
    currency: {
        /** Shopper's chosen currency, if any (else the store default applies). */
        get: () => Promise<string | undefined>;
        /** Remember a currency and move the cart to it. Returns items that aren't sold in that currency. */
        set: (code: string) => Promise<{
            cart: Cart | null;
            dropped: string[];
        }>;
    };
    products: {
        list: (q?: {
            q?: string;
            category?: string;
            collection?: string;
            limit?: number;
            offset?: number;
            currency?: string;
        }, o?: Fetch) => Promise<ProductList>;
        /** null when the product doesn't exist or isn't published. */
        get: (handle: string, q?: {
            currency?: string;
        }, o?: Fetch) => Promise<Product | null>;
    };
    categories: {
        list: (o?: Fetch) => Promise<Category[]>;
    };
    collections: {
        list: (o?: Fetch) => Promise<Collection[]>;
    };
    cart: CartApi;
    checkout: {
        /** What's still missing before payment (for step UIs). Server re-checks everything. */
        readiness(c: Cart | null | undefined, opts?: {
            shippingOptionsAvailable?: boolean;
        }): {
            ready: boolean;
            missing: ("email" | "items" | "unavailable_items" | "shipping_address" | "shipping_option" | "promotion")[];
        };
        /**
         * Start payment and (in the browser) go to the provider's secure page.
         * Double clicks are safe: one request in flight, and the engine reuses an open payment session.
         * `returnUrl` receives `?status=…&order=…&number=…`; `cancelUrl` is used if the shopper backs out.
         */
        pay: (provider: string, o?: {
            returnUrl?: string;
            cancelUrl?: string;
            redirect?: boolean;
        }) => Promise<PaymentSession>;
        /**
         * Read the result the engine appended to your returnUrl. Only `succeeded` means an order exists;
         * it also clears the local cart. Treat it as display info: the engine has already verified the payment.
         */
        handleReturn(input: string | URL | URLSearchParams): Promise<{
            status: "error" | "pending" | "canceled" | "requires_action" | "succeeded" | "failed" | "invalid";
            orderId: string | null;
            orderNumber: number | null;
            reference: string | null;
        }>;
    };
    auth: AuthApi;
    customer: {
        /** null when signed out (or accounts are off for this store). */
        me: (o?: Fetch) => Promise<Customer | null>;
        update: (patch: {
            firstName?: string | null;
            lastName?: string | null;
            phone?: string | null;
        }) => Promise<Customer>;
        orders: {
            list: (q?: {
                limit?: number;
                offset?: number;
            }, o?: Fetch) => Promise<OrderList>;
            get: (id: string, o?: Fetch) => Promise<Order | null>;
        };
        addresses: {
            list: (o?: Fetch) => Promise<CustomerAddress[]>;
            add: (address: Address, opts?: {
                isDefault?: boolean;
            }) => Promise<string>;
            remove: (id: string) => Promise<void>;
        };
    };
};
export type Commerce = ReturnType<typeof createCommerce>;
export {};
