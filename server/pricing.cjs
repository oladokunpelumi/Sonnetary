const PRICING = {
    ngn: {
        standardKobo: 3_000_000, // ₦30,000 discounted from ₦60,000 (50% off)
        standardOriginalKobo: 6_000_000,
        fastDeliveryKobo: 4_000_000, // ₦40,000 discounted from ₦80,000 (50% off)
        fastDeliveryOriginalKobo: 8_000_000,
        fastDeliveryUpgradeKobo: 1_000_000,
    },
    usd: {
        standardCents: 2_500, // $25 discounted from $50 (50% off)
        standardOriginalCents: 5_000,
        fastDeliveryCents: 3_250, // $32.50 discounted from $65 (50% off)
        fastDeliveryOriginalCents: 6_500,
        fastDeliveryUpgradeCents: 750,
    },
};

function isFastDelivery(value) {
    return value === true || value === 'true' || value === 1 || value === '1';
}

function normalizeCurrency(currency) {
    const lower = String(currency || '').toLowerCase();
    return lower === 'usd' ? 'usd' : 'ngn';
}

// Currency-keyed pricing — the source of truth. Provider no longer implies
// currency: Stripe can charge NGN (card or bank transfer) or USD depending on
// geo/config.
function getAmount(currency, fastDelivery) {
    const table = PRICING[normalizeCurrency(currency)];
    const fast = isFastDelivery(fastDelivery);
    if (table === PRICING.ngn) return fast ? table.fastDeliveryKobo : table.standardKobo;
    return fast ? table.fastDeliveryCents : table.standardCents;
}

function getOriginalAmount(currency, fastDelivery) {
    const table = PRICING[normalizeCurrency(currency)];
    const fast = isFastDelivery(fastDelivery);
    if (table === PRICING.ngn) return fast ? table.fastDeliveryOriginalKobo : table.standardOriginalKobo;
    return fast ? table.fastDeliveryOriginalCents : table.standardOriginalCents;
}

// Legacy provider-keyed helpers — kept for the Paystack fallback path.
function getPaystackAmountKobo(metadata = {}) {
    return getAmount('ngn', metadata.fastDelivery);
}

function getPaystackOriginalAmountKobo(metadata = {}) {
    return getOriginalAmount('ngn', metadata.fastDelivery);
}

function getStripeAmountCents(fastDelivery) {
    return getAmount('usd', fastDelivery);
}

function getStripeOriginalAmountCents(fastDelivery) {
    return getOriginalAmount('usd', fastDelivery);
}

module.exports = {
    PRICING,
    isFastDelivery,
    normalizeCurrency,
    getAmount,
    getOriginalAmount,
    getPaystackAmountKobo,
    getPaystackOriginalAmountKobo,
    getStripeAmountCents,
    getStripeOriginalAmountCents,
};
