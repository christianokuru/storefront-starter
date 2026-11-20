import { CommerceError, parseRetryAfter, toCommerceError, friendlyMessage } from "./errors.js";
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const MAX_BACKOFF_MS = 8000;
const sleep = (ms, signal) => new Promise((resolve, reject) => {
    if (signal?.aborted)
        return reject(signal.reason);
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(t); reject(signal.reason); }, { once: true });
});
export function buildUrl(baseUrl, path, query) {
    const url = new URL(baseUrl.replace(/\/+$/, "") + path);
    for (const [k, v] of Object.entries(query ?? {}))
        if (v !== undefined && v !== null && v !== "")
            url.searchParams.set(k, String(v));
    return url.toString();
}
/** Encode a path segment (handles, ids) so user input can never change the route. */
export const seg = (s) => encodeURIComponent(String(s));
export class Http {
    cfg;
    constructor(cfg) {
        this.cfg = cfg;
    }
    get baseUrl() {
        return this.cfg.baseUrl;
    }
    async request(path, o = {}) {
        const method = o.method ?? "GET";
        const idempotent = method === "GET";
        // Never retry writes: a retried POST could add an item twice or start a second payment.
        const maxRetries = idempotent ? (o.retries ?? this.cfg.retries) : 0;
        let attempt = 0;
        for (;;) {
            try {
                return await this.once(path, method, o);
            }
            catch (e) {
                const err = e;
                const retryable = err.code === "network_error" || err.code === "timeout" || RETRYABLE_STATUS.has(err.status);
                if (!retryable || attempt >= maxRetries || o.signal?.aborted)
                    throw err;
                const backoff = Math.min(MAX_BACKOFF_MS, 300 * 2 ** attempt) * (0.5 + Math.random() / 2);
                await sleep(err.retryAfter !== undefined ? Math.min(err.retryAfter * 1000, 10_000) : backoff, o.signal);
                attempt++;
            }
        }
    }
    async once(path, method, o) {
        if (o.signal?.aborted)
            throw new CommerceError("aborted", "Request was cancelled", { cause: o.signal.reason });
        const headers = new Headers(o.init?.headers);
        headers.set("Accept", "application/json");
        if (o.body !== undefined)
            headers.set("Content-Type", "application/json");
        if (o.auth) {
            const token = await this.cfg.getToken();
            if (token)
                headers.set("Authorization", `Bearer ${token}`);
        }
        const timeout = new AbortController();
        const timer = setTimeout(() => timeout.abort(new DOMException("Timed out", "TimeoutError")), o.timeoutMs ?? this.cfg.timeoutMs);
        const signal = o.signal ? anySignal([o.signal, timeout.signal]) : timeout.signal;
        let res;
        try {
            res = await this.cfg.fetch(buildUrl(this.cfg.baseUrl, path, o.query), {
                ...o.init,
                method,
                headers,
                body: o.body === undefined ? undefined : JSON.stringify(o.body),
                credentials: this.cfg.credentials,
                signal,
            });
        }
        catch (e) {
            if (o.signal?.aborted)
                throw new CommerceError("aborted", "Request was cancelled", { cause: e });
            if (timeout.signal.aborted)
                throw new CommerceError("timeout", friendlyMessage("timeout"), { cause: e });
            throw new CommerceError("network_error", friendlyMessage("network_error"), { cause: e });
        }
        finally {
            clearTimeout(timer);
        }
        const token = res.headers.get("set-auth-token");
        if (token)
            await this.cfg.onToken(token);
        const text = await res.text().catch(() => "");
        let data = null;
        if (text) {
            try {
                data = JSON.parse(text);
            }
            catch {
                // HTML error pages from proxies/CDNs, truncated bodies…
                if (!res.ok)
                    throw new CommerceError(res.status >= 500 ? "unexpected" : "unexpected", friendlyMessage("unexpected"), { status: res.status, retryAfter: parseRetryAfter(res.headers.get("retry-after")) });
                throw new CommerceError("unexpected", "The store sent an unreadable response", { status: res.status });
            }
        }
        if (!res.ok) {
            const err = toCommerceError(res.status, data, res.headers);
            if (err.code === "unauthorized" && o.auth)
                await this.cfg.onUnauthorized();
            throw err;
        }
        return data;
    }
}
/** AbortSignal.any with a fallback for older runtimes. */
function anySignal(signals) {
    const any = AbortSignal.any;
    if (any)
        return any(signals);
    const c = new AbortController();
    for (const s of signals) {
        if (s.aborted) {
            c.abort(s.reason);
            break;
        }
        s.addEventListener("abort", () => c.abort(s.reason), { once: true });
    }
    return c.signal;
}
