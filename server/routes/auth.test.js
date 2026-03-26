/**
 * Integration tests for the auth API routes.
 */
import { describe, it, expect, vi } from 'vitest';

vi.stubEnv('PAYSTACK_SECRET_KEY', 'sk_test_mock');
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('JWT_SECRET', 'test-secret-for-testing-only');

// In-memory DB for auth tests
vi.mock('../db.cjs', async () => {
  const Database = (await import('better-sqlite3')).default;
  const db = new Database(':memory:');
  db.exec(`
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
  return { default: db };
});

vi.mock('../email.cjs', () => ({
  sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined),
  sendConfirmationEmail: vi.fn().mockResolvedValue(undefined),
}));

import express from 'express';
import authRouter from '../routes/auth.cjs';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('POST /api/auth/request', () => {
  it('accepts a valid email', async () => {
    const { default: supertest } = await import('supertest');
    const res = await supertest(app)
      .post('/api/auth/request')
      .send({ email: 'hello@example.com' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.message).toBeTruthy();
  });

  it('rejects an invalid email', async () => {
    const { default: supertest } = await import('supertest');
    const res = await supertest(app)
      .post('/api/auth/request')
      .send({ email: 'not-valid' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/verify', () => {
  it('returns 401 for unknown token', async () => {
    const { default: supertest } = await import('supertest');
    const res = await supertest(app).get('/api/auth/verify?token=invalid');
    expect(res.status).toBe(401);
  });

  it('issues a JWT for a valid token', async () => {
    const { default: supertest } = await import('supertest');
    const crypto = await import('crypto');

    // Manually insert a valid magic link token
    const db = (await import('../db.cjs')).default;
    const token = crypto.randomBytes(16).toString('hex');
    const expires = new Date(Date.now() + 60000).toISOString();
    db.prepare('INSERT INTO magic_links (token, email, expires_at, used) VALUES (?, ?, ?, 0)').run(
      token,
      'verify@example.com',
      expires
    );

    const res = await supertest(app).get(`/api/auth/verify?token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.email).toBe('verify@example.com');
  });

  it('rejects a used token', async () => {
    const { default: supertest } = await import('supertest');
    const crypto = await import('crypto');

    const db = (await import('../db.cjs')).default;
    const token = crypto.randomBytes(16).toString('hex');
    const expires = new Date(Date.now() + 60000).toISOString();
    db.prepare('INSERT INTO magic_links (token, email, expires_at, used) VALUES (?, ?, ?, 1)').run(
      token,
      'used@example.com',
      expires
    );

    const res = await supertest(app).get(`/api/auth/verify?token=${token}`);
    expect(res.status).toBe(401);
  });
});
