"use client";
/* eslint-disable @next/next/no-img-element -- store logo comes from the engine */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { toast } from "sonner";
import { useCart, useCommerce } from "@commerce-engine/sdk/react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { useCartUI } from "./cart-ui";

type Props = { name: string; logoUrl: string | null; categories: { name: string; handle: string }[]; currencies: string[]; currency: string; accounts: boolean };

export function HeaderBar({ name, logoUrl, categories, currencies, currency, accounts }: Props) {
	const { count } = useCart();
	const { setOpen } = useCartUI();
	const [menu, setMenu] = useState(false);
	const path = usePathname();
	const nav = [{ href: "/products", label: "Shop all" }, ...categories.map((c) => ({ href: `/products?category=${c.handle}`, label: c.name }))];

	return (
		<header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
			<div className="container-page flex h-14 items-center gap-3 sm:h-16">
				<button type="button" className="-ml-2 grid size-10 place-items-center md:hidden" onClick={() => setMenu(true)} aria-label="Open menu"><Menu className="size-5" /></button>
				<Link href="/" className="font-heading text-xl tracking-tight sm:text-2xl" aria-label={`${name} home`}>
					{logoUrl ? <img src={logoUrl} alt={name} className="h-7 w-auto" /> : name}
				</Link>
				<nav aria-label="Main" className="ml-8 hidden gap-6 text-sm md:flex">
					{nav.slice(0, 6).map((n) => (
						<Link key={n.href} href={n.href} className={cn("text-muted-foreground transition-colors hover:text-foreground", path === n.href && "text-foreground")}>{n.label}</Link>
					))}
				</nav>
				<div className="ml-auto flex items-center gap-1">
					{currencies.length > 1 && <CurrencySwitcher currencies={currencies} current={currency} className="hidden sm:block" />}
					<Link href="/products?focus=search" className="grid size-10 place-items-center" aria-label="Search"><Search className="size-5" /></Link>
					{accounts && <Link href="/account" className="grid size-10 place-items-center" aria-label="Account"><User className="size-5" /></Link>}
					<button type="button" onClick={() => setOpen(true)} className="relative grid size-10 place-items-center" aria-label={`Open bag, ${count} item${count === 1 ? "" : "s"}`} data-testid="cart-button">
						<ShoppingBag className="size-5" />
						{count > 0 && <span className="absolute top-1 right-0.5 grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] leading-4 font-medium text-brand-foreground">{count > 99 ? "99+" : count}</span>}
					</button>
				</div>
			</div>

			<Sheet open={menu} onOpenChange={setMenu}>
				<SheetContent side="left" className="w-[85%] p-6">
					<SheetTitle className="font-heading text-2xl">{name}</SheetTitle>
					<SheetDescription className="sr-only">Site navigation</SheetDescription>
					<nav aria-label="Mobile" className="mt-4 flex flex-col">
						{nav.map((n) => <Link key={n.href} href={n.href} onClick={() => setMenu(false)} className="border-b py-3 text-base">{n.label}</Link>)}
						{accounts && <Link href="/account" onClick={() => setMenu(false)} className="border-b py-3 text-base">Account</Link>}
					</nav>
					{currencies.length > 1 && <CurrencySwitcher currencies={currencies} current={currency} className="mt-6" />}
				</SheetContent>
			</Sheet>
		</header>
	);
}

function CurrencySwitcher({ currencies, current, className }: { currencies: string[]; current: string; className?: string }) {
	const commerce = useCommerce();
	const router = useRouter();
	const [busy, setBusy] = useState(false);
	return (
		<label className={className}>
			<span className="sr-only">Currency</span>
			<select
				value={current}
				disabled={busy}
				onChange={async (e) => {
					setBusy(true);
					try {
						const { dropped } = await commerce.currency.set(e.target.value);
						if (dropped.length) toast.warning(`Not available in ${e.target.value}: ${dropped.join(", ")}`);
						router.refresh();
					} catch (err) {
						toast.error(errorMessage(err));
					} finally {
						setBusy(false);
					}
				}}
				className="h-9 rounded-md border bg-transparent px-2 text-sm"
			>
				{currencies.map((c) => <option key={c} value={c}>{c}</option>)}
			</select>
		</label>
	);
}
