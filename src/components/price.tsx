import { formatMoney } from "@commerce-engine/sdk";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/config";

export function Price({ amount, compareAt, currency, className }: { amount: number | null | undefined; compareAt?: number | null; currency: string; className?: string }) {
	if (amount === null || amount === undefined) return <span className={cn("text-muted-foreground", className)}>Unavailable</span>;
	const onSale = compareAt !== null && compareAt !== undefined && compareAt > amount;
	return (
		<span className={cn("inline-flex items-baseline gap-2 tabular-nums", className)}>
			<span className={cn(onSale && "text-destructive")}>{formatMoney(amount, currency, BRAND.locale)}</span>
			{onSale && <s className="text-sm text-muted-foreground" aria-label="Original price">{formatMoney(compareAt, currency, BRAND.locale)}</s>}
		</span>
	);
}
