"use client";

import Link from "next/link";
import { useCart } from "@commerce-engine/sdk/react";
import { buttonVariants } from "@/components/ui/button";
import { CartLines } from "@/components/cart-lines";
import { OrderSummary } from "@/components/order-summary";

export default function CartPage() {
	const { cart, count } = useCart();
	return (
		<div className="container-page py-8 sm:py-12">
			<h1 className="text-3xl sm:text-4xl">Your bag {count > 0 && <span className="text-muted-foreground">({count})</span>}</h1>
			{cart === undefined ? (
				<p className="mt-10 text-sm text-muted-foreground">Loading…</p>
			) : !cart || cart.items.length === 0 ? (
				<div className="mt-10 rounded-lg border p-10 text-center">
					<p className="text-sm text-muted-foreground">Your bag is empty.</p>
					<Link href="/products" className={buttonVariants({ className: "mt-4" })}>Start shopping</Link>
				</div>
			) : (
				<div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
					<CartLines />
					<aside className="h-fit rounded-xl border p-5 lg:sticky lg:top-24">
						<OrderSummary cart={cart} compact />
						<Link href="/checkout" className={buttonVariants({ className: "mt-5 h-12 w-full" })}>Checkout</Link>
					</aside>
				</div>
			)}
		</div>
	);
}
