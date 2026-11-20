/** Shapes returned by the Store API. All money is an integer in the currency's minor unit (kobo, cents). */
export type Money = {
    amount: number;
    compareAtAmount: number | null;
    currencyCode: string;
};
export type ProductImage = {
    id: string;
    url: string;
    alt: string | null;
};
export type ProductOption = {
    title: string;
    values: string[];
};
export type ProductVariant = {
    id: string;
    title: string;
    sku: string | null;
    options: Record<string, string> | null;
    /** null when the variant has no price in the requested currency (not purchasable in it). */
    price: Money | null;
    inStock: boolean;
};
export type Product = {
    id: string;
    title: string;
    handle: string;
    subtitle: string | null;
    description: string | null;
    thumbnail: string | null;
    images: ProductImage[];
    options: ProductOption[];
    variants: ProductVariant[];
};
export type ProductList = {
    products: Product[];
    count: number;
    limit: number;
    offset: number;
};
export type Category = {
    id: string;
    name: string;
    handle: string;
    description: string | null;
    parentId: string | null;
};
export type Collection = {
    id: string;
    title: string;
    handle: string;
    description: string | null;
};
export type Address = {
    firstName: string;
    lastName: string;
    company?: string | null;
    address1: string;
    address2?: string | null;
    city: string;
    province?: string | null;
    postalCode?: string | null;
    /** ISO 3166-1 alpha-2, e.g. "NG". */
    countryCode: string;
    phone?: string | null;
};
export type CartLine = {
    id: string;
    variantId: string;
    productId: string | null;
    title: string;
    variantTitle: string;
    sku: string | null;
    thumbnail: string | null;
    quantity: number;
    unitPrice: number | null;
    total: number;
    /** false when the item can no longer be bought (unpublished, deleted, no price in this currency). */
    purchasable: boolean;
};
export type CartTotals = {
    subtotal: number;
    itemDiscount: number;
    shippingDiscount: number;
    discountTotal: number;
    shippingTotal: number;
    taxTotal: number;
    total: number;
    /** Why an applied code no longer applies (expired, minimum not met...), else null. */
    promotionError: string | null;
};
export type Cart = {
    id: string;
    email: string | null;
    currencyCode: string;
    shippingAddress: Address | null;
    billingAddress: Address | null;
    completedAt: string | null;
    items: CartLine[];
    shippingOption: {
        id: string;
        name: string;
        amount: number;
        freeOverAmount: number | null;
    } | null;
    promotion: {
        code: string;
        type: string;
        value: number;
    } | null;
    totals: CartTotals;
};
export type ShippingOption = {
    id: string;
    name: string;
    amount: number;
    /** What the shopper pays for this cart (0 when the free-over threshold is met). */
    effectiveAmount: number;
    freeOverAmount: number | null;
    currencyCode: string;
    minDeliveryDays: number | null;
    maxDeliveryDays: number | null;
};
export type PaymentProvider = {
    id: "paystack" | "flutterwave" | "stripe";
    label: string;
};
export type PaymentSession = {
    paymentId: string;
    redirectUrl: string;
    reference: string;
};
export type StoreSettings = {
    name: string;
    logoUrl: string | null;
    defaultCurrency: string;
    currencies: string[];
    taxInclusive: boolean;
    /** Usable providers per currency. */
    paymentProviders: Record<string, PaymentProvider[]>;
};
export type Feature = "customerAccounts" | "discounts" | "inventoryTracking" | "collections" | "apiKeys" | "multiCurrency" | (string & {});
export type StoreConfig = {
    region: "africa" | "international";
    features: Feature[];
};
export type Customer = {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
};
export type CustomerAddress = {
    id: string;
    customerId: string;
    address: Address;
    isDefault: boolean;
    createdAt: string;
};
export type OrderLine = {
    id: string;
    productId: string | null;
    variantId: string | null;
    title: string;
    variantTitle: string | null;
    sku: string | null;
    thumbnail: string | null;
    unitPrice: number;
    quantity: number;
    total: number;
};
export type Order = {
    id: string;
    displayId: number;
    email: string;
    currencyCode: string;
    status: "pending" | "completed" | "canceled" | "requires_action";
    paymentStatus: "captured" | "partially_refunded" | "refunded";
    fulfillmentStatus: "not_fulfilled" | "fulfilled" | "shipped" | "delivered" | "canceled";
    subtotal: number;
    discountTotal: number;
    shippingTotal: number;
    taxTotal: number;
    total: number;
    refundedTotal: number;
    taxInclusive: boolean;
    shippingAddress: Address | null;
    billingAddress: Address | null;
    shippingMethod: {
        optionId: string;
        name: string;
        amount: number;
    } | null;
    promotion: {
        code: string;
        type: string;
        value: number;
    } | null;
    trackingNumber: string | null;
    carrier: string | null;
    createdAt: string;
    items?: OrderLine[];
};
export type OrderList = {
    orders: Order[];
    count: number;
};
export type User = {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    role?: string;
};
export type Session = {
    user: User;
    session: {
        id: string;
        expiresAt: string;
    };
};
