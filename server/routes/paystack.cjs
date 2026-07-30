const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { z } = require('zod');
const { isFastDelivery } = require('../pricing.cjs');
const { getClientUrlFromRequest } = require('../client-url.cjs');
const { quoteCheckout, quoteMetadata, parsePromoMetadata } = require('../promos.cjs');
const { createPaidOrder } = require('../services/paid-order.cjs');

const InitializeSchema = z.object({
    email: z.string().email().optional().or(z.literal('')),
    // amount is intentionally absent — price is always SONG_PRICE_KOBO, never client-controlled
    metadata: z.record(z.string(), z.unknown()).optional(),
    promoCode: z.string().max(100).optional(),
    fullPrice: z.union([z.boolean(), z.string()]).optional(),
});

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

function getPaystackSecretKey() {
    return process.env.PAYSTACK_SECRET_KEY;
}

function safeMetadataValue(value) {
    return String(value || '').substring(0, 500);
}

function buildCheckoutMetadata(metadata, customerEmail, quote) {
    return {
        customerEmail,
        recipientType: safeMetadataValue(metadata.recipientType),
        senderName: safeMetadataValue(metadata.senderName),
        genre: safeMetadataValue(metadata.genre),
        occasion: safeMetadataValue(metadata.occasion),
        occasionDetail: safeMetadataValue(metadata.occasionDetail),
        voiceGender: safeMetadataValue(metadata.voiceGender),
        specialQualities: safeMetadataValue(metadata.specialQualities),
        favoriteMemories: safeMetadataValue(metadata.favoriteMemories),
        specialMessage: safeMetadataValue(metadata.specialMessage),
        recipientName: safeMetadataValue(metadata.recipientName),
        fastDelivery: isFastDelivery(metadata.fastDelivery) ? 'true' : 'false',
        paymentMethod: 'bank_transfer',
        ...quoteMetadata(quote),
    };
}

async function fetchPaystackTransaction(reference) {
    const paystackSecret = getPaystackSecretKey();
    if (!paystackSecret) {
        const error = new Error('Payment gateway not configured.');
        error.statusCode = 503;
        throw error;
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${paystackSecret}`,
            'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
    });
    const body = await response.json();
    if (!response.ok || !body.status || !body.data) {
        const error = new Error(body.message || 'Paystack could not verify this transaction.');
        error.statusCode = response.status >= 400 ? response.status : 502;
        throw error;
    }
    return body.data;
}

async function validatePaidBankTransfer(transaction) {
    if (
        transaction.status !== 'success'
        || transaction.channel !== 'bank_transfer'
        || String(transaction.currency || '').toLowerCase() !== 'ngn'
        || typeof transaction.amount !== 'number'
    ) {
        return false;
    }

    const metadata = transaction.metadata || {};
    const promo = parsePromoMetadata(metadata);
    if (promo.currency && promo.currency !== 'ngn') return false;

    const fastDelivery = metadata.fastDelivery;
    const currentQuote = await quoteCheckout({ provider: 'paystack', currency: 'ngn', fastDelivery });
    const fullQuote = await quoteCheckout({
        provider: 'paystack',
        currency: 'ngn',
        fastDelivery,
        fullPrice: true,
    });
    const allowedAmounts = new Set([
        currentQuote.finalAmount,
        fullQuote.finalAmount,
        Math.round(fullQuote.originalAmount * 0.5),
    ]);

    if (Number.isFinite(promo.discountedAmount)) {
        return allowedAmounts.has(promo.discountedAmount)
            && transaction.amount === promo.discountedAmount;
    }
    return allowedAmounts.has(transaction.amount);
}

// ── Initialize a Paystack transaction ─────────────────────────────────────────
router.post('/initialize', async (req, res) => {
    const parsed = InitializeSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid checkout request.' });
    }

    try {
        const { email, metadata, promoCode, fullPrice } = parsed.data;
        const customerEmail = email || 'guest@yourgbedu.com';
        const resolvedMetadata = metadata || {};
        const quote = await quoteCheckout({
            provider: 'paystack',
            fastDelivery: resolvedMetadata.fastDelivery,
            promoCode,
            fullPrice,
        });
        if (quote.finalAmount <= 0) {
            return res.status(400).json({ error: 'This promo code should be completed through free checkout.' });
        }
        const amount = quote.finalAmount;
        const paystackSecret = getPaystackSecretKey();

        if (!paystackSecret) {
            return res.status(503).json({ error: 'Payment gateway not configured.' });
        }

        const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${paystackSecret}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: customerEmail,
                amount,
                currency: 'NGN',
                channels: ['bank_transfer'],
                callback_url: `${getClientUrlFromRequest(req)}/#/payment-success`,
                metadata: buildCheckoutMetadata(resolvedMetadata, customerEmail, quote),
            }),
        });

        const data = await response.json();

        if (data.status) {
            // Abandoned-checkout signal for the Win-Back flow. Only for a real email
            // (not the guest placeholder); fire-and-forget, env-gated.
            if (email) {
                require('../services/klaviyo.cjs').track('Started Checkout', {
                    email,
                    properties: {
                        sender_name: safeMetadataValue(resolvedMetadata.senderName),
                        recipient_name: safeMetadataValue(resolvedMetadata.recipientName),
                        recipient_type: safeMetadataValue(resolvedMetadata.recipientType),
                        occasion: safeMetadataValue(resolvedMetadata.occasion),
                        genre: safeMetadataValue(resolvedMetadata.genre),
                        fast_delivery: isFastDelivery(resolvedMetadata.fastDelivery),
                        provider: 'paystack',
                        promo_code: 'YOURGBEDU50',
                    },
                    profileProps: resolvedMetadata.senderName ? { first_name: safeMetadataValue(resolvedMetadata.senderName) } : {},
                });
            }
            res.json({
                authorization_url: data.data.authorization_url,
                access_code: data.data.access_code,
                reference: data.data.reference,
            });
        } else {
            console.error('Paystack Initialization Error:', data.message);
            res.status(400).json({ error: data.message });
        }
    } catch (err) {
        console.error('Error initializing Paystack transaction', err);
        res.status(err.statusCode || 500).json({ error: err.message || 'Failed to initialize transaction' });
    }
});

