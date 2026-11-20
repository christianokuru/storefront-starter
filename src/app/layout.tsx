import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { storeInfo } from "@/lib/commerce-server";
import { BRAND } from "@/lib/config";

// BRAND: swap these two fonts per client.
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
	const name = (await storeInfo()).settings?.name ?? "Store";
	return {
		title: { default: name, template: `%s · ${name}` },
		description: BRAND.tagline,
		applicationName: name,
		manifest: "/manifest.webmanifest",
		icons: { icon: "/icons/icon.svg", apple: "/icons/apple-touch-icon.png" },
		appleWebApp: { capable: true, title: name, statusBarStyle: "default" },
		openGraph: { siteName: name, type: "website" },
	};
}

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={`${body.variable} ${display.variable}`}>
			<body className="flex min-h-dvh flex-col font-sans">
				<a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-background focus:px-3 focus:py-2">Skip to content</a>
				<Providers>
					<Header />
					<main id="main" className="flex-1">{children}</main>
					<Footer />
				</Providers>
			</body>
		</html>
	);
}
