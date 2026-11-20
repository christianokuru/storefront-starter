import type { Metadata } from "next";
import { Suspense } from "react";
import { CompleteView } from "./view";

export const metadata: Metadata = { title: "Order status", robots: { index: false } };

export default function CompletePage() {
	return <div className="container-page py-16"><Suspense><CompleteView /></Suspense></div>;
}
