"use client";

import { CommerceProvider } from "@commerce-engine/sdk/react";
import { Toaster } from "@/components/ui/sonner";
import { getCommerce } from "@/lib/commerce";
import { CartUIProvider } from "./cart-ui";
import { CartDrawer } from "./cart-drawer";
import { ServiceWorker } from "./service-worker";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<CommerceProvider client={getCommerce()}>
			<CartUIProvider>
				{children}
				<CartDrawer />
				<Toaster position="top-center" />
				<ServiceWorker />
			</CartUIProvider>
		</CommerceProvider>
	);
}
