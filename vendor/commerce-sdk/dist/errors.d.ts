/**
 * Every failure is a CommerceError with a stable `code` you can branch on:
 *
 *   network_error   offline / DNS / CORS blocked            timeout     request took too long
 *   aborted         you cancelled it (AbortSignal)           invalid_data    bad input (see `details`)
 *   unauthorized    not signed in / session expired          forbidden       not allowed
 *   not_found       doesn't exist (or not in this plan)      not_allowed     business rule (out of stock, cart completed…)
 *   rate_limited    slow down (`retryAfter` seconds)         payment_error   provider couldn't start payment
 *   email_not_verified · invalid_credentials · user_exists · weak_password · invalid_token · origin_not_allowed
 *   unexpected      anything else (server error, bad response)
 */
export type CommerceErrorCode = "network_error" | "timeout" | "aborted" | "invalid_data" | "unauthorized" | "forbidden" | "not_found" | "conflict" | "not_allowed" | "payment_error" | "rate_limited" | "email_not_verified" | "invalid_credentials" | "user_exists" | "weak_password" | "invalid_token" | "origin_not_allowed" | "unexpected";
export declare class CommerceError extends Error {
    readonly code: CommerceErrorCode;
    readonly status: number;
    readonly details?: unknown;
    /** Seconds to wait before retrying (rate limits). */
    readonly retryAfter?: number;
    constructor(code: CommerceErrorCode, message: string, opts?: {
        status?: number;
        details?: unknown;
        retryAfter?: number;
        cause?: unknown;
    });
}
export declare function isCommerceError(e: unknown, code?: CommerceErrorCode): e is CommerceError;
/** Turn any error response body (Store API or Better Auth) into a CommerceError. */
export declare function toCommerceError(status: number, body: unknown, headers?: Headers): CommerceError;
export declare function parseRetryAfter(v: string | null | undefined): number | undefined;
export declare const friendlyMessage: (code: CommerceErrorCode) => string | undefined;
