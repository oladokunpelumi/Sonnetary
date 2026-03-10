/**
 * PostgreSQL database adapter for Sonnetary.
 * Used when DATABASE_URL is set in the environment (e.g. Railway Postgres add-on).
 *
 * Provides the same synchronous-style API as better-sqlite3 so the rest of the
 * codebase doesn't need to change. Internally we use a connection pool and
 * expose a thin wrapper that mirrors the SQLite `db.prepare().get/all/run()` API
 * by running queries synchronously via Deasync — or by providing an async-safe
 * wrapper. For simplicity, this module exports an adapter object used via
 * monkey-patching in db.cjs.
 *
 * NOTE: For a true async approach, each route would need to be fully async.
 * This adapter provides the interface; the actual async calls happen in the routes.
 */
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
    console.error('[PostgreSQL] Unexpected pool error', err.message);
});

/**
 * Run a query and return all rows.
 * @param {string} text  - Parameterized SQL
 * @param {any[]}  params - Query parameters
 * @returns {Promise<any[]>}
 */
async function all(text, params = []) {
    const { rows } = await pool.query(text, params);
    return rows;
}

/**
 * Run a query and return the first row (or undefined).
 */
async function get(text, params = []) {
    const { rows } = await pool.query(text, params);
    return rows[0];
}

/**
 * Run a query (INSERT / UPDATE / DELETE) and return metadata.
 */
async function run(text, params = []) {
    const result = await pool.query(text, params);
    return { changes: result.rowCount };
}

/**
 * Execute a raw SQL string (no params). Used for DDL / migrations.
 */
async function exec(sql) {
    await pool.query(sql);
}

/**
 * Create all required tables in PostgreSQL.
 */
async function initSchema() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS songs (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            genre TEXT NOT NULL,
            duration TEXT NOT NULL,
            description TEXT NOT NULL,
            cover_url TEXT NOT NULL,
            artist TEXT,
            tags TEXT,
            audio_url TEXT,
            story TEXT
        );

        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            song_title TEXT,
            genre TEXT,
            mood TEXT,
            tempo INTEGER,
            occasion TEXT,
            story TEXT,
            status TEXT DEFAULT 'in_production',
            created_at TEXT NOT NULL,
            delivery_date TEXT NOT NULL,
            stripe_session_id TEXT,
            paystack_reference TEXT,
            amount INTEGER DEFAULT 30000,
            recipient_type TEXT,
            sender_name TEXT,
            voice_gender TEXT,
            special_qualities TEXT,
            favorite_memories TEXT,
            special_message TEXT,
            customer_email TEXT,
            ai_brief TEXT
        );

        CREATE TABLE IF NOT EXISTS magic_links (
            token TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            used INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL
        );
    `);
    console.log('[PostgreSQL] Schema initialized');
}

module.exports = { pool, all, get, run, exec, initSchema };
