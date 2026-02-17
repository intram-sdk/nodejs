export interface SetupOptions {
    marchandKey?: string;
    privateKey?: string;
    publicKey?: string;
    secret?: string;
    mode?: 'sandbox' | 'live';
}

export interface StoreOptions {
    name: string;
    tagline?: string;
    phoneNumber?: string;
    postalAddress?: string;
    logo_url?: string;
    website_url?: string;
    color?: string;
    template?: string;
    cancelURL?: string;
    returnURL?: string;
    callbackURL?: string;
}

export interface ConfirmResult {
    status: 'SUCCESS' | 'PENDING' | 'CANCELED' | 'FAIL';
    customer: { name: string; phone: string; email: string } | null;
    receiptURL: string | null;
    customData: Record<string, any> | null;
    totalAmount: number;
    responseText: string;
}

export class Setup {
    constructor(data?: SetupOptions);
    config: Record<string, string>;
    baseURL: string;
    confirm(token: string): Promise<ConfirmResult>;
}

export class Store {
    constructor(data: StoreOptions);
    name: string;
    tagline?: string;
    phone_number?: string;
    postal_address?: string;
    logo_url?: string;
    website_url?: string;
    color?: string;
    template?: string;
    cancel_url?: string;
    return_url?: string;
    callback_url?: string;
}

export class CheckoutInvoice {
    constructor(setup: Setup, store: Store);

    baseURL: string;
    config: Record<string, string>;
    store: Store;
    description: string;
    items: Record<string, any>;
    customData: Record<string, any>;
    taxes: Record<string, any>;
    channels: string[];
    totalAmount: number;
    currency: string;
    token: string;
    url: string;
    status: string;
    responseText: string;
    customer: { name: string; phone: string; email: string } | string;
    receiptURL: string;
    returnURL?: string;
    cancelURL?: string;
    callbackURL?: string;

    addItem(name: string, quantity?: number, unitPrice?: number, totalPrice?: number, description?: string): void;
    addTax(name: string, amount: number): void;
    addChannel(channel: string): void;
    addChannels(channels: string[]): void;
    addCustomData(title: string, value: any): void;
    create(): Promise<void>;
    confirm(token?: string): Promise<void>;
}
