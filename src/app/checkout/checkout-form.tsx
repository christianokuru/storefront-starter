"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { formatMoney, type Address, type CustomerAddress, type PaymentProvider, type ShippingOption } from "@commerce-engine/sdk";
import { useCart, useCommerce, useCustomer, useStoreConfig } from "@commerce-engine/sdk/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressFields, readAddress } from "@/components/address-form";
import { OrderSummary } from "@/components/order-summary";
import { errorMessage } from "@/lib/errors";
import { BRAND } from "@/lib/config";
import { cn } from "@/lib/utils";

const Section = ({ n, title, done, children, action }: { n: number; title: string; done?: boolean; children: React.ReactNode; action?: React.ReactNode }) => (
	<section className="border-t pt-6" aria-labelledby={`s${n}`}>
		<div className="mb-4 flex items-center justify-between gap-3">
			<h2 id={`s${n}`} className="flex items-center gap-3 font-sans text-base font-medium">
				<span className={cn("grid size-6 place-items-center rounded-full border text-xs", done && "border-foreground bg-foreground text-background")}>{n}</span>
				{title}
			</h2>
			{action}
		</div>
		{children}
	</section>
);

export function CheckoutForm() {
	const commerce = useCommerce();
	const { cart, update, setShippingOption, applyCode, removeCode, pending } = useCart();
	const { customer } = useCustomer();
	const { has } = useStoreConfig();
	const [editing, setEditing] = useState(false);
	const [optionsFor, setOptionsFor] = useState<{ key: string; list: ShippingOption[] } | null>(null);
	const [providers, setProviders] = useState<PaymentProvider[] | null>(null);
	const [provider, setProvider] = useState<string>("");
	const [saved, setSaved] = useState<CustomerAddress[]>([]);
	const [code, setCode] = useState("");
	const [paying, setPaying] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const addressKey = cart?.shippingAddress ? JSON.stringify(cart.shippingAddress) : "";
	const subtotal = cart?.totals.subtotal;

	// Delivery options depend on the address (country) and subtotal (free-over thresholds).
	const optionsKey = `${addressKey}|${subtotal}`;
	const options = addressKey && optionsFor?.key === optionsKey ? optionsFor.list : null;
	useEffect(() => {
		if (!addressKey) return;
		let live = true;
		commerce.cart.shippingOptions().then((list) => live && setOptionsFor({ key: optionsKey, list }), (e) => live && setError(errorMessage(e)));
		return () => { live = false; };
	}, [commerce, addressKey, optionsKey]);

	useEffect(() => {
		if (!cart?.id) return;
		let live = true;
		commerce.cart.paymentProviders().then((p) => {
			if (!live) return;
			setProviders(p);
			setProvider((cur) => (p.some((x) => x.id === cur) ? cur : (p[0]?.id ?? "")));
		}, () => live && setProviders([]));
		return () => { live = false; };
	}, [commerce, cart?.id, cart?.currencyCode]);

	useEffect(() => {
		if (customer) commerce.customer.addresses.list().then(setSaved, () => setSaved([]));
	}, [commerce, customer]);

	if (cart === undefined) return <p className="py-20 text-center text-sm text-muted-foreground">Loading checkout…</p>;
	if (!cart || cart.items.length === 0)
		return (
			<div className="mx-auto max-w-md py-20 text-center">
				<h1 className="text-3xl">Your bag is empty</h1>
				<Link href="/products" className={buttonVariants({ className: "mt-6" })}>Continue shopping</Link>
			</div>
		);

	const readiness = commerce.checkout.readiness(cart, { shippingOptionsAvailable: options === null ? undefined : options.length > 0 });
	const showAddressForm = editing || !cart.shippingAddress || !cart.email;
	const run = async (fn: () => Promise<unknown>) => {
		setError(null);
		try { await fn(); } catch (e) { const m = errorMessage(e); setError(m); toast.error(m); }
	};

	const saveDetails = (fd: FormData) =>
		run(async () => {
			const email = String(fd.get("email") ?? "").trim();
			const shippingAddress: Address = readAddress(fd);
			await update({ email, shippingAddress, billingAddress: null });
			setEditing(false);
		});

	const pay = () =>
		run(async () => {
			if (!readiness.ready) throw new Error("incomplete");
			setPaying(true);
			try {
				// The shopper leaves for the provider's secure page; they come back to /checkout/complete.
				await commerce.checkout.pay(provider, { returnUrl: `${location.origin}/checkout/complete`, cancelUrl: `${location.origin}/checkout` });
			} catch (e) {
				setPaying(false);
				throw e;
			}
		});

	return (
		<div className="grid gap-10 lg:grid-cols-[1fr_400px]">
			<div className="space-y-8">
				<div className="flex items-end justify-between">
					<h1 className="text-3xl sm:text-4xl">Checkout</h1>
					{!customer && has("customerAccounts") && <Link href="/account/sign-in?next=/checkout" className="text-sm underline">Sign in for faster checkout</Link>}
				</div>

				{cart.items.some((i) => !i.purchasable) && (
					<p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">Some items are no longer available. <Link href="/cart" className="underline">Review your bag</Link> to continue.</p>
				)}

				<Section n={1} title="Contact & delivery address" done={!showAddressForm}
					action={!showAddressForm && <button type="button" className="text-sm underline" onClick={() => setEditing(true)}>Edit</button>}>
					{showAddressForm ? (
						<form action={saveDetails} className="space-y-5">
							<div className="grid gap-1.5">
								<Label htmlFor="email">Email</Label>
								<Input id="email" name="email" type="email" required autoComplete="email" inputMode="email" defaultValue={cart.email ?? customer?.email ?? ""} className="h-11 text-base sm:text-sm" />
								<p className="text-xs text-muted-foreground">Your receipt and delivery updates go here.</p>
							</div>
							{saved.length > 0 && (
								<div className="flex flex-wrap gap-2" aria-label="Saved addresses">
									{saved.map((s) => (
										<button key={s.id} type="button" className="rounded-md border px-3 py-2 text-left text-xs hover:border-foreground"
											onClick={() => run(() => update({ email: cart.email ?? customer?.email ?? "", shippingAddress: s.address, billingAddress: null }).then(() => setEditing(false)))}>
											<span className="font-medium">{s.address.firstName} {s.address.lastName}</span><br />{s.address.address1}, {s.address.city}
										</button>
									))}
								</div>
							)}
							<AddressFields key={addressKey} value={cart.shippingAddress ?? (customer ? { firstName: customer.firstName ?? "", lastName: customer.lastName ?? "", phone: customer.phone } : null)} />
							<Button type="submit" className="h-11 w-full sm:w-auto" disabled={pending}>{pending && <Loader2 className="animate-spin" />}Continue to delivery</Button>
						</form>
					) : (
						<div className="text-sm text-muted-foreground">
							<p className="text-foreground">{cart.email}</p>
							<p>{cart.shippingAddress!.firstName} {cart.shippingAddress!.lastName}, {cart.shippingAddress!.address1}{cart.shippingAddress!.address2 ? `, ${cart.shippingAddress!.address2}` : ""}, {cart.shippingAddress!.city}, {cart.shippingAddress!.countryCode}</p>
						</div>
					)}
				</Section>

				<Section n={2} title="Delivery" done={Boolean(cart.shippingOption)}>
					{!cart.shippingAddress ? (
						<p className="text-sm text-muted-foreground">Add your address to see delivery options.</p>
					) : options === null ? (
						<p className="text-sm text-muted-foreground">Finding delivery options…</p>
					) : options.length === 0 ? (
						<p className="text-sm">We don&rsquo;t deliver to this address yet. Try another country or contact the store.</p>
					) : (
						<div className="space-y-2" role="radiogroup" aria-label="Delivery options">
							{options.map((o) => (
								<label key={o.id} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm", cart.shippingOption?.id === o.id && "border-foreground")}>
									<input type="radio" name="shipping" className="accent-foreground" checked={cart.shippingOption?.id === o.id} disabled={pending}
										onChange={() => run(() => setShippingOption(o.id))} />
									<span className="flex-1">
										{o.name}
										{o.minDeliveryDays !== null && <span className="block text-xs text-muted-foreground">{o.maxDeliveryDays && o.maxDeliveryDays !== o.minDeliveryDays ? `${o.minDeliveryDays}–${o.maxDeliveryDays}` : o.minDeliveryDays} business day{o.maxDeliveryDays === 1 ? "" : "s"}</span>}
									</span>
									<span className="tabular-nums">{o.effectiveAmount === 0 ? "Free" : formatMoney(o.effectiveAmount, cart.currencyCode, BRAND.locale)}</span>
								</label>
							))}
						</div>
					)}
				</Section>

				{has("discounts") && (
					<Section n={3} title="Discount code" done={Boolean(cart.promotion && !cart.totals.promotionError)}>
						{cart.promotion ? (
							<div className="flex items-center justify-between rounded-lg border p-3 text-sm">
								<span><span className="font-medium">{cart.promotion.code}</span>{cart.totals.promotionError ? <span className="block text-destructive">{cart.totals.promotionError}</span> : <span className="text-muted-foreground"> applied</span>}</span>
								<button type="button" className="underline" onClick={() => run(removeCode)} disabled={pending}>Remove</button>
							</div>
						) : (
							<form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run(async () => { await applyCode(code); setCode(""); toast.success("Discount applied"); }); }}>
								<Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter code" aria-label="Discount code" maxLength={32} autoCapitalize="characters" className="h-11 text-base uppercase sm:text-sm" />
								<Button type="submit" variant="outline" className="h-11" disabled={!code.trim() || pending}>Apply</Button>
							</form>
						)}
					</Section>
				)}

				<Section n={has("discounts") ? 4 : 3} title="Payment" done={false}>
					{providers === null ? (
						<p className="text-sm text-muted-foreground">Loading payment methods…</p>
					) : providers.length === 0 ? (
						<p className="text-sm">Online payment isn&rsquo;t available for {cart.currencyCode} right now. Please contact the store.</p>
					) : (
						<div className="space-y-2" role="radiogroup" aria-label="Payment method">
							{providers.map((p) => (
								<label key={p.id} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm", provider === p.id && "border-foreground")}>
									<input type="radio" name="provider" className="accent-foreground" checked={provider === p.id} onChange={() => setProvider(p.id)} />
									{p.label}
								</label>
							))}
						</div>
					)}
					{error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
					<Button className="mt-6 h-12 w-full text-base" disabled={!readiness.ready || !provider || paying || pending} onClick={pay} data-testid="pay">
						{paying ? <Loader2 className="animate-spin" /> : <Lock className="size-4" />}
						{paying ? "Redirecting to secure payment…" : `Pay ${formatMoney(cart.totals.total, cart.currencyCode, BRAND.locale)}`}
					</Button>
					{!readiness.ready && (
						<p className="mt-2 text-center text-xs text-muted-foreground">
							{readiness.missing.includes("unavailable_items") ? "Remove unavailable items first." : readiness.missing.includes("shipping_address") || readiness.missing.includes("email") ? "Add your contact details and address." : readiness.missing.includes("shipping_option") ? "Choose a delivery option." : readiness.missing.includes("promotion") ? "Remove the discount code that no longer applies." : ""}
						</p>
					)}
					<p className="mt-3 text-center text-xs text-muted-foreground">You&rsquo;ll pay on the provider&rsquo;s secure page. We never see your card details.</p>
				</Section>
			</div>

			<aside className="h-fit rounded-xl border bg-muted/30 p-5 lg:sticky lg:top-24" aria-label="Order summary">
				<h2 className="mb-4 font-sans text-base font-medium">Order summary</h2>
				<OrderSummary cart={cart} />
			</aside>
		</div>
	);
}
