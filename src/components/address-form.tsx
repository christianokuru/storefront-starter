"use client";

import type { Address } from "@commerce-engine/sdk";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COUNTRIES } from "@/lib/countries";

/** Uncontrolled address fields (name="…") so it works with FormData and browser autofill. */
export function AddressFields({ value, prefix = "" }: { value?: Partial<Address> | null; prefix?: string }) {
	const f = (name: string, label: string, props: React.ComponentProps<"input"> = {}) => (
		<div className="grid gap-1.5">
			<Label htmlFor={`${prefix}${name}`}>{label}</Label>
			<Input id={`${prefix}${name}`} name={`${prefix}${name}`} defaultValue={(value?.[name as keyof Address] as string) ?? ""} className="h-11 text-base sm:text-sm" {...props} />
		</div>
	);
	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{f("firstName", "First name", { required: true, autoComplete: "given-name", maxLength: 100 })}
			{f("lastName", "Last name", { required: true, autoComplete: "family-name", maxLength: 100 })}
			<div className="sm:col-span-2">{f("address1", "Address", { required: true, autoComplete: "address-line1", maxLength: 200 })}</div>
			<div className="sm:col-span-2">{f("address2", "Apartment, suite (optional)", { autoComplete: "address-line2", maxLength: 200 })}</div>
			{f("city", "City", { required: true, autoComplete: "address-level2", maxLength: 100 })}
			{f("province", "State / region", { autoComplete: "address-level1", maxLength: 100 })}
			<div className="grid gap-1.5">
				<Label htmlFor={`${prefix}countryCode`}>Country</Label>
				<select id={`${prefix}countryCode`} name={`${prefix}countryCode`} defaultValue={value?.countryCode ?? "NG"} autoComplete="country" required className="h-11 rounded-md border bg-transparent px-3 text-base sm:text-sm">
					{COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
				</select>
			</div>
			{f("postalCode", "Postal code (optional)", { autoComplete: "postal-code", maxLength: 20 })}
			<div className="sm:col-span-2">{f("phone", "Phone", { type: "tel", required: true, autoComplete: "tel", maxLength: 30, inputMode: "tel" })}</div>
		</div>
	);
}

export function readAddress(fd: FormData, prefix = ""): Address {
	const g = (k: string) => String(fd.get(`${prefix}${k}`) ?? "").trim();
	const opt = (k: string) => g(k) || null;
	return { firstName: g("firstName"), lastName: g("lastName"), address1: g("address1"), address2: opt("address2"), city: g("city"), province: opt("province"), postalCode: opt("postalCode"), countryCode: g("countryCode"), phone: opt("phone") };
}
