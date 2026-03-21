const express = require('express');
const router = express.Router();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// POST /api/create-checkout-session
router.post('/create-checkout-session', async (req, res) => {
    try {
        const {
            email,
            customerEmail,
            recipientType,
            senderName,
            genre,
            voiceGender,
            specialQualities,
            favoriteMemories,
            specialMessage,
        } = req.body;

        const resolvedEmail = email || customerEmail || 'guest@yourgbedu.com';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: resolvedEmail,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Custom Song — YourGbedu',
                            description: `A personalised ${genre || 'custom'} song crafted just for your ${recipientType || 'loved one'}.`,
                        },
                        unit_amount: 2500, // $25.00 USD
                    },
                    quantity: 1,
                },
            ],
            // Success URL uses hash routing — session_id sits inside the hash so
            // location.search works correctly in the React app.
            success_url: `${CLIENT_URL}/#/payment-success?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
            cancel_url: `${CLIENT_URL}/#/create`,
            metadata: {
                customerEmail: resolvedEmail,
                recipientType: (recipientType || '').substring(0, 500),
                senderName: (senderName || '').substring(0, 500),
                genre: (genre || '').substring(0, 500),
                voiceGender: (voiceGender || '').substring(0, 500),
                specialQualities: (specialQualities || '').substring(0, 500),
                favoriteMemories: (favoriteMemories || '').substring(0, 500),
                specialMessage: (specialMessage || '').substring(0, 500),
            },
        });

        res.json({ url: session.url, sessionId: session.id });
    } catch (err) {
        console.error('[Stripe] Checkout session error:', err);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// GET /api/verify-session/:sessionId — verify a completed Stripe session
router.get('/verify-session/:sessionId', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
        res.json({
            paid: session.payment_status === 'paid',
            amount: session.amount_total, // in cents
            customerEmail: session.customer_details?.email || session.customer_email,
            metadata: session.metadata,
        });
    } catch (err) {
        console.error('[Stripe] Session verify error:', err);
        res.status(500).json({ error: 'Failed to verify session' });
    }
});

module.exports = router;
