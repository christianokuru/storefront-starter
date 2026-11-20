import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { createCommerce, readOnlyStorage, type StoreConfig } from "@commerce-engine/sdk";
import { COMMERCE_URL } from "./config";

/** Per-request SDK for server components: reads the shopper's currency/cart cookies, never writes. */
export const serverCommerce = cache(async () => {
	const jar = await cookies();
	return createCommerce({ baseUrl: COMMERCE_URL, storage: readOnlyStorage((k) => jar.get(k)?.value) });
});

/** Store settings + features for server components (cached per request, revalidated every minute). */
export const storeInfo = cache(async () => {
	const c = await serverCommerce();
	const [settings, config] = await Promise.all([
		c.store.settings().catch(() => null),
		c.store.config().catch((): StoreConfig => ({ region: "africa", features: [] })),
	]);
	return { settings, features: config.features, currency: (await c.currency.get()) ?? settings?.defaultCurrency ?? "NGN" };
});
