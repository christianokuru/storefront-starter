"use client";

import { useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@commerce-engine/sdk";
import { useCart } from "@commerce-engine/sdk/react";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { useCartUI } from "./cart-ui";
import { Price } from "./price";
import { Quantity } from "./quantity";

/** Option picker → exact variant → add to bag. Handles sold-out and not-sold-in-this-currency variants. */
export function Purchase({ product, currency }: { product: Product; currency: string }) {
	const { add } = useCart();
	const { setOpen } = useCartUI();
	const firstAvailable = product.variants.find((v) => v.inStock && v.price) ?? product.variants[0];
	const [selected, setSelected] = useState<Record<string, string>>(firstAvailable?.options ?? {});
	const [qty, setQty] = useState(1);
	const [busy, setBusy] = useState(false);

	const variant = useMemo(() => {
		if (product.variants.length === 1) return product.variants[0]!;
		return product.variants.find((v) => product.options.every((o) => v.options?.[o.title] === selected[o.title])) ?? null;
	}, [product, selected]);

	// A value is selectable if some in-stock variant has it, given the other current choices.
	const available = (option: string, value: string) =>
		product.variants.some((v) => v.inStock && v.price && v.options?.[option] === value && product.options.every((o) => o.title === option || !selected[o.title] || v.options?.[o.title] === selected[o.title]));

	const status = !variant ? "choose" : !variant.price ? "unpriced" : !variant.inStock ? "soldout" : "ok";

	return (
		<div className="space-y-6">
			<Price amount={variant?.price?.amount ?? product.variants.find((v) => v.price)?.price?.amount} compareAt={variant?.price?.compareAtAmount} currency={currency} className="text-xl" />

			{product.options.map((o) => (
				<fieldset key={o.title}>
					<legend className="mb-2 text-sm font-medium">{o.title}{selected[o.title] && <span className="font-normal text-muted-foreground">: {selected[o.title]}</span>}</legend>
					<div className="flex flex-wrap gap-2">
						{o.values.map((value) => {
							const on = selected[o.title] === value;
							const ok = available(o.title, value);
							return (
								<button key={value} type="button" aria-pressed={on} onClick={() => setSelected((s) => ({ ...s, [o.title]: value }))}
									className={cn("min-w-12 rounded-md border px-3 py-2 text-sm transition-colors", on ? "border-foreground bg-foreground text-background" : "hover:border-foreground", !ok && "text-muted-foreground line-through decoration-1")}
									aria-label={`${o.title} ${value}${ok ? "" : " (sold out)"}`}>
									{value}
								</button>
							);
						})}
					</div>
				</fieldset>
			))}

			<div className="flex gap-3">
				<Quantity value={qty} onChange={setQty} disabled={status !== "ok" || busy} className="h-12 [&>button]:size-12" />
				<Button
					className="h-12 flex-1"
					disabled={status !== "ok" || busy}
					onClick={async () => {
						if (!variant) return;
						setBusy(true);
						try {
							await add(variant.id, qty);
							toast.success("Added to your bag", { icon: <Check className="size-4" /> });
							setOpen(true);
						} catch (e) {
							toast.error(errorMessage(e));
						} finally {
							setBusy(false);
						}
					}}
				>
					{busy && <Loader2 className="animate-spin" />}
					{status === "choose" ? "Choose an option" : status === "unpriced" ? `Not sold in ${currency}` : status === "soldout" ? "Sold out" : "Add to bag"}
				</Button>
			</div>
			{variant?.sku && <p className="text-xs text-muted-foreground">SKU {variant.sku}</p>}
		</div>
	);
}
