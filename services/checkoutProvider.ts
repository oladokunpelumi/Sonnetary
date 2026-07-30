import type { Currency, PaymentProvider } from '../constants';

export type CheckoutPaymentMethod = 'card' | 'bank_transfer';

export interface GeoCountryResponse {
  country?: string;
  isNigeria?: boolean | null;
  source?: string;
}

export interface CheckoutConfig {
  provider: PaymentProvider;
  currency: Currency;
  country?: string;
  paymentMethods: CheckoutPaymentMethod[];
}

/**
 * Server-side source of truth for currency and available methods. The default
 * provider is Stripe because Card is preselected; Nigerian customers can then
 * explicitly choose the Paystack bank-transfer method returned by the server.
 */
export async function fetchCheckoutConfig(): Promise<CheckoutConfig> {
  try {
    const response = await fetch('/api/checkout-config');
    if (!response.ok) throw new Error('checkout-config request failed');
    const data = (await response.json()) as Partial<CheckoutConfig>;
    if (data.provider === 'stripe' || data.provider === 'paystack') {
      return {
        provider: data.provider,
        currency: data.currency === 'usd' ? 'usd' : 'ngn',
        country: data.country,
        paymentMethods: Array.isArray(data.paymentMethods)
          ? data.paymentMethods.filter(
              (method): method is CheckoutPaymentMethod => method === 'card' || method === 'bank_transfer'
            )
          : ['card'],
      };
    }
    throw new Error('checkout-config returned an unexpected shape');
  } catch {
    // Fail open to the Nigerian price while keeping card on Stripe. The
    // bank-transfer option is only shown after the server explicitly confirms
    // it is available for this checkout.
    return { provider: 'stripe', currency: 'ngn', paymentMethods: ['card'] };
  }
}

/** @deprecated Superseded by fetchCheckoutConfig — kept for the tests that
 * document the (now server-side) fail-open behavior. */
export function paymentProviderFromGeo(data: GeoCountryResponse | null | undefined): PaymentProvider {
  void data;
  return 'stripe';
}

export function reconcilePaymentProvider<T extends { paymentProvider: PaymentProvider }>(
  brief: T,
  provider: PaymentProvider
): T {
  return brief.paymentProvider === provider ? brief : { ...brief, paymentProvider: provider };
}

export function reconcileCheckoutConfig<T extends { paymentProvider: PaymentProvider; currency: Currency }>(
  brief: T,
  config: CheckoutConfig
): T {
  if (brief.paymentProvider === config.provider && brief.currency === config.currency) return brief;
  return { ...brief, paymentProvider: config.provider, currency: config.currency };
}
