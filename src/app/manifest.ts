import type { MetadataRoute } from "next";
import { storeInfo } from "@/lib/commerce-server";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
	const name = (await storeInfo().catch(() => null))?.settings?.name ?? "Store";
	return {
		name,
		short_name: name.slice(0, 12),
		start_url: "/",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#ffffff",
		icons: [
			{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
			{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
			{ src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
		],
	};
}
