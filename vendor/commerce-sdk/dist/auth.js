import { CommerceError, isCommerceError } from "./errors.js";
/**
 * Customer sign-in for headless storefronts (Better Auth on the engine).
 *
 * Token mode (default): the engine returns a session token in the `set-auth-token` header; the SDK stores it and
 * sends `Authorization: Bearer …`. Works across domains. Cookie mode: storefront and engine share a site and the
 * engine's own session cookie is used (`credentials: "include"`).
 */
export class AuthApi {
    http;
    tokens;
    mode;
    listeners = new Set();
    constructor(http, tokens, mode) {
        this.http = http;
        this.tokens = tokens;
        this.mode = mode;
    }
    onChange = (fn) => {
        this.listeners.add(fn);
        return () => void this.listeners.delete(fn);
    };
    /** @internal */
    emit(signedIn) {
        for (const l of this.listeners)
            l(signedIn);
    }
    /** Cheap local check (token present). Use `session()` for the truth. */
    async hasToken() {
        return this.mode === "cookie" ? true : Boolean(await this.tokens.get());
    }
    /**
     * Create an account. The engine requires email verification, so the customer is NOT signed in yet:
     * show "check your email". `callbackURL` is where the verification link lands (must be an allowed storefront origin).
     */
    async signUp(input) {
        const name = input.name.trim();
        const email = input.email.trim().toLowerCase();
        if (!name)
            throw new CommerceError("invalid_data", "Enter your name");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            throw new CommerceError("invalid_data", "Enter a valid email address");
        if (input.password.length < 8)
            throw new CommerceError("weak_password", "Use at least 8 characters");
        const r = await this.http.request("/api/auth/sign-up/email", {
            method: "POST", auth: false, body: { name, email, password: input.password, ...(input.callbackURL ? { callbackURL: input.callbackURL } : {}) },
        });
        if (r.token)
            this.emit(true);
        return { user: r.user, verificationRequired: !r.token };
    }
    async signIn(input) {
        const r = await this.http.request("/api/auth/sign-in/email", {
            method: "POST", auth: false, body: { email: input.email.trim().toLowerCase(), password: input.password, rememberMe: input.rememberMe ?? true },
        });
        // Token was captured from the `set-auth-token` header by the HTTP layer.
        if (this.mode === "token" && !(await this.tokens.get()))
            throw new CommerceError("origin_not_allowed", "Signed in, but the store didn't share a session token with this site. Check STORE_CORS on the engine.");
        this.emit(true);
        return r.user;
    }
    /** Always clears the local session, even if the network call fails. */
    async signOut() {
        try {
            await this.http.request("/api/auth/sign-out", { method: "POST", auth: true, body: {} });
        }
        catch {
            /* offline or already expired: signing out locally is what matters */
        }
        finally {
            await this.tokens.clear();
            this.emit(false);
        }
    }
    /** Current session, or null (expired tokens are cleared). */
    async session(opts = {}) {
        if (!(await this.hasToken()))
            return null;
        try {
            const s = await this.http.request("/api/auth/get-session", { auth: true, signal: opts.signal });
            if (!s) {
                if (this.mode === "token") {
                    await this.tokens.clear();
                    this.emit(false);
                }
                return null;
            }
            return s;
        }
        catch (e) {
            if (isCommerceError(e, "unauthorized"))
                return null;
            throw e;
        }
    }
    /** Sends a reset link; `redirectTo` is your storefront's reset page (receives `?token=`). Always succeeds to avoid revealing which emails exist. */
    async requestPasswordReset(email, redirectTo) {
        await this.http.request("/api/auth/request-password-reset", { method: "POST", body: { email: email.trim().toLowerCase(), redirectTo } });
    }
    async resetPassword(token, newPassword) {
        if (!token)
            throw new CommerceError("invalid_token", "This reset link is invalid or has expired");
        if (newPassword.length < 8)
            throw new CommerceError("weak_password", "Use at least 8 characters");
        await this.http.request("/api/auth/reset-password", { method: "POST", body: { token, newPassword } });
    }
    async sendVerificationEmail(email, callbackURL) {
        await this.http.request("/api/auth/send-verification-email", { method: "POST", body: { email: email.trim().toLowerCase(), ...(callbackURL ? { callbackURL } : {}) } });
    }
    async changePassword(currentPassword, newPassword, opts = {}) {
        if (newPassword.length < 8)
            throw new CommerceError("weak_password", "Use at least 8 characters");
        const r = await this.http.request("/api/auth/change-password", {
            method: "POST", auth: true, body: { currentPassword, newPassword, revokeOtherSessions: opts.revokeOtherSessions ?? true },
        });
        return r;
    }
}
