/**
 * Integration tests for the Stripe webhook.
 *
 * Key invariants tested:
 *  - Rejects requests with no stripe-signature header
 *  - Rejects requests whose signature does not match (wrong secret)
 *  - Accepts a validly-signed checkout.session.completed and creates an order
 *  - Waits for asynchronous bank-transfer success before creating an order
 *  - Notifies the customer when an asynchronous payment fails
 *  - Duplicate stripe_session_id is idempotent (no duplicate order)
 *  - Rejects an amount/currency mismatch (spoofed metadata vs. actual charge)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import Stripe from 'stripe';

const WEBHOOK_SECRET = 'whsec_test_mock_secret';

vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_mock');
vi.stubEnv('STRIPE_WEBHOOK_SECRET', WEBHOOK_SECRET);
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('DB_PATH', path.join(os.tmpdir(), `sonnetary-stripe-webhook-${process.pid}-${crypto.randomUUID()}.db`));

const require = createRequire(import.meta.url);
const db = require('../db.cjs');
const emailModule = require('../email.cjs');
const sendConfirmationEmailMock = vi.spyOn(emailModule, 'sendConfirmationEmail').mockResolvedValue(undefined);
const sendPaymentFailureEmailMock = vi.spyOn(emailModule, 'sendPaymentFailureEmail').mockResolvedValue(undefined);

beforeEach(() => {
  db.prepare('DELETE FROM orders').run();
  sendConfirmationEmailMock.mockClear();
  sendPaymentFailureEmailMock.mockClear();
});

const { default: express } = await import('express');
const { default: stripeWebhookRouter } = await import('../routes/stripe-webhook.cjs');

// The webhook reads req.body as a raw Buffer, matching the server.cjs mount.
const app = express();
app.use('/api/stripe/webhook', express.raw({ type: '*/*' }), stripeWebhookRouter);

function sign(payload) {
  return Stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
}

function makeSessionCompletedPayload(sessionId, overrides = {}) {
  return JSON.stringify({
    id: `evt_${crypto.randomUUID()}`,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        payment_status: 'paid',
        amount_total: 2_500,
        currency: 'usd',
        customer_details: { email: 'customer@test.com' },
        metadata: {
          genre: 'Afro-Beats',
          customerEmail: 'customer@test.com',
          fastDelivery: 'false',
          currency: 'USD',
          originalAmount: '5000',
          discountedAmount: '2500',
          ...overrides,
        },
      },
    },
  });
}

