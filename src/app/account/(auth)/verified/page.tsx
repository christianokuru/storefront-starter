"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { AuthCard } from "@/components/auth-card";

/** The engine sends shoppers here after they click the verification link (?error=… if it failed). */
export default function Verified() {
	const error = useSearchParams().get("error");
	return error ? (
		<AuthCard title="Link expired" description="That verification link is invalid or has expired. Sign in to get a new one.">
			<Link href="/account/sign-in" className={buttonVariants({ className: "h-11 w-full" })}>Go to sign in</Link>
		</AuthCard>
	) : (
		<AuthCard title="Email verified" description="Your account is ready. Sign in to continue.">
			<Link href="/account/sign-in" className={buttonVariants({ className: "h-11 w-full" })}>Sign in</Link>
		</AuthCard>
	);
}
