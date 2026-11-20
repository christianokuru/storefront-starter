"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCommerce } from "@commerce-engine/sdk/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { AuthCard } from "@/components/auth-card";
import { PasswordInput } from "@/components/field";
import { errorMessage } from "@/lib/errors";

export default function ResetPassword() {
	const commerce = useCommerce();
	const params = useSearchParams();
	const token = params.get("token");
	const [busy, setBusy] = useState(false);
	const [done, setDone] = useState(false);

	if (!token || params.get("error"))
		return (
			<AuthCard title="Link expired" description="This reset link is invalid or has expired.">
				<Link href="/account/forgot-password" className={buttonVariants({ className: "h-11 w-full" })}>Request a new link</Link>
			</AuthCard>
		);
	if (done)
		return (
			<AuthCard title="Password updated" description="You can now sign in with your new password.">
				<Link href="/account/sign-in" className={buttonVariants({ className: "h-11 w-full" })}>Sign in</Link>
			</AuthCard>
		);
	return (
		<AuthCard title="Choose a new password">
			<form className="space-y-4" onSubmit={async (e) => {
				e.preventDefault();
				const fd = new FormData(e.currentTarget);
				if (fd.get("password") !== fd.get("confirm")) return void toast.error("Passwords don't match");
				setBusy(true);
				try { await commerce.auth.resetPassword(token, String(fd.get("password"))); setDone(true); }
				catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
			}}>
				<PasswordInput label="New password" name="password" required minLength={8} maxLength={128} autoComplete="new-password" />
				<PasswordInput label="Confirm password" name="confirm" required minLength={8} maxLength={128} autoComplete="new-password" />
				<Button type="submit" className="h-11 w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />}Update password</Button>
			</form>
		</AuthCard>
	);
}
