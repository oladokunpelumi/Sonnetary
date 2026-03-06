require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

// ─── Env Validation ───────────────────────────────────────────────────────────
const REQUIRED_ENV = ['PAYSTACK_SECRET_KEY'];
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

const app = express();
const PORT = process.env.SERVER_PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const IS_PROD = process.env.NODE_ENV === 'production';

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());

// CORS: restrict to known client URL in production
app.use(
    cors({
        origin: IS_PROD ? CLIENT_URL : true,
        credentials: true,
    })
);

// Rate limiting on payment endpoints
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── Body Parsing ─────────────────────────────────────────────────────────────
// Raw body needed for webhook signature verification (must come before express.json())
app.use('/api/paystack/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use('/musics', express.static(path.join(__dirname, '..', 'musics')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/songs', songsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api', paymentsRouter); // legacy Stripe routes
app.use('/api/paystack', paymentLimiter, paystackRouter);
app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

app.listen(PORT, () => {
    console.log(`🎵 Sonnetary server running on http://localhost:${PORT}`);
    console.log(`📁 Serving audio from: ${path.join(__dirname, '..', 'musics')}`);
    console.log(`🔐 CORS origin: ${IS_PROD ? CLIENT_URL : 'all (dev mode)'}`);
});
