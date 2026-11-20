import { isCommerceError } from "@commerce-engine/sdk";

/** A message that's safe and useful to show a shopper. */
export function errorMessage(e: unknown, fallback = "Something went wrong. Please try again.") {
	if (isCommerceError(e)) {
		if (e.code === "rate_limited") return e.retryAfter ? `Too many attempts. Try again in ${e.retryAfter}s.` : "Too many attempts. Please wait a moment.";
		if (e.code === "invalid_data" && Array.isArray(e.details) && e.details.length) {
			const first = e.details[0] as { path?: string; message?: string };
			return first?.path ? `Please check ${first.path.replace(/([A-Z])/g, " $1").toLowerCase()}.` : e.message;
		}
		return e.message || fallback;
	}
	return fallback;
}
