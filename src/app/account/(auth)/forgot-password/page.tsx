"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCommerce } from "@commerce-engine/sdk/react";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth-card";
import { Field } from "@/components/field";
import { errorMessage } from "@/lib/errors";

export default function ForgotPassword() {
	const commerce = useCommerce();
	const [busy, setBusy] = useState(false);
	const [sent, setSent] = useState(false);
	return (
		<AuthCard title="Reset your password" description={sent ? undefined : "We'll email you a link to choose a new one."} footer={<Link className="underline" href="/account/sign-in">Back to sign in</Link>}>
			{sent ? (
				<p className="rounded-lg border p-4 text-sm">If an account exists for that email, a reset link is on its way. It expires in 1 hour.</p>
			) : (
				<form className="space-y-4" onSubmit={async (e) => {
					e.preventDefault();
					setBusy(true);
					try {
						await commerce.auth.requestPasswordReset(String(new FormData(e.currentTarget).get("email")), `${location.origin}/account/reset-password`);
						setSent(true);
					} catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
				}}>
					<Field label="Email" name="email" type="email" required autoComplete="email" inputMode="email" />
					<Button type="submit" className="h-11 w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />}Send reset link</Button>
				</form>
			)}
		</AuthCard>
	);
}
