"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@commerce-engine/sdk/react";
import { Price } from "./price";
import { ProductImage } from "./product-image";
import { Quantity } from "./quantity";
import { errorMessage } from "@/lib/errors";

/** Cart lines with quantity + remove. Used by the drawer and the cart page. */
export function CartLines({ onNavigate }: { onNavigate?: () => void }) {
	const { cart, setQuantity, remove, pending } = useCart();
	if (!cart) return null;
	const act = (p: Promise<unknown>) => p.catch((e) => toast.error(errorMessage(e)));
	return (
		<ul className="divide-y">
			{cart.items.map((line) => (
				<li key={line.id} className="flex gap-3 py-4" data-testid="cart-line">
					<div className="w-20 shrink-0 overflow-hidden rounded-md"><ProductImage src={line.thumbnail} alt={line.title} /></div>
					<div className="flex min-w-0 flex-1 flex-col">
						<div className="flex justify-between gap-2">
							<div className="min-w-0">
								<p className="truncate text-sm font-medium">{line.title}</p>
								{line.variantTitle && line.variantTitle !== "Default" && <p className="text-xs text-muted-foreground">{line.variantTitle}</p>}
							</div>
							<Price amount={line.total} currency={cart.currencyCode} className="text-sm" />
						</div>
						{!line.purchasable && <p className="mt-1 text-xs text-destructive">No longer available. Remove it to check out.</p>}
						<div className="mt-auto flex items-center justify-between pt-2">
							<Quantity value={line.quantity} onChange={(n) => act(setQuantity(line.id, n))} disabled={pending} />
							<button type="button" onClick={() => act(remove(line.id))} disabled={pending} className="grid size-9 place-items-center text-muted-foreground hover:text-destructive" aria-label={`Remove ${line.title}`}>
								<Trash2 className="size-4" />
							</button>
						</div>
					</div>
				</li>
			))}
			{cart.items.length === 0 && (
				<li className="py-10 text-center text-sm text-muted-foreground">
					Your bag is empty. <Link className="underline" href="/products" onClick={onNavigate}>Start shopping</Link>
				</li>
			)}
		</ul>
	);
}
