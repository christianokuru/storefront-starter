/** The engine this storefront talks to. Set NEXT_PUBLIC_COMMERCE_URL per client (defaults to a local engine). */
export const COMMERCE_URL = (process.env.NEXT_PUBLIC_COMMERCE_URL || "http://localhost:3000").replace(/\/+$/, "");

/** Copy that's specific to this client's brand. Change freely. */
export const BRAND = {
	tagline: process.env.NEXT_PUBLIC_STORE_TAGLINE || "Considered pieces, made to last.",
	locale: process.env.NEXT_PUBLIC_LOCALE || "en-NG",
};
