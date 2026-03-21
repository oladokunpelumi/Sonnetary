require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

// ─── Env Validation ───────────────────────────────────────────────────────────
const IS_PROD = process.env.NODE_ENV === 'production';

const REQUIRED_ENV = [
    'PAYSTACK_SECRET_KEY',
    ...(IS_PROD ? ['JWT_SECRET', 'ADMIN_PASSWORD', 'CLIENT_URL'] : []),
];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('   Copy .env.example to .env.local and fill in the required values.');
    process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Initialize database (creates tables + seeds data)
require('./db.cjs');

const songsRouter = require('./routes/songs.cjs');
const ordersRouter = require('./routes/orders.cjs');
const paymentsRouter = require('./routes/payments.cjs');
const paystackRouter = require('./routes/paystack.cjs');
const adminRouter = require('./routes/admin.cjs');
const authRouter = require('./routes/auth.cjs');
const geoRouter = require('./routes/geo.cjs');

const app = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
    // Allow inline scripts needed for the SPA in production
    contentSecurityPolicy: IS_PROD ? undefined : false,
}));

// CORS: restrict to known client URL in production
app.use(
    cors({
        origin: IS_PROD ? CLIENT_URL : true,
        credentials: true,
    })
);

// ─── Rate Limiters ────────────────────────────────────────────────────────────
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: { error: 'Too many sign-in attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const generalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── Body Parsing ─────────────────────────────────────────────────────────────
// Raw body needed for webhook signature verification (must come before express.json())
app.use('/api/paystack/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10kb' }));

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use('/musics', express.static(path.join(__dirname, '..', 'musics')));

// Serve the built React SPA in production
if (IS_PROD) {
    const distPath = path.join(__dirname, '..', 'dist');
    app.use(express.static(distPath, { index: false }));
}

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', generalApiLimiter);
app.use('/api/songs', songsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api', paymentsRouter); // legacy Stripe routes
app.use('/api/paystack', paymentLimiter, paystackRouter);
app.use('/api/admin', adminRouter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/geo', geoRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ─── SPA Fallback (production only) ──────────────────────────────────────────
// Must come after all API routes so non-API paths serve index.html
if (IS_PROD) {
    const distPath = path.join(__dirname, '..', 'dist');
    app.get('/{*path}', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`🎵 YourGbedu server running on http://localhost:${PORT}`);
    console.log(`📁 Serving audio from: ${path.join(__dirname, '..', 'musics')}`);
    console.log(`🔐 CORS origin: ${IS_PROD ? CLIENT_URL : 'all (dev mode)'}`);
    if (IS_PROD) {
        console.log(`🌐 Serving SPA from: ${path.join(__dirname, '..', 'dist')}`);
    }
});
