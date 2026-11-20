"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Order } from "@commerce-engine/sdk";
import { useCommerce } from "@commerce-engine/sdk/react";
import { AccountShell, fmtDate, statusLabel } from "@/components/account-shell";
import { Price } from "@/components/price";
import { ProductImage } from "@/components/product-image";

export default function OrderPage() {
	return <AccountShell><OrderDetail /></AccountShell>;
}

function OrderDetail() {
	const { id } = useParams<{ id: string }>();
	const commerce = useCommerce();
	const [order, setOrder] = useState<Order | null | undefined>(undefined);
	useEffect(() => { commerce.customer.orders.get(id).then(setOrder, () => setOrder(null)); }, [commerce, id]);
	if (order === undefined) return <p className="text-sm text-muted-foreground">Loading…</p>;
	if (!order) return <p className="text-sm">Order not found. <Link href="/account" className="underline">Back to orders</Link></p>;
	const a = order.shippingAddress;
	const row = (l: string, v: number, neg = false) => <div className="flex justify-between"><span>{l}</span><span>{neg && v > 0 && "−"}<Price amount={v} currency={order.currencyCode} /></span></div>;
	return (
		<div className="grid gap-8 lg:grid-cols-[1fr_320px]">
			<div>
				<Link href="/account" className="text-sm text-muted-foreground underline">← All orders</Link>
				<h2 className="mt-3 text-2xl">Order #{order.displayId}</h2>
				<p className="text-sm text-muted-foreground">{fmtDate(order.createdAt)} · {order.status === "canceled" ? "Cancelled" : statusLabel[order.fulfillmentStatus]}</p>
				{order.trackingNumber && <p className="mt-2 text-sm">Tracking: <span className="font-medium">{order.carrier} {order.trackingNumber}</span></p>}
				<ul className="mt-6 divide-y border-y">
					{order.items?.map((i) => (
						<li key={i.id} className="flex items-center gap-3 py-3">
							<div className="w-14 shrink-0 overflow-hidden rounded-md"><ProductImage src={i.thumbnail} alt={i.title} /></div>
							<div className="min-w-0 flex-1"><p className="truncate text-sm">{i.title}</p><p className="text-xs text-muted-foreground">{i.variantTitle !== "Default" && `${i.variantTitle} · `}Qty {i.quantity}</p></div>
							<Price amount={i.total} currency={order.currencyCode} className="text-sm" />
						</li>
					))}
				</ul>
			</div>
			<aside className="h-fit space-y-2 rounded-xl border p-5 text-sm">
				{row("Subtotal", order.subtotal)}
				{order.discountTotal > 0 && row(`Discount${order.promotion ? ` (${order.promotion.code})` : ""}`, order.discountTotal, true)}
				{row(`Shipping${order.shippingMethod ? ` · ${order.shippingMethod.name}` : ""}`, order.shippingTotal)}
				{order.taxTotal > 0 && row(order.taxInclusive ? "Tax (included)" : "Tax", order.taxTotal)}
				<div className="flex justify-between border-t pt-2 text-base font-medium"><span>Total</span><Price amount={order.total} currency={order.currencyCode} /></div>
				{order.refundedTotal > 0 && row("Refunded", order.refundedTotal, true)}
				{a && <div className="border-t pt-3 text-muted-foreground"><p className="text-foreground">Delivering to</p>{a.firstName} {a.lastName}<br />{a.address1}{a.address2 ? `, ${a.address2}` : ""}<br />{a.city}, {a.countryCode}</div>}
			</aside>
		</div>
	);
}
