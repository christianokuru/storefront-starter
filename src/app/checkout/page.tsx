import type { Metadata } from "next";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
	return <div className="container-page py-8 sm:py-12"><CheckoutForm /></div>;
}
