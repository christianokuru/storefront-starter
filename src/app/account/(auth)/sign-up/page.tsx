"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { isCommerceError } from "@commerce-engine/sdk";
import { useCommerce } from "@commerce-engine/sdk/react";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth-card";
import { Field, PasswordInput } from "@/components/field";
import { errorMessage } from "@/lib/errors";

export default function SignUp() {
	const commerce = useCommerce();
	const [busy, setBusy] = useState(false);
	const [sentTo, setSentTo] = useState<string | null>(null);

	if (sentTo)
		return (
			<AuthCard title="Check your email" footer={<Link className="underline" href="/account/sign-in">Back to sign in</Link>}>
				<div className="flex gap-3 rounded-lg border p-4 text-sm"><MailCheck className="size-5 shrink-0" /><p>We sent a verification link to <strong>{sentTo}</strong>. Open it to activate your account, then sign in.</p></div>
			</AuthCard>
		);

	return (
		<AuthCard title="Create an account" description="Save your addresses and see every order in one place." footer={<>Already have an account? <Link className="underline" href="/account/sign-in">Sign in</Link></>}>
			<form
				className="space-y-4"
				onSubmit={async (e) => {
					e.preventDefault();
					const fd = new FormData(e.currentTarget);
					const email = String(fd.get("email"));
					setBusy(true);
					try {
						const r = await commerce.auth.signUp({ name: String(fd.get("name")), email, password: String(fd.get("password")), callbackURL: `${location.origin}/account/verified` });
						if (r.verificationRequired) setSentTo(email);
					} catch (err) {
						// Don't reveal whether an email is registered: treat "exists" like success.
						if (isCommerceError(err, "user_exists")) setSentTo(email);
						else toast.error(errorMessage(err));
					} finally {
						setBusy(false);
					}
				}}
			>
				<Field label="Full name" name="name" required autoComplete="name" maxLength={100} />
				<Field label="Email" name="email" type="email" required autoComplete="email" inputMode="email" />
				<PasswordInput label="Password" name="password" required minLength={8} maxLength={128} autoComplete="new-password" />
				<p className="text-xs text-muted-foreground">At least 8 characters.</p>
				<Button type="submit" className="h-11 w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />}Create account</Button>
			</form>
		</AuthCard>
	);
}