// ── Verify a Paystack transaction (client-side fallback) ──────────────────────
router.get('/verify/:reference', async (req, res) => {
    try {
        const { reference } = req.params;
        const transaction = await fetchPaystackTransaction(reference);
        if (transaction.status !== 'success') {
            return res.json({
                paid: false,
                paymentStatus: transaction.status,
                message: 'Paystack is still confirming your bank transfer.',
            });
        }

        if (!(await validatePaidBankTransfer(transaction))) {
            return res.status(402).json({
                paid: false,
                paymentStatus: transaction.status,
                error: 'The confirmed payment does not match this bank-transfer checkout.',
            });
        }

        return res.json({
            paid: true,
            paymentStatus: transaction.status,
            amount: transaction.amount,
            currency: 'ngn',
            channel: transaction.channel,
            customerEmail: transaction.customer?.email,
            metadata: transaction.metadata || {},
        });
    } catch (err) {
        console.error('Error verifying Paystack transaction:', err.message);
        res.status(err.statusCode || 500).json({ error: err.message || 'Failed to verify transaction' });
    }
});

// ── Paystack Webhook ──────────────────────────────────────────────────────────
// Paystack signs webhooks with the merchant's secret key (same as PAYSTACK_SECRET_KEY).
// https://paystack.com/docs/payments/webhooks/#verify-event-origin
router.post('/webhook', async (req, res) => {
    const signature = req.headers['x-paystack-signature'];
    const paystackSecret = getPaystackSecretKey();

    if (!signature) {
        console.warn('[Webhook] Missing x-paystack-signature header — rejected');
        return res.status(401).json({ error: 'Missing signature' });
    }
    if (!paystackSecret) {
        console.error('[Webhook] PAYSTACK_SECRET_KEY missing');
        return res.status(503).json({ error: 'Webhook secret not configured' });
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');

    const hash = crypto
        .createHmac('sha512', paystackSecret)
        .update(rawBody)
        .digest('hex');

    const hashBuffer = Buffer.from(hash, 'utf8');
    const signatureBuffer = Buffer.from(String(signature), 'utf8');
    if (hashBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(hashBuffer, signatureBuffer)) {
        console.warn('[Webhook] Invalid signature — rejected');
        return res.status(401).json({ error: 'Invalid signature' });
    }

    let event;
    try {
        event = JSON.parse(rawBody.toString());
    } catch {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }

    try {
        if (event.event === 'charge.success') {
            const reference = event.data?.reference;
            if (!reference) {
                console.error('[Paystack Webhook] charge.success missing reference');
                return res.sendStatus(200);
            }

            const transaction = await fetchPaystackTransaction(reference);
            if (transaction.status !== 'success') {
                throw new Error(`Paystack transaction ${reference} is not successful yet.`);
            }
            if (transaction.reference !== reference || !(await validatePaidBankTransfer(transaction))) {
                console.error('[Paystack Webhook] Verified transaction did not match bank-transfer order', reference);
                return res.sendStatus(200);
            }

            const metadata = transaction.metadata || {};
            await createPaidOrder({
                reference,
                referenceColumn: 'paystack_reference',
                provider: 'paystack',
                currency: 'ngn',
                verifiedAmount: transaction.amount,
                metadata: {
                    ...metadata,
                    customerEmail: metadata.customerEmail || transaction.customer?.email,
                },
            });
        } else if (event.event === 'bank.transfer.rejected') {
            console.warn(
                '[Paystack Webhook] Bank transfer rejected; no order created',
                event.data?.reference || '(missing reference)'
            );
        }
        return res.sendStatus(200);
    } catch (err) {
        // Returning a non-2xx response allows Paystack to retry a transient
        // verification or database failure instead of losing a paid order.
        console.error('[Paystack Webhook] Event processing failed:', err);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
});

module.exports = router;
module.exports.fetchPaystackTransaction = fetchPaystackTransaction;
module.exports.validatePaidBankTransfer = validatePaidBankTransfer;
