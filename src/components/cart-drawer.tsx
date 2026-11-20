"use client";

import Link from "next/link";
import { useCart } from "@commerce-engine/sdk/react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import { Price } from "./price";
import { CartLines } from "./cart-lines";
import { useCartUI } from "./cart-ui";

export function CartDrawer() {
	const { open, setOpen } = useCartUI();
	const { cart, count } = useCart();
	const close = () => setOpen(false);
	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
				<SheetHeader className="border-b px-5 py-4">
					<SheetTitle className="font-heading text-lg">Your bag {count > 0 && <span className="text-muted-foreground">({count})</span>}</SheetTitle>
					<SheetDescription className="sr-only">Items in your shopping bag</SheetDescription>
				</SheetHeader>
				<div className="flex-1 overflow-y-auto px-5">{cart === undefined ? <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p> : cart ? <CartLines onNavigate={close} /> : <EmptyBag onNavigate={close} />}</div>
				{cart && cart.items.length > 0 && (
					<div className="space-y-3 border-t px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
						<div className="flex justify-between text-sm"><span>Subtotal</span><Price amount={cart.totals.subtotal} currency={cart.currencyCode} className="font-medium" /></div>
						<p className="text-xs text-muted-foreground">Shipping and discounts are calculated at checkout.</p>
						<Link href="/checkout" onClick={close} className={buttonVariants({ className: "h-11 w-full" })}>Checkout</Link>
						<Link href="/cart" onClick={close} className={buttonVariants({ variant: "outline", className: "h-11 w-full" })}>View bag</Link>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}

function EmptyBag({ onNavigate }: { onNavigate: () => void }) {
	return (
		<div className="py-16 text-center">
			<p className="text-sm text-muted-foreground">Your bag is empty.</p>
			<Link href="/products" onClick={onNavigate} className={buttonVariants({ variant: "outline", className: "mt-4" })}>Start shopping</Link>
		</div>
	);
}
