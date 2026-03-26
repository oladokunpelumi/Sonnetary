/**
 * Integration tests for the orders API routes.
 * Uses an in-memory SQLite DB so no state is shared between test runs.
 */
import { describe, it, expect, beforeAll, vi } from 'vitest';

// ── Mock environment before any module imports ────────────────────────────────
vi.stubEnv('PAYSTACK_SECRET_KEY', 'sk_test_mock');
vi.stubEnv('NODE_ENV', 'test');

// Stub the DB module with an in-memory SQLite instance
vi.mock('../db.cjs', async () => {
  const Database = (await import('better-sqlite3')).default;
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.exec(`
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
            customer_email TEXT,
            ai_brief TEXT,
            recipient_type TEXT,
            sender_name TEXT,
            voice_gender TEXT,
            special_qualities TEXT,
            favorite_memories TEXT,
            special_message TEXT
        );
    `);
  return { default: db };
});

import express from 'express';
import ordersRouter from '../routes/orders.cjs';

const app = express();
app.use(express.json());
app.use('/api/orders', ordersRouter);

// Simple fetch helper for tests
async function req(method, path, body) {
  const { default: supertest } = await import('supertest');
  const r = supertest(app)[method.toLowerCase()](path);
  if (body) r.send(body).set('Content-Type', 'application/json');
  return r;
}

describe('POST /api/orders', () => {
  it('creates a new order', async () => {
    const { default: supertest } = await import('supertest');
    const res = await supertest(app)
      .post('/api/orders')
      .send({
        songTitle: 'Test Song',
        genre: 'Afro-Beats',
        paystackReference: 'ref_001',
        customerEmail: 'test@example.com',
      })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.songTitle).toBe('Test Song');
  });

  it('returns existing order on duplicate paystackReference (idempotency)', async () => {
    const { default: supertest } = await import('supertest');

    const first = await supertest(app)
      .post('/api/orders')
      .send({ genre: 'Gospel', paystackReference: 'ref_idem_001' })
      .set('Content-Type', 'application/json');

    const second = await supertest(app)
      .post('/api/orders')
      .send({ genre: 'Gospel', paystackReference: 'ref_idem_001' })
      .set('Content-Type', 'application/json');

    expect(first.status).toBe(201);
    expect(second.status).toBe(200); // returns existing
    expect(first.body.id).toBe(second.body.id);
  });

  it('rejects invalid email', async () => {
    const { default: supertest } = await import('supertest');
    const res = await supertest(app)
      .post('/api/orders')
      .send({ customerEmail: 'not-an-email' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });
});

describe('GET /api/orders/:id', () => {
  it('returns 404 for unknown order', async () => {
    const { default: supertest } = await import('supertest');
    const res = await supertest(app).get('/api/orders/non-existent-id');
    expect(res.status).toBe(404);
  });

  it('returns an existing order', async () => {
    const { default: supertest } = await import('supertest');

    const created = await supertest(app)
      .post('/api/orders')
      .send({ songTitle: 'My Song', genre: 'Afro-Jazz', paystackReference: 'ref_get_001' })
      .set('Content-Type', 'application/json');

    const fetched = await supertest(app).get(`/api/orders/${created.body.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.id).toBe(created.body.id);
    expect(fetched.body.genre).toBe('Afro-Jazz');
  });
});

describe('GET /api/orders/track', () => {
  it('returns 400 without an email', async () => {
    const { default: supertest } = await import('supertest');
    const res = await supertest(app).get('/api/orders/track');
    expect(res.status).toBe(400);
  });

  it('returns orders for a customer email', async () => {
    const { default: supertest } = await import('supertest');

    await supertest(app)
      .post('/api/orders')
      .send({
        genre: 'Afro-R&B',
        paystackReference: 'ref_track_001',
        customerEmail: 'customer@test.com',
      })
      .set('Content-Type', 'application/json');

    const res = await supertest(app).get('/api/orders/track?email=customer@test.com');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
