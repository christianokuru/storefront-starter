export function AuthCard({ title, description, children, footer }: { title: string; description?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }) {
	return (
		<div className="mx-auto w-full max-w-sm">
			<h1 className="text-3xl">{title}</h1>
			{description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
			<div className="mt-8">{children}</div>
			{footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
		</div>
	);
}

/** Only allow same-site relative redirects after sign-in (no open redirects). */
export const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : "/account");
