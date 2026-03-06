const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db.cjs');

const DELIVERY_DAYS = 3;

const PRODUCTION_STEPS = [
    { title: 'Brief Received', desc: 'Your story and preferences have been analyzed.', icon: 'check' },
    { title: 'Composing', desc: 'Lyrics drafted and melody structure finalized.', icon: 'music_note' },
    { title: 'Studio Recording', desc: 'Our vocalists are currently laying down tracks.', icon: 'mic' },
    { title: 'Mixing', desc: 'Balancing levels and adding effects.', icon: 'tune' },
    { title: 'Final Mastering', desc: 'Preparing the track for distribution.', icon: 'album' },
];

function computeOrderProgress(order) {
    const createdAt = new Date(order.created_at);
    const deliveryDate = new Date(order.delivery_date);
    const now = new Date();

    const totalMs = deliveryDate.getTime() - createdAt.getTime();
    const elapsedMs = now.getTime() - createdAt.getTime();
    const overallProgress = Math.max(0, Math.min(1, elapsedMs / totalMs));

    // Map overall progress to 5 steps (each step = 20%)
    const currentStepIndex = Math.min(4, Math.floor(overallProgress * 5));
    const stepProgress = Math.round(((overallProgress * 5) - currentStepIndex) * 100);

    // Compute time left
    const remainingMs = Math.max(0, deliveryDate.getTime() - now.getTime());
    const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

    const steps = PRODUCTION_STEPS.map((step, i) => ({
        ...step,
        status: i < currentStepIndex ? 'Completed' : i === currentStepIndex ? 'In Progress' : 'Upcoming',
        active: i === currentStepIndex,
        locked: i > currentStepIndex,
        progress: i === currentStepIndex ? stepProgress : i < currentStepIndex ? 100 : 0,
    }));

    return {
        id: order.id,
        songTitle: order.song_title || 'Custom Song',
        genre: order.genre || 'Not specified',
        mood: order.mood,
        tempo: order.tempo,
        occasion: order.occasion,
        story: order.story,
        status: overallProgress >= 1 ? 'completed' : 'in_production',
        createdAt: order.created_at,
        deliveryDate: order.delivery_date,
        overallProgress: Math.round(overallProgress * 100),
        currentStep: currentStepIndex + 1,
        steps,
        timeLeft: { days, hours, minutes, seconds },
        amount: order.amount,
    };
}

// GET /api/orders/track — return orders for a specific email
router.get('/track', (req, res) => {
    try {
        const email = req.query.email?.toString().toLowerCase();
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Match orders stored in sessionStorage or where email is kept 
        // Note: Right now order table doesn't have customer_email. We will need to add customer_email to orders soon.
        const orders = db.prepare('SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC').all(email);
        const formatted = orders.map(computeOrderProgress);
        res.json(formatted);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/orders/:id — return single order status
router.get('/:id', (req, res) => {
    try {
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        res.json(computeOrderProgress(order));
    } catch (err) {
        console.error('Error fetching order:', err);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// POST /api/orders — create a new order
router.post('/', (req, res) => {
    try {
        const { songTitle, genre, mood, tempo, occasion, story, stripeSessionId, paystackReference, customerEmail } = req.body;

        const id = uuidv4();
        const createdAt = new Date().toISOString();
        const deliveryDate = new Date(Date.now() + DELIVERY_DAYS * 24 * 60 * 60 * 1000).toISOString();

        // Also save customer_email into the database if passed down
        db.prepare(`
      INSERT INTO orders (id, song_title, genre, mood, tempo, occasion, story, status, created_at, delivery_date, stripe_session_id, paystack_reference, amount, customer_email)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'in_production', ?, ?, ?, ?, 30000, ?)
    `).run(id, songTitle || 'Custom Song', genre, mood, tempo, occasion, story, createdAt, deliveryDate, stripeSessionId, paystackReference, customerEmail || null);

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
        res.status(201).json(computeOrderProgress(order));
    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

module.exports = router;
