import { serverCommerce, storeInfo } from "@/lib/commerce-server";
import { HeaderBar } from "./header-bar";

export async function Header() {
	const [{ settings, features, currency }, categories] = await Promise.all([
		storeInfo(),
		serverCommerce().then((c) => c.categories.list().catch(() => [])),
	]);
	return (
		<HeaderBar
			name={settings?.name ?? "Store"}
			logoUrl={settings?.logoUrl ?? null}
			categories={categories.filter((c) => !c.parentId).map((c) => ({ name: c.name, handle: c.handle }))}
			currencies={settings?.currencies ?? []}
			currency={currency}
			accounts={features.includes("customerAccounts")}
		/>
	);
}
