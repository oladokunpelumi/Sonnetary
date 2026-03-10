const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');
const db = require('../db.cjs');

const DELIVERY_DAYS = 3;

const PRODUCTION_STEPS = [
    { title: 'Brief Received', desc: 'Your story and preferences have been analyzed.', icon: 'check' },
    { title: 'Composing', desc: 'Lyrics drafted and melody structure finalized.', icon: 'music_note' },
    { title: 'Studio Recording', desc: 'Our vocalists are currently laying down tracks.', icon: 'mic' },
    { title: 'Mixing', desc: 'Balancing levels and adding effects.', icon: 'tune' },
    { title: 'Final Mastering', desc: 'Preparing the track for distribution.', icon: 'album' },
];

// ── Validation schema ─────────────────────────────────────────────────────────
const CreateOrderSchema = z.object({
    songTitle: z.string().max(200).optional(),
    genre: z.string().max(100).optional(),
    mood: z.string().max(100).optional(),
    tempo: z.number().int().min(40).max(300).optional(),
    occasion: z.string().max(200).optional(),
    story: z.string().max(5000).optional(),
    stripeSessionId: z.string().max(500).optional(),
    paystackReference: z.string().max(200).optional(),
    customerEmail: z.string().email().optional().or(z.literal('')),
    recipientType: z.string().max(100).optional(),
    senderName: z.string().max(200).optional(),
    voiceGender: z.string().max(100).optional(),
    specialQualities: z.string().max(5000).optional(),
    favoriteMemories: z.string().max(5000).optional(),
    specialMessage: z.string().max(5000).optional(),
});

function computeOrderProgress(order) {
    const createdAt = new Date(order.created_at);
    const deliveryDate = new Date(order.delivery_date);
    const now = new Date();

    const totalMs = deliveryDate.getTime() - createdAt.getTime();
    const elapsedMs = now.getTime() - createdAt.getTime();
    const overallProgress = Math.max(0, Math.min(1, elapsedMs / totalMs));

    const currentStepIndex = Math.min(4, Math.floor(overallProgress * 5));
    const stepProgress = Math.round(((overallProgress * 5) - currentStepIndex) * 100);

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
        status: overallProgress >= 1 ? 'completed' : order.status || 'in_production',
        createdAt: order.created_at,
        deliveryDate: order.delivery_date,
        overallProgress: Math.round(overallProgress * 100),
        currentStep: currentStepIndex + 1,
        steps,
        timeLeft: { days, hours, minutes, seconds },
        amount: order.amount,
        aiBrief: order.ai_brief || null,
    };
}

// GET /api/orders/track — return orders for a specific email
router.get('/track', (req, res) => {
    try {
        const email = req.query.email?.toString().toLowerCase().trim();
        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'A valid email is required.' });
        }

        const orders = db.prepare(
            'SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC'
        ).all(email);

        res.json(orders.map(computeOrderProgress));
    } catch (err) {
        console.error('Error fetching orders by email:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/orders/:id — return single order status (supports full UUID or 8-char short ID)
router.get('/:id', (req, res) => {
    try {
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
            ?? db.prepare("SELECT * FROM orders WHERE UPPER(SUBSTR(id, 1, 8)) = UPPER(?) LIMIT 1").get(req.params.id.slice(0, 8));
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(computeOrderProgress(order));
    } catch (err) {
        console.error('Error fetching order:', err);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// POST /api/orders — create a new order (client-side fallback after payment)
router.post('/', (req, res) => {
    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid request data.', details: parsed.error.flatten() });
    }

    const { songTitle, genre, mood, tempo, occasion, story, stripeSessionId, paystackReference, customerEmail, recipientType, senderName, voiceGender, specialQualities, favoriteMemories, specialMessage } = parsed.data;

    try {
        // Idempotency: if an order for this payment reference already exists, return it
        if (paystackReference) {
            const existing = db.prepare('SELECT * FROM orders WHERE paystack_reference = ?').get(paystackReference);
            if (existing) {
                return res.status(200).json(computeOrderProgress(existing));
            }
        }
        if (stripeSessionId) {
            const existing = db.prepare('SELECT * FROM orders WHERE stripe_session_id = ?').get(stripeSessionId);
            if (existing) {
                return res.status(200).json(computeOrderProgress(existing));
            }
        }

        const id = uuidv4();
        const createdAt = new Date().toISOString();
        const deliveryDate = new Date(Date.now() + DELIVERY_DAYS * 24 * 60 * 60 * 1000).toISOString();

        db.prepare(`
            INSERT INTO orders (
                id, song_title, genre, mood, tempo, occasion, story,
                status, created_at, delivery_date,
                stripe_session_id, paystack_reference, amount, customer_email,
                recipient_type, sender_name, voice_gender,
                special_qualities, favorite_memories, special_message
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'in_production', ?, ?, ?, ?, 30000, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id,
            songTitle || 'Custom Song',
            genre || '',
            mood || '',
            tempo || 100,
            occasion || '',
            story || '',
            createdAt,
            deliveryDate,
            stripeSessionId || null,
            paystackReference || null,
            customerEmail || null,
            recipientType || '',
            senderName || '',
            voiceGender || '',
            specialQualities || '',
            favoriteMemories || '',
            specialMessage || ''
        );

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
        res.status(201).json(computeOrderProgress(order));
    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

module.exports = router;
