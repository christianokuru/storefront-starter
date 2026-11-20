import type { Http } from "./http.js";
import type { Session, User } from "./types.js";
type Listener = (signedIn: boolean) => void;
/**
 * Customer sign-in for headless storefronts (Better Auth on the engine).
 *
 * Token mode (default): the engine returns a session token in the `set-auth-token` header; the SDK stores it and
 * sends `Authorization: Bearer …`. Works across domains. Cookie mode: storefront and engine share a site and the
 * engine's own session cookie is used (`credentials: "include"`).
 */
export declare class AuthApi {
    private http;
    private tokens;
    private mode;
    private listeners;
    constructor(http: Http, tokens: {
        get(): Promise<string | null>;
        set(t: string): Promise<void>;
        clear(): Promise<void>;
    }, mode: "token" | "cookie");
    onChange: (fn: Listener) => () => undefined;
    /** @internal */
    emit(signedIn: boolean): void;
    /** Cheap local check (token present). Use `session()` for the truth. */
    hasToken(): Promise<boolean>;
    /**
     * Create an account. The engine requires email verification, so the customer is NOT signed in yet:
     * show "check your email". `callbackURL` is where the verification link lands (must be an allowed storefront origin).
     */
    signUp(input: {
        name: string;
        email: string;
        password: string;
        callbackURL?: string;
    }): Promise<{
        user: User;
        verificationRequired: boolean;
    }>;
    signIn(input: {
        email: string;
        password: string;
        rememberMe?: boolean;
    }): Promise<User>;
    /** Always clears the local session, even if the network call fails. */
    signOut(): Promise<void>;
    /** Current session, or null (expired tokens are cleared). */
    session(opts?: {
        signal?: AbortSignal;
    }): Promise<Session | null>;
    /** Sends a reset link; `redirectTo` is your storefront's reset page (receives `?token=`). Always succeeds to avoid revealing which emails exist. */
    requestPasswordReset(email: string, redirectTo: string): Promise<void>;
    resetPassword(token: string, newPassword: string): Promise<void>;
    sendVerificationEmail(email: string, callbackURL?: string): Promise<void>;
    changePassword(currentPassword: string, newPassword: string, opts?: {
        revokeOtherSessions?: boolean;
    }): Promise<{
        token?: string | null;
    }>;
}
export {};
