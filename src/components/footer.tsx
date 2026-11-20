import Link from "next/link";
import { storeInfo } from "@/lib/commerce-server";

export async function Footer() {
	const { settings, features } = await storeInfo();
	const name = settings?.name ?? "Store";
	return (
		<footer className="mt-24 border-t bg-muted/40">
			<div className="container-page grid gap-8 py-12 text-sm sm:grid-cols-3">
				<div>
					<p className="font-heading text-xl">{name}</p>
					<p className="mt-2 max-w-xs text-muted-foreground">Secure checkout. Prices include tax where applicable.</p>
				</div>
				<nav aria-label="Shop" className="flex flex-col gap-2">
					<p className="eyebrow mb-1">Shop</p>
					<Link href="/products" className="text-muted-foreground hover:text-foreground">All products</Link>
					<Link href="/cart" className="text-muted-foreground hover:text-foreground">Your bag</Link>
				</nav>
				{features.includes("customerAccounts") && (
					<nav aria-label="Account" className="flex flex-col gap-2">
						<p className="eyebrow mb-1">Account</p>
						<Link href="/account" className="text-muted-foreground hover:text-foreground">Orders & addresses</Link>
						<Link href="/account/sign-in" className="text-muted-foreground hover:text-foreground">Sign in</Link>
					</nav>
				)}
			</div>
			<p className="container-page border-t py-6 text-xs text-muted-foreground">© {new Date().getFullYear()} {name}</p>
		</footer>
	);
}
