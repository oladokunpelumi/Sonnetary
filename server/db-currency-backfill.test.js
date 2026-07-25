/**
 * Regression test for the currency/fast_delivery backfill logic in
 * server/db.cjs — applied to orders created before those columns existed.
 *
 * currency: Paystack orders are always NGN; Stripe orders created before
 * Naira-on-Stripe shipped are unambiguously USD (that capability didn't
 * exist yet, so this isn't a guess).
 * fast_delivery: derived from the delivery window (24h fast vs 48h standard)
 * rather than amount, since amount comparisons break across price/promo changes.
 *
 * The exact backfill SQL is duplicated here (rather than imported) because
 * server/db.cjs runs it once at module load, against whatever rows already
 * exist at that time — there's no exported standalone function to call
 * against synthetic "historical" rows after the fact. Keep this in sync with
 * the migration block in server/db.cjs if that logic ever changes.
 */
import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';

function runBackfill(db) {
  db.exec(`UPDATE orders SET currency = 'ngn' WHERE currency IS NULL AND paystack_reference IS NOT NULL`);
  db.exec(`UPDATE orders SET currency = 'usd' WHERE currency IS NULL AND stripe_session_id IS NOT NULL`);
  db.exec(`UPDATE orders SET currency = 'ngn' WHERE currency IS NULL`);
  db.exec(`
    UPDATE orders SET fast_delivery = CASE
      WHEN (julianday(delivery_date) - julianday(created_at)) * 24 < 36 THEN 1
      ELSE 0
    END
    WHERE fast_delivery IS NULL
  `);
}

function makeTestDb() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE orders (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      delivery_date TEXT NOT NULL,
      stripe_session_id TEXT,
      paystack_reference TEXT,
      currency TEXT,
      fast_delivery INTEGER
    )
  `);
  return db;
}

describe('currency/fast_delivery historical backfill', () => {
  it('classifies a pre-existing Paystack order as NGN', () => {
    const db = makeTestDb();
    db.prepare(`
      INSERT INTO orders (id, created_at, delivery_date, paystack_reference)
      VALUES ('order-1', '2026-01-01T00:00:00.000Z', '2026-01-03T00:00:00.000Z', 'ref_historical_001')
    `).run();

    runBackfill(db);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get('order-1');
    expect(order.currency).toBe('ngn');
  });

  it('classifies a pre-existing Stripe order as USD (predates Naira-on-Stripe)', () => {
    const db = makeTestDb();
    db.prepare(`
      INSERT INTO orders (id, created_at, delivery_date, stripe_session_id)
      VALUES ('order-2', '2026-01-01T00:00:00.000Z', '2026-01-03T00:00:00.000Z', 'cs_historical_001')
    `).run();

    runBackfill(db);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get('order-2');
    expect(order.currency).toBe('usd');
  });

  it('defaults an orphaned order (neither reference set, e.g. an old free order) to NGN', () => {
    const db = makeTestDb();
    db.prepare(`
      INSERT INTO orders (id, created_at, delivery_date)
      VALUES ('order-3', '2026-01-01T00:00:00.000Z', '2026-01-03T00:00:00.000Z')
    `).run();

    runBackfill(db);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get('order-3');
    expect(order.currency).toBe('ngn');
  });

  it('classifies a 48h delivery window as standard (not fast)', () => {
    const db = makeTestDb();
    db.prepare(`
      INSERT INTO orders (id, created_at, delivery_date, paystack_reference)
      VALUES ('order-4', '2026-01-01T00:00:00.000Z', '2026-01-03T00:00:00.000Z', 'ref_std_001')
    `).run();

    runBackfill(db);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get('order-4');
    expect(order.fast_delivery).toBe(0);
  });

  it('classifies a 24h delivery window as fast', () => {
    const db = makeTestDb();
    db.prepare(`
      INSERT INTO orders (id, created_at, delivery_date, paystack_reference)
      VALUES ('order-5', '2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z', 'ref_fast_001')
    `).run();

    runBackfill(db);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get('order-5');
    expect(order.fast_delivery).toBe(1);
  });

  it('does not overwrite currency/fast_delivery that are already set (idempotent, new-row-safe)', () => {
    const db = makeTestDb();
    db.prepare(`
      INSERT INTO orders (id, created_at, delivery_date, stripe_session_id, currency, fast_delivery)
      VALUES ('order-6', '2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z', 'cs_already_set_001', 'ngn', 1)
    `).run();

    runBackfill(db);

    // Even though this is a Stripe order (which would normally backfill to
    // 'usd'), an already-populated value must be left alone.
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get('order-6');
    expect(order.currency).toBe('ngn');
    expect(order.fast_delivery).toBe(1);
  });
});
