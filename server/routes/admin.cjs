const express = require('express');
const router = express.Router();
const db = require('../db.cjs');
const { generateToken, requireAdmin } = require('../middleware/auth.cjs');
const { sendCompletionEmail } = require('../email.cjs');

// POST /api/admin/login — create an admin JWT for the dashboard
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    const validUser = process.env.ADMIN_USERNAME || 'admin';
    const validPass = process.env.ADMIN_PASSWORD || 'sonnetary2026';

    if (username === validUser && password === validPass) {
        // Issue an admin token
        const token = generateToken({ id: 'admin-id', role: 'admin' });
        return res.json({ token });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
});

// GET /api/admin/orders — paginated orders, most recent first
// Query params: ?page=1&limit=25&status=in_production&search=
router.get('/orders', requireAdmin, (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
        const offset = (page - 1) * limit;
        const statusFilter = req.query.status;
        const search = req.query.search?.toString().trim();

        let where = '';
        const params = [];

        if (statusFilter && ['in_production', 'completed', 'cancelled'].includes(statusFilter)) {
            where += ' AND status = ?';
            params.push(statusFilter);
        }
        if (search) {
            where += ' AND (sender_name LIKE ? OR customer_email LIKE ? OR id LIKE ?)';
            const like = `%${search}%`;
            params.push(like, like, like);
        }

        const total = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE 1=1${where}`).get(...params).count;
        const orders = db.prepare(`SELECT * FROM orders WHERE 1=1${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);

        res.json({
            data: orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        });
    } catch (err) {
        console.error('Admin: Error fetching orders:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/admin/stats — summary stats
router.get('/stats', requireAdmin, (req, res) => {
    try {
        const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
        const totalRevenue = db.prepare('SELECT SUM(amount) as total FROM orders').get().total || 0;
        const songCount = db.prepare('SELECT COUNT(*) as count FROM songs').get().count;
        res.json({ totalOrders, totalRevenue, songCount });
    } catch (err) {
        console.error('Admin: Error fetching stats:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// PATCH /api/admin/orders/:id/status — update order status
router.patch('/orders/:id/status', requireAdmin, (req, res) => {
    const { status } = req.body;
    const validStatuses = ['in_production', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    try {
        const result = db
            .prepare('UPDATE orders SET status = ? WHERE id = ?')
            .run(status, req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

        // Send completion email to customer when status is marked completed
        if (status === 'completed' && order?.customer_email) {
            sendCompletionEmail({
                to: order.customer_email,
                orderId: order.id.slice(0, 8).toUpperCase(),
                genre: order.genre,
                senderName: order.sender_name,
                recipientType: order.recipient_type,
            });
        }

        res.json(order);
    } catch (err) {
        console.error('Admin: Error updating order status:', err);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// GET /api/admin/songs — all songs
router.get('/songs', requireAdmin, (req, res) => {
    try {
        const songs = db.prepare('SELECT * FROM songs ORDER BY id ASC').all();
        res.json(songs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch songs' });
    }
});

module.exports = router;
