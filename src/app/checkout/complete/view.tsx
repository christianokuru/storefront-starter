"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useCommerce, useStoreConfig } from "@commerce-engine/sdk/react";
import { buttonVariants } from "@/components/ui/button";

type Result = Awaited<ReturnType<ReturnType<typeof useCommerce>["checkout"]["handleReturn"]>>;

export function CompleteView() {
	const commerce = useCommerce();
	const params = useSearchParams();
	const { has } = useStoreConfig();
	const [r, setR] = useState<Result | null>(null);
	const done = useRef(false);

	useEffect(() => {
		if (done.current) return; // React strict mode runs effects twice in dev
		done.current = true;
		commerce.checkout.handleReturn(new URLSearchParams(params)).then(setR);
	}, [commerce, params]);

	if (!r) return <p className="text-center text-sm text-muted-foreground">Checking your payment…</p>;

	const view = {
		succeeded: { icon: <CheckCircle2 className="size-10 text-success" />, title: "Thank you! Your order is confirmed.", body: "A confirmation email is on its way with your receipt." },
		pending: { icon: <Clock className="size-10" />, title: "Payment processing", body: "Your bank is still confirming the payment. You'll get an email as soon as it's done; there's no need to pay again." },
		requires_action: { icon: <Clock className="size-10" />, title: "We're reviewing your payment", body: "Your payment was received but needs a quick check by the store. They'll be in touch by email." },
		failed: { icon: <XCircle className="size-10 text-destructive" />, title: "Payment didn't go through", body: "You haven't been charged. Your bag is saved, so you can try again or use another method." },
		canceled: { icon: <XCircle className="size-10" />, title: "Payment cancelled", body: "No problem. Your bag is saved." },
		invalid: { icon: <XCircle className="size-10 text-destructive" />, title: "We couldn't read that payment", body: "If you were charged, contact the store with your bank reference." },
		error: { icon: <XCircle className="size-10 text-destructive" />, title: "Something went wrong", body: "We couldn't confirm your payment just now. If you were charged, you'll get a confirmation email shortly." },
	}[r.status];

	return (
		<div className="mx-auto max-w-lg text-center" data-testid={`complete-${r.status}`}>
			<div className="flex justify-center">{view.icon}</div>
			<h1 className="mt-4 text-3xl sm:text-4xl">{view.title}</h1>
			{r.orderNumber && <p className="mt-3 text-lg">Order <span className="font-medium tabular-nums">#{r.orderNumber}</span></p>}
			<p className="mt-3 text-muted-foreground">{view.body}</p>
			{r.reference && r.status !== "succeeded" && <p className="mt-2 font-mono text-xs text-muted-foreground">Reference: {r.reference}</p>}
			<div className="mt-8 flex flex-wrap justify-center gap-3">
				{r.status === "succeeded" ? (
					<>
						<Link href="/products" className={buttonVariants({ className: "h-11" })}>Continue shopping</Link>
						{has("customerAccounts") && <Link href="/account" className={buttonVariants({ variant: "outline", className: "h-11" })}>View my orders</Link>}
					</>
				) : (
					<>
						<Link href="/checkout" className={buttonVariants({ className: "h-11" })}>Back to checkout</Link>
						<Link href="/cart" className={buttonVariants({ variant: "outline", className: "h-11" })}>View bag</Link>
					</>
				)}
			</div>
		</div>
	);
}
