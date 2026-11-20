import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product-card";
import { SearchBox } from "@/components/search-box";
import { serverCommerce, storeInfo } from "@/lib/commerce-server";
import { cn } from "@/lib/utils";

const PAGE = 12;
type SP = { q?: string; category?: string; collection?: string; page?: string; focus?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
	const sp = await searchParams;
	return { title: sp.q ? `Search: ${sp.q}` : "Shop all" };
}

export default async function Products({ searchParams }: { searchParams: Promise<SP> }) {
	const sp = await searchParams;
	const page = Math.max(1, Math.min(500, Number.parseInt(sp.page ?? "1", 10) || 1));
	const c = await serverCommerce();
	const { currency } = await storeInfo();
	const [result, categories, collections] = await Promise.all([
		c.products.list({ q: sp.q, category: sp.category, collection: sp.collection, limit: PAGE, offset: (page - 1) * PAGE }).catch(() => null),
		c.categories.list().catch(() => []),
		c.collections.list().catch(() => []),
	]);
	const active = categories.find((x) => x.handle === sp.category) ?? null;
	const collection = collections.find((x) => x.handle === sp.collection) ?? null;
	const title = sp.q ? `“${sp.q}”` : (active?.name ?? collection?.title ?? "Shop all");
	const pages = result ? Math.ceil(result.count / PAGE) : 0;
	const href = (o: Partial<SP>) => {
		const p = new URLSearchParams();
		for (const [k, v] of Object.entries({ q: sp.q, category: sp.category, collection: sp.collection, ...o })) if (v) p.set(k, String(v));
		const s = p.toString();
		return `/products${s ? `?${s}` : ""}`;
	};

	return (
		<div className="container-page py-8 sm:py-12">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="eyebrow">{sp.q ? "Search" : "Shop"}</p>
					<h1 className="mt-1 text-3xl sm:text-4xl">{title}</h1>
					{result && <p className="mt-1 text-sm text-muted-foreground">{result.count} {result.count === 1 ? "item" : "items"}</p>}
				</div>
				<Suspense><SearchBox defaultValue={sp.q ?? ""} autoFocus={sp.focus === "search"} /></Suspense>
			</div>

			<nav aria-label="Filter by category" className="mt-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
				<Link href={href({ category: undefined, page: undefined })} className={cn("rounded-full border px-4 py-1.5 text-sm whitespace-nowrap", !sp.category && "border-foreground bg-foreground text-background")}>All</Link>
				{categories.filter((x) => !x.parentId).map((cat) => (
					<Link key={cat.id} href={href({ category: cat.handle, page: undefined })} aria-current={sp.category === cat.handle ? "page" : undefined}
						className={cn("rounded-full border px-4 py-1.5 text-sm whitespace-nowrap", sp.category === cat.handle && "border-foreground bg-foreground text-background")}>{cat.name}</Link>
				))}
			</nav>

			<div className="mt-8">
				{result === null ? (
					<p className="rounded-lg border p-6 text-sm text-muted-foreground">We couldn&rsquo;t load products. Please refresh.</p>
				) : result.products.length === 0 ? (
					<div className="rounded-lg border p-10 text-center">
						<p className="text-sm text-muted-foreground">Nothing found{sp.q ? ` for “${sp.q}”` : ""}.</p>
						<Link href="/products" className="mt-3 inline-block text-sm underline">Clear filters</Link>
					</div>
				) : (
					<ProductGrid products={result.products} currency={currency} />
				)}
			</div>

			{pages > 1 && (
				<nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-4 text-sm">
					{page > 1 ? <Link href={href({ page: String(page - 1) })} className="underline">Previous</Link> : <span className="text-muted-foreground">Previous</span>}
					<span className="tabular-nums">Page {page} of {pages}</span>
					{page < pages ? <Link href={href({ page: String(page + 1) })} className="underline">Next</Link> : <span className="text-muted-foreground">Next</span>}
				</nav>
			)}
		</div>
	);
}