describe('POST /api/stripe/webhook', () => {
  it('rejects a request with no stripe-signature header', async () => {
    const { default: supertest } = await import('supertest');
    const res = await supertest(app)
      .post('/api/stripe/webhook')
      .send(makeSessionCompletedPayload('cs_no_sig'))
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(401);
  });

  it('rejects a request with an invalid signature', async () => {
    const { default: supertest } = await import('supertest');
    const payload = makeSessionCompletedPayload('cs_bad_sig');
    const res = await supertest(app)
      .post('/api/stripe/webhook')
      .send(payload)
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 't=1,v1=deadbeef');

    expect(res.status).toBe(401);
  });

  it('accepts a validly-signed checkout.session.completed and creates the order', async () => {
    const { default: supertest } = await import('supertest');
    const payload = makeSessionCompletedPayload('cs_valid_001');

    const res = await supertest(app)
      .post('/api/stripe/webhook')
      .send(payload)
      .set('Content-Type', 'application/json')
      .set('stripe-signature', sign(payload));

    expect(res.status).toBe(200);

    const row = db.prepare('SELECT * FROM orders WHERE stripe_session_id = ?').get('cs_valid_001');
    expect(row).toBeTruthy();
    expect(row.amount).toBe(2_500);
    expect(row.customer_email).toBe('customer@test.com');
  });

  it('is idempotent on duplicate stripe_session_id', async () => {
    const { default: supertest } = await import('supertest');
    const payload = makeSessionCompletedPayload('cs_dup_001');

    await supertest(app)
      .post('/api/stripe/webhook')
      .send(payload)
      .set('Content-Type', 'application/json')
      .set('stripe-signature', sign(payload));

    await vi.waitFor(() => {
      expect(db.prepare('SELECT id FROM orders WHERE stripe_session_id = ?').get('cs_dup_001')).toBeTruthy();
    });

    await supertest(app)
      .post('/api/stripe/webhook')
      .send(payload)
      .set('Content-Type', 'application/json')
      .set('stripe-signature', sign(payload));

    const rows = db.prepare('SELECT id FROM orders WHERE stripe_session_id = ?').all('cs_dup_001');
    expect(rows).toHaveLength(1);
  });

  it('does not create an order when the charged amount does not match the quoted amount', async () => {
    const { default: supertest } = await import('supertest');
    // Metadata claims a $25 (2500) discounted order, but only 100 cents was charged.
    const payload = JSON.stringify({
      id: `evt_${crypto.randomUUID()}`,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_underpay_001',
          payment_status: 'paid',
          amount_total: 100,
          currency: 'usd',
          customer_details: { email: 'underpay@test.com' },
          metadata: { customerEmail: 'underpay@test.com', currency: 'USD' },
        },
      },
    });

    const res = await supertest(app)
      .post('/api/stripe/webhook')
      .send(payload)
      .set('Content-Type', 'application/json')
      .set('stripe-signature', sign(payload));

    // Webhook always 200s to Stripe (acking receipt) even when it rejects the order internally.
    expect(res.status).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(db.prepare('SELECT id FROM orders WHERE stripe_session_id = ?').get('cs_underpay_001')).toBeUndefined();
  });

  it('does not create an order when payment_status is not paid', async () => {
    const { default: supertest } = await import('supertest');
    const payload = JSON.stringify({
      id: `evt_${crypto.randomUUID()}`,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_unpaid_001',
          payment_status: 'unpaid',
          amount_total: 2_500,
          currency: 'usd',
          metadata: {},
        },
      },
    });

    const res = await supertest(app)
      .post('/api/stripe/webhook')
      .send(payload)
      .set('Content-Type', 'application/json')
      .set('stripe-signature', sign(payload));

    expect(res.status).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(db.prepare('SELECT id FROM orders WHERE stripe_session_id = ?').get('cs_unpaid_001')).toBeUndefined();
  });

  it('creates an NGN order only after an asynchronous bank transfer succeeds', async () => {
    const { default: supertest } = await import('supertest');
    const pendingPayload = JSON.stringify({
      id: `evt_${crypto.randomUUID()}`,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_ng_bank_transfer_001',
          payment_status: 'unpaid',
          amount_total: 3_000_000,
          currency: 'ngn',
          customer_details: { email: 'transfer@test.com' },
          metadata: {
            customerEmail: 'transfer@test.com',
            fastDelivery: 'false',
            currency: 'NGN',
            originalAmount: '6000000',
            discountedAmount: '3000000',
          },
        },
      },
    });

    const pendingRes = await supertest(app)
      .post('/api/stripe/webhook')
      .send(pendingPayload)
      .set('Content-Type', 'application/json')
      .set('stripe-signature', sign(pendingPayload));

    expect(pendingRes.status).toBe(200);
    expect(db.prepare('SELECT id FROM orders WHERE stripe_session_id = ?').get('cs_ng_bank_transfer_001')).toBeUndefined();

    const paidPayload = JSON.stringify({
      id: `evt_${crypto.randomUUID()}`,
      type: 'checkout.session.async_payment_succeeded',
      data: {
        object: {
          id: 'cs_ng_bank_transfer_001',
          payment_status: 'paid',
          amount_total: 3_000_000,
          currency: 'ngn',
          customer_details: { email: 'transfer@test.com' },
          metadata: {
            customerEmail: 'transfer@test.com',
            fastDelivery: 'false',
            currency: 'NGN',
            originalAmount: '6000000',
            discountedAmount: '3000000',
          },
        },
      },
    });

    const paidRes = await supertest(app)
      .post('/api/stripe/webhook')
      .send(paidPayload)
      .set('Content-Type', 'application/json')
      .set('stripe-signature', sign(paidPayload));

    expect(paidRes.status).toBe(200);
    expect(db.prepare('SELECT amount, currency FROM orders WHERE stripe_session_id = ?').get('cs_ng_bank_transfer_001'))
      .toMatchObject({ amount: 3_000_000, currency: 'ngn' });
  });

  it('does not create an order and notifies the customer when an asynchronous payment fails', async () => {
    const { default: supertest } = await import('supertest');
    const payload = JSON.stringify({
      id: `evt_${crypto.randomUUID()}`,
      type: 'checkout.session.async_payment_failed',
      data: {
        object: {
          id: 'cs_ng_bank_transfer_failed',
          payment_status: 'unpaid',
          amount_total: 3_000_000,
          currency: 'ngn',
          metadata: { customerEmail: 'failed-transfer@test.com' },
        },
      },
    });

    const res = await supertest(app)
      .post('/api/stripe/webhook')
      .send(payload)
      .set('Content-Type', 'application/json')
      .set('stripe-signature', sign(payload));

    expect(res.status).toBe(200);
    expect(db.prepare('SELECT id FROM orders WHERE stripe_session_id = ?').get('cs_ng_bank_transfer_failed')).toBeUndefined();
    expect(sendPaymentFailureEmailMock).toHaveBeenCalledWith({
      to: 'failed-transfer@test.com',
      reference: 'cs_ng_bank_transfer_failed',
    });
  });
});
