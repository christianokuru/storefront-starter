import { type Http } from "./http.js";
import type { StorageAdapter } from "./storage.js";
import type { Address, Cart, PaymentProvider, ShippingOption } from "./types.js";
type Listener = (cart: Cart | null) => void;
export declare const MAX_QUANTITY = 100;
/** The stored cart is unusable (deleted, purged, already paid) → start a fresh one. */
export declare function isStaleCartError(e: unknown): boolean;
/**
 * Cart with the edge cases handled:
 * - created lazily on the first add (browsing never creates carts or hits rate limits)
 * - one cart even under double-clicks / parallel adds (single-flight creation + serialized writes)
 * - a stale stored cart (deleted, already paid) is dropped and replaced transparently
 * - every write returns the full cart; subscribers (UI, other tabs) get it
 */
export declare class CartApi {
    private http;
    private storage;
    private key;
    private currency;
    private listeners;
    private current;
    private writeQueue;
    private creating;
    private loading;
    private version;
    private channel;
    constructor(http: Http, storage: StorageAdapter, key: string, currency: () => Promise<string | undefined>);
    /** Last known cart (undefined until first load). For useSyncExternalStore. */
    snapshot: () => Cart | null | undefined;
    subscribe: (fn: Listener) => () => undefined;
    private publish;
    /** Stored cart id; a malformed/tampered value is discarded instead of breaking every request. */
    id(): Promise<string | null>;
    /** Forget the cart locally (e.g. after a successful order). Does not delete it on the server. */
    reset(): Promise<void>;
    /** Load the current cart, or null if there isn't one. Concurrent calls share one request. */
    get(opts?: {
        signal?: AbortSignal;
    }): Promise<Cart | null>;
    /** Create a cart explicitly (normally not needed: `add` creates one). */
    create(input?: {
        email?: string;
        currencyCode?: string;
    }): Promise<Cart>;
    private ensureId;
    /** Run writes one at a time, in order, so responses can't overwrite each other out of order. */
    private serialize;
    private write;
    add(variantId: string, quantity?: number): Promise<Cart>;
    /** Set a line's quantity; 0 removes it. */
    setQuantity(lineId: string, quantity: number): Promise<Cart>;
    remove(lineId: string): Promise<Cart>;
    /** Email and addresses. Pass `billingAddress: null` to use the shipping address. */
    update(input: {
        email?: string;
        shippingAddress?: Address;
        billingAddress?: Address | null;
    }): Promise<Cart>;
    /** Shipping methods for the cart's address (empty until an address is set). */
    shippingOptions(): Promise<ShippingOption[]>;
    setShippingOption(optionId: string): Promise<Cart>;
    applyCode(code: string): Promise<Cart>;
    removeCode(): Promise<Cart>;
    /** Payment providers usable for this cart's currency. */
    paymentProviders(): Promise<PaymentProvider[]>;
    /**
     * Move the cart to another currency. Carts are priced in one currency, so this creates a new cart and
     * re-adds each item; items not sold in the new currency are returned in `dropped`.
     */
    changeCurrency(currencyCode: string): Promise<{
        cart: Cart | null;
        dropped: string[];
    }>;
    /** Item count for badges. */
    static count(cart: Cart | null | undefined): number;
}
export {};
