import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ProductGrid } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { serverCommerce, storeInfo } from "@/lib/commerce-server";
import { BRAND } from "@/lib/config";

export default async function Home() {
	const c = await serverCommerce();
	const { settings, currency } = await storeInfo();
	const [latest, categories, collections] = await Promise.all([
		c.products.list({ limit: 8 }).catch(() => null),
		c.categories.list().catch(() => []),
		c.collections.list().catch(() => []),
	]);
	const featured = collections[0];
	const featuredProducts = featured ? await c.products.list({ collection: featured.handle, limit: 4 }).catch(() => null) : null;
	const hero = latest?.products[0];

	return (
		<>
			<section className="container-page grid items-center gap-8 py-10 sm:py-16 lg:grid-cols-2 lg:gap-16">
				<div className="order-2 lg:order-1">
					<p className="eyebrow">{settings?.name ?? "Welcome"}</p>
					<h1 className="mt-3 text-4xl leading-[1.05] sm:text-6xl">{BRAND.tagline}</h1>
					<div className="mt-8 flex flex-wrap gap-3">
						<Link href="/products" className={buttonVariants({ className: "h-11 px-6" })}>Shop now</Link>
						{featured && <Link href={`/products?collection=${featured.handle}`} className={buttonVariants({ variant: "outline", className: "h-11 px-6" })}>{featured.title}</Link>}
					</div>
				</div>
				{hero && (
					<Link href={`/products/${hero.handle}`} className="order-1 overflow-hidden rounded-xl lg:order-2" aria-label={hero.title}>
						<ProductImage src={hero.thumbnail ?? hero.images[0]?.url} alt={hero.title} priority className="aspect-[4/3] sm:aspect-[16/11]" />
					</Link>
				)}
			</section>

			{categories.length > 0 && (
				<section className="container-page" aria-labelledby="cats">
					<h2 id="cats" className="sr-only">Categories</h2>
					<ul className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
						{categories.filter((x) => !x.parentId).map((cat) => (
							<li key={cat.id}><Link href={`/products?category=${cat.handle}`} className="block rounded-full border px-4 py-2 text-sm whitespace-nowrap hover:bg-muted">{cat.name}</Link></li>
						))}
					</ul>
				</section>
			)}

			{featured && featuredProducts && featuredProducts.products.length > 0 && (
				<section className="container-page mt-14" aria-labelledby="featured">
					<div className="mb-6 flex items-end justify-between gap-4">
						<div>
							<h2 id="featured" className="text-2xl sm:text-3xl">{featured.title}</h2>
							{featured.description && <p className="mt-1 text-sm text-muted-foreground">{featured.description}</p>}
						</div>
						<Link href={`/products?collection=${featured.handle}`} className="text-sm underline underline-offset-4">View all</Link>
					</div>
					<ProductGrid products={featuredProducts.products} currency={currency} />
				</section>
			)}

			<section className="container-page mt-14" aria-labelledby="latest">
				<div className="mb-6 flex items-end justify-between">
					<h2 id="latest" className="text-2xl sm:text-3xl">Latest</h2>
					<Link href="/products" className="text-sm underline underline-offset-4">Shop all</Link>
				</div>
				{latest === null ? (
					<p className="rounded-lg border p-6 text-sm text-muted-foreground">The shop is unavailable right now. Please try again shortly.</p>
				) : latest.products.length ? (
					<ProductGrid products={latest.products} currency={currency} />
				) : (
					<p className="rounded-lg border p-6 text-sm text-muted-foreground">New products are on the way.</p>
				)}
			</section>
		</>
	);
}
