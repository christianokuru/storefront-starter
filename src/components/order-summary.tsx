import type { Cart } from "@commerce-engine/sdk";
import { Price } from "./price";
import { ProductImage } from "./product-image";

export function OrderSummary({ cart, compact }: { cart: Cart; compact?: boolean }) {
	const t = cart.totals;
	const row = (label: string, amount: number, opts: { negative?: boolean; strong?: boolean; note?: string } = {}) => (
		<div className={`flex justify-between ${opts.strong ? "pt-3 text-base font-medium" : "text-sm"}`}>
			<span>{label}{opts.note && <span className="text-xs text-muted-foreground"> {opts.note}</span>}</span>
			<span>{opts.negative && amount > 0 && "−"}<Price amount={amount} currency={cart.currencyCode} /></span>
		</div>
	);
	return (
		<div className="space-y-4">
			{!compact && (
				<ul className="space-y-3">
					{cart.items.map((i) => (
						<li key={i.id} className="flex items-center gap-3">
							<div className="relative w-14 shrink-0 overflow-hidden rounded-md"><ProductImage src={i.thumbnail} alt={i.title} />
								<span className="absolute -top-0 -right-0 grid min-w-5 place-items-center rounded-bl-md bg-foreground px-1 text-[11px] text-background">{i.quantity}</span></div>
							<div className="min-w-0 flex-1"><p className="truncate text-sm">{i.title}</p>{i.variantTitle !== "Default" && <p className="text-xs text-muted-foreground">{i.variantTitle}</p>}</div>
							<Price amount={i.total} currency={cart.currencyCode} className="text-sm" />
						</li>
					))}
				</ul>
			)}
			<div className="space-y-2 border-t pt-4">
				{row("Subtotal", t.subtotal)}
				{t.discountTotal > 0 && row(`Discount${cart.promotion ? ` (${cart.promotion.code})` : ""}`, t.discountTotal, { negative: true })}
				{row("Shipping", t.shippingTotal, { note: cart.shippingOption ? "" : "(calculated next)" })}
				{t.taxTotal > 0 && row("Tax", t.taxTotal, { note: "(included)" })}
				<div className="border-t">{row("Total", t.total, { strong: true })}</div>
			</div>
		</div>
	);
}
