"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SearchBox({ defaultValue, autoFocus }: { defaultValue: string; autoFocus?: boolean }) {
	const router = useRouter();
	const params = useSearchParams();
	const [q, setQ] = useState(defaultValue);
	return (
		<form
			role="search"
			className="relative w-full sm:w-72"
			onSubmit={(e) => {
				e.preventDefault();
				const p = new URLSearchParams(params);
				p.delete("page");
				p.delete("focus");
				if (q.trim()) p.set("q", q.trim()); else p.delete("q");
				router.push(`/products${p.size ? `?${p}` : ""}`);
			}}
		>
			<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
			<input
				type="search"
				name="q"
				value={q}
				onChange={(e) => setQ(e.target.value)}
				maxLength={100}
				placeholder="Search products"
				aria-label="Search products"
				autoFocus={autoFocus}
				enterKeyHint="search"
				className="h-11 w-full rounded-md border bg-background pr-3 pl-9 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:text-sm"
			/>
		</form>
	);
}
