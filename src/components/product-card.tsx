import Link from "next/link";
import type { Product } from "@commerce-engine/sdk";
import { Price } from "./price";
import { ProductImage } from "./product-image";

/** Lowest price among variants that have one in this currency. */
export function fromPrice(p: Product) {
	const priced = p.variants.filter((v) => v.price).sort((a, b) => a.price!.amount - b.price!.amount);
	return priced[0]?.price ?? null;
}

export function ProductCard({ product, currency, priority }: { product: Product; currency: string; priority?: boolean }) {
	const price = fromPrice(product);
	const soldOut = product.variants.length > 0 && product.variants.every((v) => !v.inStock);
	const many = new Set(product.variants.map((v) => v.price?.amount)).size > 1;
	return (
		<Link href={`/products/${product.handle}`} className="group block focus-visible:outline-2 focus-visible:outline-offset-4">
			<div className="relative overflow-hidden rounded-lg">
				<ProductImage src={product.thumbnail ?? product.images[0]?.url} alt={product.title} priority={priority} className="transition-transform duration-500 group-hover:scale-[1.03]" />
				{soldOut && <span className="absolute top-2 left-2 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium">Sold out</span>}
				{!soldOut && price?.compareAtAmount && price.compareAtAmount > price.amount && (
					<span className="absolute top-2 left-2 rounded-full bg-destructive px-2.5 py-1 text-xs font-medium text-white">Sale</span>
				)}
			</div>
			<div className="mt-3 flex items-start justify-between gap-3">
				<div className="min-w-0">
					<h3 className="truncate font-sans text-sm font-medium">{product.title}</h3>
					{product.subtitle && <p className="truncate text-xs text-muted-foreground">{product.subtitle}</p>}
				</div>
				<p className="shrink-0 text-sm">
					{many && <span className="text-xs text-muted-foreground">From </span>}
					<Price amount={price?.amount} compareAt={price?.compareAtAmount} currency={currency} />
				</p>
			</div>
		</Link>
	);
}

export function ProductGrid({ products, currency }: { products: Product[]; currency: string }) {
	return (
		<ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
			{products.map((p, i) => (
				<li key={p.id}><ProductCard product={p} currency={currency} priority={i < 4} /></li>
			))}
		</ul>
	);
}
