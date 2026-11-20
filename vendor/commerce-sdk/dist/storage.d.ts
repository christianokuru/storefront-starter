/**
 * Where the SDK keeps the cart id, sign-in token and currency choice.
 * Pick one with `createCommerce({ storage })`; the default works everywhere.
 */
export interface StorageAdapter {
    get(key: string): string | null | undefined | Promise<string | null | undefined>;
    set(key: string, value: string): void | Promise<void>;
    remove(key: string): void | Promise<void>;
}
export declare function memoryStorage(initial?: Record<string, string>): StorageAdapter;
/**
 * First-party cookies: readable by your server too, so server-rendered pages can show the cart and account.
 * Never throws (cookies disabled → falls back to memory for this tab).
 */
export declare function cookieStorage(opts?: {
    maxAgeDays?: number;
    domain?: string;
    path?: string;
    sameSite?: "Lax" | "Strict";
}): StorageAdapter;
/** localStorage (falls back to memory in private mode / when blocked). */
export declare function localStorageAdapter(): StorageAdapter;
/** Read-only view for server rendering, e.g. `readOnlyStorage((k) => cookies().get(k)?.value)`. Writes are ignored. */
export declare function readOnlyStorage(get: (key: string) => string | null | undefined): StorageAdapter;
/** Browser → first-party cookies; server/edge → memory. */
export declare function defaultStorage(): StorageAdapter;
