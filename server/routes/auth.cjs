const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db.cjs');
const { sendMagicLinkEmail } = require('../email.cjs');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret_change_in_prod';
const TOKEN_TTL_MINUTES = 15;

// ── Ensure magic_links table exists ──────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS magic_links (
    token TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0
  );
`);

// ── Ensure users table exists ─────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL
  );
`);

// POST /api/auth/request — send a magic link to the given email
router.post('/request', async (req, res) => {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

    // Store the token
    db.prepare('INSERT INTO magic_links (token, email, expires_at, used) VALUES (?, ?, ?, 0)')
        .run(token, normalizedEmail, expiresAt);

    // Send the email (silently skips if RESEND_API_KEY not configured)
    await sendMagicLinkEmail({ to: normalizedEmail, token });

    res.json({ message: 'If that email has orders, a sign-in link has been sent.' });
});

// GET /api/auth/verify?token=xxx — exchange token for a JWT
router.get('/verify', (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token is required.' });

    const record = db.prepare('SELECT * FROM magic_links WHERE token = ?').get(token);

    if (!record) return res.status(401).json({ error: 'Invalid or expired link.' });
    if (record.used) return res.status(401).json({ error: 'Link already used.' });
    if (new Date(record.expires_at) < new Date()) {
        return res.status(401).json({ error: 'Link has expired. Please request a new one.' });
    }

    // Mark token used
    db.prepare('UPDATE magic_links SET used = 1 WHERE token = ?').run(token);

    // Upsert user
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(record.email);
    let userId;
    if (existing) {
        userId = existing.id;
    } else {
        userId = require('crypto').randomUUID();
        db.prepare('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)')
            .run(userId, record.email, new Date().toISOString());
    }

    const isAdmin = record.email.toLowerCase() === (process.env.ADMIN_EMAIL || 'admin@yourgbedu.com').toLowerCase();
    const jwtToken = jwt.sign(
        { userId, email: record.email, role: isAdmin ? 'admin' : 'user' },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.json({ token: jwtToken, email: record.email });
});

// GET /api/auth/me — return the current user's info from their JWT
router.get('/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const payload = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        res.json({ userId: payload.userId, email: payload.email, role: payload.role });
    } catch {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
});

module.exports = router;
