"use client";

import { Minus, Plus } from "lucide-react";
import { MAX_QUANTITY } from "@commerce-engine/sdk";
import { cn } from "@/lib/utils";

export function Quantity({ value, onChange, disabled, min = 1, label = "Quantity", className }: { value: number; onChange: (n: number) => void; disabled?: boolean; min?: number; label?: string; className?: string }) {
	const btn = "grid size-9 place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40";
	return (
		<div className={cn("inline-flex h-9 items-center rounded-md border", className)} role="group" aria-label={label}>
			<button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={disabled || value <= min} aria-label="Decrease quantity"><Minus className="size-3.5" /></button>
			<span className="w-8 text-center text-sm tabular-nums" aria-live="polite">{value}</span>
			<button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={disabled || value >= MAX_QUANTITY} aria-label="Increase quantity"><Plus className="size-3.5" /></button>
		</div>
	);
}
