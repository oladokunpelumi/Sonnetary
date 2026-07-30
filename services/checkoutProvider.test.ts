import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchCheckoutConfig,
  paymentProviderFromGeo,
  reconcileCheckoutConfig,
  reconcilePaymentProvider,
} from './checkoutProvider';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('checkout payment provider resolution', () => {
  it('defaults Nigerian geo responses to Stripe Card', () => {
    expect(paymentProviderFromGeo({ country: 'NG', isNigeria: true })).toBe('stripe');
  });

  it('keeps Stripe available for non-Nigerian geo responses', () => {
    expect(paymentProviderFromGeo({ country: 'US', isNigeria: false })).toBe('stripe');
  });

  it('defaults to Stripe Card when geo detection fails or returns no usable answer', () => {
    expect(paymentProviderFromGeo(null)).toBe('stripe');
    expect(paymentProviderFromGeo({})).toBe('stripe');
  });

  it('can still reconcile an explicitly selected Paystack bank-transfer brief', () => {
    const brief = {
      customerEmail: 'customer@example.com',
      fastDelivery: false,
      paymentProvider: 'stripe' as const,
    };

    expect(reconcilePaymentProvider(brief, 'paystack')).toEqual({
      customerEmail: 'customer@example.com',
      fastDelivery: false,
      paymentProvider: 'paystack',
    });
  });
});

describe('fetchCheckoutConfig (server-side source of truth)', () => {
  it('returns the server config when the request succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          provider: 'stripe',
          currency: 'ngn',
          country: 'NG',
          paymentMethods: ['card', 'bank_transfer'],
        }),
      }))
    );

    expect(await fetchCheckoutConfig()).toEqual({
      provider: 'stripe',
      currency: 'ngn',
      country: 'NG',
      paymentMethods: ['card', 'bank_transfer'],
    });
  });

  it('normalizes an unexpected currency value to ngn', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ provider: 'paystack', currency: 'weird', country: 'NG' }),
      }))
    );

    expect(await fetchCheckoutConfig()).toEqual({
      provider: 'paystack',
      currency: 'ngn',
      country: 'NG',
      paymentMethods: ['card'],
    });
  });

  it('fails open to Stripe Card in NGN when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false }))
    );

    expect(await fetchCheckoutConfig()).toEqual({
      provider: 'stripe',
      currency: 'ngn',
      paymentMethods: ['card'],
    });
  });

  it('fails open to Stripe Card in NGN when fetch throws (offline/network error)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      })
    );

    expect(await fetchCheckoutConfig()).toEqual({
      provider: 'stripe',
      currency: 'ngn',
      paymentMethods: ['card'],
    });
  });

  it('fails open when the response shape is unexpected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ nonsense: true }) }))
    );

    expect(await fetchCheckoutConfig()).toEqual({
      provider: 'stripe',
      currency: 'ngn',
      paymentMethods: ['card'],
    });
  });
});

describe('reconcileCheckoutConfig', () => {
  it('updates both provider and currency when they drift from server config', () => {
    const brief = { paymentProvider: 'paystack' as const, currency: 'ngn' as const };
    const next = reconcileCheckoutConfig(brief, {
      provider: 'stripe',
      currency: 'usd',
      paymentMethods: ['card'],
    });
    expect(next).toEqual({ paymentProvider: 'stripe', currency: 'usd' });
  });

  it('returns the same reference when already in sync (avoids unnecessary re-saves)', () => {
    const brief = { paymentProvider: 'stripe' as const, currency: 'usd' as const };
    expect(reconcileCheckoutConfig(brief, {
      provider: 'stripe',
      currency: 'usd',
      paymentMethods: ['card'],
    })).toBe(brief);
  });

  it('handles the Stripe-for-Naira case: provider stripe, currency ngn', () => {
    const brief = { paymentProvider: 'paystack' as const, currency: 'ngn' as const };
    const next = reconcileCheckoutConfig(brief, {
      provider: 'stripe',
      currency: 'ngn',
      paymentMethods: ['card', 'bank_transfer'],
    });
    expect(next).toEqual({ paymentProvider: 'stripe', currency: 'ngn' });
  });
});
