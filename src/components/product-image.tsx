/* eslint-disable @next/next/no-img-element -- images come from the engine (R2/remote/data URLs); plain <img> works everywhere incl. Workers */
import { cn } from "@/lib/utils";

export function ProductImage({ src, alt, className, priority }: { src: string | null | undefined; alt: string; className?: string; priority?: boolean }) {
	if (!src) return <div aria-hidden className={cn("grid aspect-[4/5] place-items-center bg-muted text-muted-foreground", className)}><span className="text-3xl">{alt.charAt(0)}</span></div>;
	return (
		<img
			src={src}
			alt={alt}
			width={600}
			height={750}
			loading={priority ? "eager" : "lazy"}
			fetchPriority={priority ? "high" : "auto"}
			decoding="async"
			className={cn("aspect-[4/5] w-full bg-muted object-cover", className)}
		/>
	);
}
