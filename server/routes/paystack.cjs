const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../db.cjs');
const { sendConfirmationEmail } = require('../email.cjs');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET || PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const DELIVERY_DAYS = 3;

// ── Initialize a Paystack transaction ─────────────────────────────────────────
router.post('/initialize', async (req, res) => {
    try {
        const { email, amount, metadata } = req.body;
        const customerEmail = email || 'guest@sonnetary.com';

        const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: customerEmail,
                amount: amount || 3000000, // 30,000 NGN in Kobo
                currency: 'NGN',
                callback_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-success`,
                metadata: { ...metadata, customerEmail },
            }),
        });

        const data = await response.json();

        if (data.status) {
            res.json({ authorization_url: data.data.authorization_url, reference: data.data.reference });
        } else {
            console.error('Paystack Initialization Error:', data.message);
            res.status(400).json({ error: data.message });
        }
    } catch (error) {
        console.error('Error initializing Paystack transaction:', error);
        res.status(500).json({ error: 'Failed to initialize transaction' });
    }
});

// ── Verify a Paystack transaction (client-side fallback) ──────────────────────
router.get('/verify/:reference', async (req, res) => {
    try {
        const { reference } = req.params;
        const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (data.status && data.data.status === 'success') {
            res.json({ paid: true, amount: data.data.amount, metadata: data.data.metadata });
        } else {
            res.json({ paid: false, message: 'Transaction not successful' });
        }
    } catch (error) {
        console.error('Error verifying Paystack transaction:', error);
        res.status(500).json({ error: 'Failed to verify transaction' });
    }
});

// ── Paystack Webhook (server-side order creation) ─────────────────────────────
// This is the reliable way to create orders — Paystack calls this URL after payment.
router.post('/webhook', (req, res) => {
    // Verify Paystack HMAC signature
    const signature = req.headers['x-paystack-signature'];
    const hash = crypto
        .createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
        .update(req.body) // req.body is raw Buffer here
        .digest('hex');

    if (hash !== signature) {
        console.warn('[Webhook] Invalid signature — request rejected');
        return res.status(400).json({ error: 'Invalid signature' });
    }

    let event;
    try {
        event = JSON.parse(req.body.toString());
    } catch {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }

    // Acknowledge webhook immediately before doing heavy work
    res.sendStatus(200);

    if (event.event === 'charge.success') {
        const { reference, metadata, customer, amount } = event.data;

        // Idempotency: don't create duplicate orders
        const existing = db.prepare('SELECT id FROM orders WHERE paystack_reference = ?').get(reference);
        if (existing) {
            console.log(`[Webhook] Order for reference ${reference} already exists, skipping.`);
            return;
        }

        const id = uuidv4();
        const createdAt = new Date().toISOString();
        const deliveryDate = new Date(
            Date.now() + DELIVERY_DAYS * 24 * 60 * 60 * 1000
        ).toISOString();

        try {
            db.prepare(`
        INSERT INTO orders (
            id, song_title, genre, mood, tempo, occasion, story, status, created_at, delivery_date, paystack_reference, amount,
            recipient_type, sender_name, voice_gender, special_qualities, favorite_memories, special_message
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'in_production', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
                id,
                'Custom Song',
                metadata?.genre || '',
                '', // mood deprecated
                100, // tempo deprecated
                '',  // occasion deprecated
                '',  // story deprecated
                createdAt,
                deliveryDate,
                reference,
                amount,
                metadata?.recipientType || '',
                metadata?.senderName || '',
                metadata?.voiceGender || '',
                metadata?.specialQualities || '',
                metadata?.favoriteMemories || '',
                metadata?.specialMessage || ''
            );

            console.log(`[Webhook] ✅ Created order ${id} for reference ${reference}`);

            // Send confirmation email
            const customerEmail = metadata?.customerEmail || customer?.email;
            if (customerEmail) {
                sendConfirmationEmail({
                    to: customerEmail,
                    orderId: id.slice(0, 8).toUpperCase(),
                    genre: metadata?.genre,
                    mood: metadata?.mood,
                    deliveryDate,
                    reference,
                });
            }
        } catch (err) {
            console.error('[Webhook] Error creating order:', err);
        }
    }
});

module.exports = router;
