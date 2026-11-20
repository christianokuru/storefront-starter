export type Query = Record<string, string | number | boolean | null | undefined>;
export type RequestOptions = {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    query?: Query;
    body?: unknown;
    /** Attach the customer's token (Authorization: Bearer). Public catalogue calls never do, so they stay cacheable and preflight-free. */
    auth?: boolean;
    signal?: AbortSignal;
    /** Extra fetch init, e.g. `{ next: { revalidate: 60 } }` in Next.js server components. */
    init?: RequestInit & Record<string, unknown>;
    /** Override retries for this call (only ever applied to GET). */
    retries?: number;
    timeoutMs?: number;
};
export type HttpConfig = {
    baseUrl: string;
    fetch: typeof fetch;
    timeoutMs: number;
    retries: number;
    credentials: RequestCredentials;
    getToken: () => Promise<string | null>;
    onToken: (token: string) => Promise<void>;
    onUnauthorized: () => Promise<void>;
};
export declare function buildUrl(baseUrl: string, path: string, query?: Query): string;
/** Encode a path segment (handles, ids) so user input can never change the route. */
export declare const seg: (s: string) => string;
export declare class Http {
    private cfg;
    constructor(cfg: HttpConfig);
    get baseUrl(): string;
    request<T>(path: string, o?: RequestOptions): Promise<T>;
    private once;
}
