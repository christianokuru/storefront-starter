"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isCommerceError } from "@commerce-engine/sdk";
import { useCommerce } from "@commerce-engine/sdk/react";
import { Button } from "@/components/ui/button";
import { AuthCard, safeNext } from "@/components/auth-card";
import { Field, PasswordInput } from "@/components/field";
import { errorMessage } from "@/lib/errors";

export default function SignIn() {
	const commerce = useCommerce();
	const router = useRouter();
	const next = safeNext(useSearchParams().get("next"));
	const [busy, setBusy] = useState(false);
	const [unverified, setUnverified] = useState<string | null>(null);

	return (
		<AuthCard title="Sign in" description="Track orders and check out faster." footer={<>New here? <Link className="underline" href="/account/sign-up">Create an account</Link></>}>
			<form
				className="space-y-4"
				onSubmit={async (e) => {
					e.preventDefault();
					const fd = new FormData(e.currentTarget);
					const email = String(fd.get("email"));
					setBusy(true);
					setUnverified(null);
					try {
						await commerce.auth.signIn({ email, password: String(fd.get("password")) });
						router.replace(next);
						router.refresh();
					} catch (err) {
						if (isCommerceError(err, "email_not_verified")) setUnverified(email);
						else toast.error(isCommerceError(err, "invalid_credentials") ? "Email or password is incorrect." : errorMessage(err));
					} finally {
						setBusy(false);
					}
				}}
			>
				<Field label="Email" name="email" type="email" required autoComplete="email" inputMode="email" />
				<PasswordInput label="Password" name="password" required autoComplete="current-password" />
				<div className="text-right text-sm"><Link href="/account/forgot-password" className="text-muted-foreground underline">Forgot password?</Link></div>
				{unverified && (
					<div role="alert" className="rounded-md border p-3 text-sm">
						Please verify your email first. <button type="button" className="underline" onClick={() =>
							commerce.auth.sendVerificationEmail(unverified, `${location.origin}/account/verified`).then(() => toast.success("Verification email sent"), (e) => toast.error(errorMessage(e)))}>Resend the link</button>
					</div>
				)}
				<Button type="submit" className="h-11 w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />}Sign in</Button>
			</form>
		</AuthCard>
	);
}
