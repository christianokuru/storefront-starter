"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<"input">) {
	return (
		<div className="grid gap-1.5">
			<Label htmlFor={name}>{label}</Label>
			<Input id={name} name={name} className="h-11 text-base sm:text-sm" {...props} />
		</div>
	);
}

export function PasswordInput({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<"input">) {
	const [show, setShow] = useState(false);
	return (
		<div className="grid gap-1.5">
			<Label htmlFor={name}>{label}</Label>
			<div className="relative">
				<Input id={name} name={name} type={show ? "text" : "password"} className="h-11 pr-11 text-base sm:text-sm" {...props} />
				<button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>
					{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
				</button>
			</div>
		</div>
	);
}
