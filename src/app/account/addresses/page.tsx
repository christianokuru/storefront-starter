"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { CustomerAddress } from "@commerce-engine/sdk";
import { useCommerce, useCustomer } from "@commerce-engine/sdk/react";
import { Button } from "@/components/ui/button";
import { AccountShell } from "@/components/account-shell";
import { AddressFields, readAddress } from "@/components/address-form";
import { errorMessage } from "@/lib/errors";

export default function AddressesPage() {
	return <AccountShell><Addresses /></AccountShell>;
}

function Addresses() {
	const commerce = useCommerce();
	const { customer } = useCustomer();
	const [list, setList] = useState<CustomerAddress[] | null>(null);
	const [adding, setAdding] = useState(false);
	const [busy, setBusy] = useState(false);
	const load = useCallback(() => commerce.customer.addresses.list().then(setList, () => setList([])), [commerce]);
	useEffect(() => { if (customer) load(); }, [customer, load]);

	return (
		<div className="space-y-6">
			{list === null ? <p className="text-sm text-muted-foreground">Loading…</p> : (
				<ul className="grid gap-3 sm:grid-cols-2">
					{list.map((x) => (
						<li key={x.id} className="rounded-lg border p-4 text-sm" data-testid="address">
							{x.isDefault && <p className="eyebrow mb-1">Default</p>}
							<p className="font-medium">{x.address.firstName} {x.address.lastName}</p>
							<p className="text-muted-foreground">{x.address.address1}{x.address.address2 ? `, ${x.address.address2}` : ""}<br />{x.address.city}, {x.address.countryCode}<br />{x.address.phone}</p>
							<button type="button" className="mt-3 text-destructive underline" onClick={async () => {
								if (!confirm("Delete this address?")) return;
								try { await commerce.customer.addresses.remove(x.id); await load(); toast.success("Address deleted"); } catch (e) { toast.error(errorMessage(e)); }
							}}>Delete</button>
						</li>
					))}
					{list.length === 0 && !adding && <li className="text-sm text-muted-foreground">No saved addresses yet.</li>}
				</ul>
			)}
			{adding ? (
				<form className="space-y-4 rounded-lg border p-5" onSubmit={async (e) => {
					e.preventDefault();
					const fd = new FormData(e.currentTarget);
					setBusy(true);
					try {
						await commerce.customer.addresses.add(readAddress(fd), { isDefault: fd.get("isDefault") === "on" });
						await load();
						setAdding(false);
						toast.success("Address saved");
					} catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
				}}>
					<AddressFields value={{ firstName: customer?.firstName ?? "", lastName: customer?.lastName ?? "", phone: customer?.phone }} />
					<label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isDefault" className="accent-foreground" /> Make this my default address</label>
					<div className="flex gap-2">
						<Button type="submit" disabled={busy} className="h-11">{busy && <Loader2 className="animate-spin" />}Save address</Button>
						<Button type="button" variant="ghost" className="h-11" onClick={() => setAdding(false)}>Cancel</Button>
					</div>
				</form>
			) : (
				<Button variant="outline" className="h-11" onClick={() => setAdding(true)}>Add an address</Button>
			)}
		</div>
	);
}
