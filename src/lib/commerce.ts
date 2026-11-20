"use client";

import { createCommerce, type Commerce } from "@commerce-engine/sdk";
import { COMMERCE_URL } from "./config";

let client: Commerce | null = null;

/** One SDK instance per browser tab (cart/token live in first-party cookies, so the server can read them too). */
export function getCommerce(): Commerce {
	return (client ??= createCommerce({ baseUrl: COMMERCE_URL }));
}
