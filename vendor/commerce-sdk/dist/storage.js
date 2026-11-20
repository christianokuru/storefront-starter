export function memoryStorage(initial = {}) {
    const m = new Map(Object.entries(initial));
    return { get: (k) => m.get(k) ?? null, set: (k, v) => void m.set(k, v), remove: (k) => void m.delete(k) };
}
/**
 * First-party cookies: readable by your server too, so server-rendered pages can show the cart and account.
 * Never throws (cookies disabled → falls back to memory for this tab).
 */
export function cookieStorage(opts = {}) {
    const fallback = memoryStorage();
    const ok = () => typeof document !== "undefined" && navigator?.cookieEnabled !== false;
    const attrs = (maxAge) => [
        `Path=${opts.path ?? "/"}`,
        `Max-Age=${maxAge}`,
        `SameSite=${opts.sameSite ?? "Lax"}`,
        opts.domain ? `Domain=${opts.domain}` : "",
        typeof location !== "undefined" && location.protocol === "https:" ? "Secure" : "",
    ].filter(Boolean).join("; ");
    return {
        get(k) {
            if (!ok())
                return fallback.get(k);
            const hit = document.cookie.split("; ").find((c) => c.startsWith(`${encodeURIComponent(k)}=`));
            if (!hit)
                return fallback.get(k);
            try {
                return decodeURIComponent(hit.slice(hit.indexOf("=") + 1));
            }
            catch {
                return null;
            }
        },
        set(k, v) {
            fallback.set(k, v);
            if (ok())
                document.cookie = `${encodeURIComponent(k)}=${encodeURIComponent(v)}; ${attrs(Math.round((opts.maxAgeDays ?? 30) * 86400))}`;
        },
        remove(k) {
            fallback.remove(k);
            if (ok())
                document.cookie = `${encodeURIComponent(k)}=; ${attrs(0)}`;
        },
    };
}
/** localStorage (falls back to memory in private mode / when blocked). */
export function localStorageAdapter() {
    const fallback = memoryStorage();
    const ls = () => { try {
        return typeof localStorage === "undefined" ? null : localStorage;
    }
    catch {
        return null;
    } };
    return {
        get: (k) => { try {
            return ls()?.getItem(k) ?? fallback.get(k);
        }
        catch {
            return fallback.get(k);
        } },
        set: (k, v) => { fallback.set(k, v); try {
            ls()?.setItem(k, v);
        }
        catch { /* quota / blocked */ } },
        remove: (k) => { fallback.remove(k); try {
            ls()?.removeItem(k);
        }
        catch { /* blocked */ } },
    };
}
/** Read-only view for server rendering, e.g. `readOnlyStorage((k) => cookies().get(k)?.value)`. Writes are ignored. */
export function readOnlyStorage(get) {
    return { get, set: () => { }, remove: () => { } };
}
/** Browser → first-party cookies; server/edge → memory. */
export function defaultStorage() {
    return typeof document !== "undefined" ? cookieStorage() : memoryStorage();
}
