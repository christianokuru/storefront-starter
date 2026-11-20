export default function Loading() {
	return (
		<div className="container-page py-8 sm:py-12" aria-busy="true" aria-label="Loading products">
			<div className="h-9 w-48 animate-pulse rounded bg-muted" />
			<ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
				{Array.from({ length: 8 }, (_, i) => <li key={i}><div className="aspect-[4/5] animate-pulse rounded-lg bg-muted" /><div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-muted" /></li>)}
			</ul>
		</div>
	);
}
