"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return (
		<div className="container-page py-24 text-center">
			<h1 className="text-4xl">Something went wrong</h1>
			<p className="mt-3 text-muted-foreground">Please try again. If it keeps happening, check your connection.</p>
			<Button className="mt-8 h-11" onClick={reset}>Try again</Button>
		</div>
	);
}
