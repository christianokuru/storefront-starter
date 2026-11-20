"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { OrderList } from "@commerce-engine/sdk";
import { useCommerce, useCustomer } from "@commerce-engine/sdk/react";
import { AccountShell, fmtDate, statusLabel } from "@/components/account-shell";
import { Price } from "@/components/price";

export default function AccountPage() {
	return <AccountShell><Orders /></AccountShell>;
}

function Orders() {
	const commerce = useCommerce();
	const { customer } = useCustomer();
	const [data, setData] = useState<OrderList | null>(null);
	const [error, setError] = useState(false);
	useEffect(() => { if (customer) commerce.customer.orders.list({ limit: 50 }).then(setData, () => setError(true)); }, [commerce, customer]);
	if (error) return <p className="text-sm text-destructive">We couldn&rsquo;t load your orders. Please refresh.</p>;
	if (!data) return <p className="text-sm text-muted-foreground">Loading orders…</p>;
	if (!data.orders.length) return <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">No orders yet. <Link href="/products" className="underline">Start shopping</Link></div>;
	return (
		<ul className="divide-y rounded-lg border">
			{data.orders.map((o) => (
				<li key={o.id}>
					<Link href={`/account/orders/${o.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50">
						<div>
							<p className="font-medium">Order #{o.displayId}</p>
							<p className="text-xs text-muted-foreground">{fmtDate(o.createdAt)} · {o.status === "canceled" ? "Cancelled" : (statusLabel[o.fulfillmentStatus] ?? o.fulfillmentStatus)}</p>
						</div>
						<Price amount={o.total} currency={o.currencyCode} className="text-sm" />
					</Link>
				</li>
			))}
		</ul>
	);
}
