import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { toMajor } from "@commerce-engine/sdk";
import { Gallery } from "@/components/gallery";
import { Purchase } from "@/components/purchase";
import { serverCommerce, storeInfo } from "@/lib/commerce-server";

const load = cache(async (handle: string) => (await serverCommerce()).products.get(decodeURIComponent(handle)).catch(() => null));

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
	const p = await load((await params).handle);
	if (!p) return { title: "Not found" };
	const image = p.thumbnail ?? p.images[0]?.url;
	const description = p.description?.slice(0, 160) ?? p.subtitle ?? undefined;
	return {
		title: p.title,
		description,
		alternates: { canonical: `/products/${p.handle}` },
		// Social previews need a real https image (not data: URLs).
		openGraph: { title: p.title, description, images: image?.startsWith("http") ? [image] : undefined },
	};
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
	const product = await load((await params).handle);
	if (!product) notFound();
	const { currency, settings } = await storeInfo();
	const offers = product.variants.filter((v) => v.price);
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Product",
		name: product.title,
		description: product.description ?? undefined,
		sku: product.variants[0]?.sku ?? undefined,
		image: product.images.map((i) => i.url).filter((u) => u.startsWith("http")),
		brand: settings?.name ? { "@type": "Brand", name: settings.name } : undefined,
		offers: offers.map((v) => ({
			"@type": "Offer",
			price: toMajor(v.price!.amount, currency).toFixed(2),
			priceCurrency: currency,
			availability: v.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
			sku: v.sku ?? undefined,
		})),
	};

	return (
		<div className="container-page py-6 sm:py-10">
			<nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
				<Link href="/products" className="hover:text-foreground">Shop</Link> <span aria-hidden>/</span> <span className="text-foreground">{product.title}</span>
			</nav>
			<div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
				<Gallery images={product.images} title={product.title} />
				<div className="lg:sticky lg:top-24 lg:self-start">
					<h1 className="text-3xl sm:text-4xl">{product.title}</h1>
					{product.subtitle && <p className="mt-1 text-muted-foreground">{product.subtitle}</p>}
					<div className="mt-6"><Purchase product={product} currency={currency} /></div>
					{product.description && (
						<div className="mt-10 border-t pt-6">
							<h2 className="font-sans text-sm font-medium">Details</h2>
							<p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{product.description}</p>
						</div>
					)}
				</div>
			</div>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
		</div>
	);
}
