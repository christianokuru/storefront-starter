import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { storeInfo } from "@/lib/commerce-server";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

/** Only exists when the store's plan includes customer accounts. */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
	if (!(await storeInfo()).features.includes("customerAccounts")) notFound();
	return <div className="container-page py-10 sm:py-14"><Suspense>{children}</Suspense></div>;
}
