const express = require('express');
const router = express.Router();
const { normalizeCurrency } = require('../pricing.cjs');
const { quoteCheckout, parsePromoMetadata } = require('../promos.cjs');
const { createPaidOrder } = require('../services/paid-order.cjs');

let stripeClient;
function getStripeClient() {
    if (!stripeClient) {
        stripeClient = require('stripe')(process.env.STRIPE_SECRET_KEY);
    }
    return stripeClient;
}

async function validateSessionAmount({ metadata, currency, amountTotal }) {
    if (typeof amountTotal !== 'number') return false;
    const promo = parsePromoMetadata(metadata || {});
    if (promo.currency && promo.currency !== normalizeCurrency(currency)) return false;

    const fastDelivery = metadata?.fastDelivery;
    const currentQuote = await quoteCheckout({ provider: 'stripe', currency, fastDelivery });
    const fullQuote = await quoteCheckout({ provider: 'stripe', currency, fastDelivery, fullPrice: true });
    const allowed = new Set([
        currentQuote.finalAmount,
        fullQuote.finalAmount,
        Math.round(fullQuote.originalAmount * 0.5),
    ]);

    if (Number.isFinite(promo.discountedAmount)) {
        return allowed.has(promo.discountedAmount) && amountTotal === promo.discountedAmount;
    }
    return allowed.has(amountTotal);
}

async function createOrderForPaidSession(session) {
    if (session.payment_status !== 'paid') return false;

    const currency = normalizeCurrency(session.currency);
    const metadata = session.metadata || {};
    const amountValid = await validateSessionAmount({
        metadata,
        currency,
        amountTotal: session.amount_total,
    });
    if (!amountValid) {
        console.error('[Stripe Webhook] Amount/currency mismatch for session', session.id);
        return false;
    }

    await createPaidOrder({
        reference: session.id,
        referenceColumn: 'stripe_session_id',
        provider: 'stripe',
        currency,
        verifiedAmount: session.amount_total,
        metadata: {
            ...metadata,
            customerEmail: metadata.customerEmail || session.customer_details?.email || session.customer_email,
        },
    });
    return true;
}

async function notifyAsyncPaymentFailure(session) {
    const email = session.metadata?.customerEmail || session.customer_details?.email || session.customer_email;
    if (!email) {
        console.warn('[Stripe Webhook] Async payment failed without a customer email for session', session.id);
        return;
    }
    await require('../email.cjs').sendPaymentFailureEmail({
        to: email,
        reference: session.id,
    });
}

// ── Stripe Webhook ────────────────────────────────────────────────────────────
// This is the authoritative order-creator for Stripe payments — without it, a
// customer who closes the tab after paying would have a paid session that never
// becomes an order. Both immediate and delayed confirmations use the same
// idempotent paid-session path; unpaid/failed transfers never start production.
router.post('/', async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET missing');
        return res.status(503).json({ error: 'Webhook secret not configured' });
    }
    if (!signature) {
        console.warn('[Stripe Webhook] Missing stripe-signature header — rejected');
        return res.status(401).json({ error: 'Missing signature' });
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
    let event;
    try {
        event = getStripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
        console.warn('[Stripe Webhook] Signature verification failed:', err.message);
        return res.status(401).json({ error: 'Invalid signature' });
    }

    try {
        const session = event.data.object;
        if (
            event.type === 'checkout.session.completed'
            || event.type === 'checkout.session.async_payment_succeeded'
        ) {
            await createOrderForPaidSession(session);
        } else if (event.type === 'checkout.session.async_payment_failed') {
            await notifyAsyncPaymentFailure(session);
        }
        return res.sendStatus(200);
    } catch (err) {
        // Returning a non-2xx response lets Stripe retry transient database or
        // internal processing failures instead of silently losing the event.
        console.error('[Stripe Webhook] Event processing failed:', err);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
});

router.__setStripeClientForTests = (client) => {
    stripeClient = client;
};

module.exports = router;
