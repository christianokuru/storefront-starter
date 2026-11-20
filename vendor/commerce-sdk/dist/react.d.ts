import { type ReactNode } from "react";
import type { Commerce } from "./client.js";
import type { CommerceError } from "./errors.js";
import type { Cart, Customer, StoreConfig } from "./types.js";
export declare function CommerceProvider({ client, children }: {
    client: Commerce;
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useCommerce(): Commerce;
/**
 * Live cart for the whole app (and other tabs). `cart` is undefined while loading, null when empty.
 * Actions return the updated cart and throw CommerceError (catch it to show a message).
 */
export declare function useCart(): {
    cart: Cart | null | undefined;
    count: number;
    loading: boolean;
    /** True while any cart action is running. */
    pending: boolean;
    error: CommerceError | null;
    clearError: () => void;
    add: (variantId: string, quantity?: number) => Promise<Cart>;
    setQuantity: (lineId: string, quantity: number) => Promise<Cart>;
    remove: (lineId: string) => Promise<Cart>;
    update: (input: Parameters<Commerce["cart"]["update"]>[0]) => Promise<Cart>;
    setShippingOption: (id: string) => Promise<Cart>;
    applyCode: (code: string) => Promise<Cart>;
    removeCode: () => Promise<Cart>;
    refresh: () => Promise<Cart | null>;
};
/** Signed-in customer. `customer` is undefined while loading, null when signed out. */
export declare function useCustomer(): {
    customer: Customer | null | undefined;
    loading: boolean;
    signedIn: boolean;
    refresh: () => Promise<void>;
};
/** Store features (e.g. hide sign-in when "customerAccounts" is off). */
export declare function useStoreConfig(): {
    config: StoreConfig | null;
    has: (f: string) => boolean;
};
