import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const engine = new URL(process.env.NEXT_PUBLIC_COMMERCE_URL || "http://localhost:3000").origin;

const csp = [
	"default-src 'self'",
	`script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
	"style-src 'self' 'unsafe-inline'",
	`img-src 'self' data: blob: https: ${engine}`,
	"font-src 'self' data:",
	`connect-src 'self' ${engine}${isDev ? " ws:" : ""}`,
	"frame-ancestors 'none'",
	"base-uri 'self'",
	"object-src 'none'",
	"form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
	poweredByHeader: false,
	transpilePackages: ["@commerce-engine/sdk"],
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{ key: "Content-Security-Policy", value: csp },
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
					{ key: "X-Frame-Options", value: "DENY" },
					{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
				],
			},
		];
	},
};

export default nextConfig;

// Lets `next dev` use Cloudflare bindings locally (same as the engine).
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
