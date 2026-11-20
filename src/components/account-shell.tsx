"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useCommerce, useCustomer } from "@commerce-engine/sdk/react";
import { cn } from "@/lib/utils";

/** Signed-in area: redirects to sign-in when there's no session. */
export function AccountShell({ children }: { children: React.ReactNode }) {
	const { customer, loading } = useCustomer();
	const commerce = useCommerce();
	const router = useRouter();
	const path = usePathname();
	const leaving = useRef(false); // signing out: go home, not to the sign-in page
	useEffect(() => {
		if (!loading && !customer && !leaving.current) router.replace(`/account/sign-in?next=${encodeURIComponent(path)}`);
	}, [loading, customer, router, path]);
	if (!customer) return <p className="py-20 text-center text-sm text-muted-foreground">Loading your account…</p>;
	const tabs = [{ href: "/account", label: "Orders" }, { href: "/account/addresses", label: "Addresses" }];
	return (
		<div>
			<div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
				<div>
					<p className="eyebrow">My account</p>
					<h1 className="mt-1 text-3xl sm:text-4xl">Hi {customer.firstName || customer.email.split("@")[0]}</h1>
					<p className="mt-1 text-sm text-muted-foreground">{customer.email}</p>
				</div>
				<button type="button" className="text-sm underline" onClick={async () => { leaving.current = true; await commerce.auth.signOut(); router.replace("/"); router.refresh(); }}>Sign out</button>
			</div>
			<nav aria-label="Account sections" className="mt-6 flex gap-6 text-sm">
				{tabs.map((t) => <Link key={t.href} href={t.href} aria-current={path === t.href ? "page" : undefined} className={cn("pb-1", path === t.href ? "border-b-2 border-foreground font-medium" : "text-muted-foreground")}>{t.label}</Link>)}
			</nav>
			<div className="mt-8">{children}</div>
		</div>
	);
}

export const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
export const statusLabel: Record<string, string> = {
	not_fulfilled: "Processing", fulfilled: "Packed", shipped: "Shipped", delivered: "Delivered", canceled: "Cancelled",
};
