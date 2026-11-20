import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
	return (
		<div className="container-page py-24 text-center">
			<p className="eyebrow">404</p>
			<h1 className="mt-2 text-4xl">We couldn&rsquo;t find that page</h1>
			<p className="mt-3 text-muted-foreground">It may have moved or sold out.</p>
			<Link href="/products" className={buttonVariants({ className: "mt-8 h-11" })}>Browse the shop</Link>
		</div>
	);
}
