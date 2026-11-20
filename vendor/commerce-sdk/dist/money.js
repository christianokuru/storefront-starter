/** Same minor-unit rules as the engine (kobo, cents; zero-decimal currencies). */
const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "XOF", "XAF", "UGX", "RWF", "CLP", "PYG"]);
export const minorUnitDigits = (currency) => (ZERO_DECIMAL.has(currency.toUpperCase()) ? 0 : 2);
export const toMajor = (minor, currency) => minor / 10 ** minorUnitDigits(currency);
export const toMinor = (major, currency) => Math.round(major * 10 ** minorUnitDigits(currency));
const cache = new Map();
/** formatMoney(1250000, "NGN") → "₦12,500.00". Invalid currency codes fall back to "12,500.00 XYZ". */
export function formatMoney(minor, currency, locale = "en-NG", opts = {}) {
    if (minor === null || minor === undefined || !Number.isFinite(minor))
        return "";
    const cur = currency.toUpperCase();
    const major = toMajor(minor, cur);
    const whole = opts.hideZeroDecimals && Number.isInteger(major);
    const key = `${locale}|${cur}|${whole}`;
    try {
        let f = cache.get(key);
        if (!f) {
            f = new Intl.NumberFormat(locale, { style: "currency", currency: cur, ...(whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}) });
            cache.set(key, f);
        }
        return f.format(major);
    }
    catch {
        return `${major.toLocaleString(locale)} ${cur}`;
    }
}
