export declare const minorUnitDigits: (currency: string) => 0 | 2;
export declare const toMajor: (minor: number, currency: string) => number;
export declare const toMinor: (major: number, currency: string) => number;
/** formatMoney(1250000, "NGN") → "₦12,500.00". Invalid currency codes fall back to "12,500.00 XYZ". */
export declare function formatMoney(minor: number | null | undefined, currency: string, locale?: string, opts?: {
    hideZeroDecimals?: boolean;
}): string;
