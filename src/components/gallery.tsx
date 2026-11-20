"use client";

import { useState } from "react";
import type { ProductImage as Img } from "@commerce-engine/sdk";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";

/** Swipeable on phones (scroll-snap), thumbnails on larger screens. */
export function Gallery({ images, title }: { images: Img[]; title: string }) {
	const [active, setActive] = useState(0);
	if (!images.length) return <ProductImage src={null} alt={title} className="rounded-xl" />;
	return (
		<div className="space-y-3">
			<div
				className="flex snap-x snap-mandatory overflow-x-auto rounded-xl [scrollbar-width:none] sm:hidden"
				onScroll={(e) => setActive(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
			>
				{images.map((img, i) => (
					<div key={img.id} className="w-full shrink-0 snap-center"><ProductImage src={img.url} alt={img.alt ?? title} priority={i === 0} /></div>
				))}
			</div>
			{images.length > 1 && (
				<div className="flex justify-center gap-1.5 sm:hidden" aria-hidden>
					{images.map((img, i) => <span key={img.id} className={cn("size-1.5 rounded-full bg-border", i === active && "bg-foreground")} />)}
				</div>
			)}
			<div className="hidden sm:block">
				<ProductImage src={images[active]?.url} alt={images[active]?.alt ?? title} priority className="rounded-xl" />
				{images.length > 1 && (
					<div className="mt-3 grid grid-cols-5 gap-3">
						{images.map((img, i) => (
							<button key={img.id} type="button" onClick={() => setActive(i)} aria-label={`Show image ${i + 1}`} aria-current={i === active}
								className={cn("overflow-hidden rounded-md ring-offset-2 transition", i === active ? "ring-2 ring-foreground" : "opacity-70 hover:opacity-100")}>
								<ProductImage src={img.url} alt="" />
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
