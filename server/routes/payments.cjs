const express = require('express');
const router = express.Router();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// POST /api/create-checkout-session
router.post('/create-checkout-session', async (req, res) => {
    try {
        const { mood, genre, tempo, story } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Custom Song — Sonnetary',
                            description: `Genre: ${genre || 'TBD'} | Mood: ${mood || 'TBD'} | Tempo: ${tempo || 100} BPM`,
                        },
                        unit_amount: 2000, // $20.00
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/#/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/#/payment-cancel`,
            metadata: {
                mood: mood || '',
                genre: genre || '',
                tempo: String(tempo || 100),
                story: (story || '').substring(0, 500), // Stripe metadata has a 500 char limit
            },
        });

        res.json({ url: session.url, sessionId: session.id });
    } catch (err) {
        console.error('Stripe error:', err);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// GET /api/verify-session/:sessionId — verify a completed session
router.get('/verify-session/:sessionId', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
        res.json({
            paid: session.payment_status === 'paid',
            customerEmail: session.customer_details?.email,
            metadata: session.metadata,
        });
    } catch (err) {
        console.error('Session verify error:', err);
        res.status(500).json({ error: 'Failed to verify session' });
    }
});

module.exports = router;
