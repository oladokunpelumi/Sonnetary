import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
import { DISCOUNTED_PRICING, MIN_SPECIAL_MESSAGE_CHARS } from './constants';

// constants.tsx (client display) and server/pricing.cjs (server charge amount)
// are two independently hand-maintained tables with no shared source of truth —
// this is exactly what let the checkout page display a different price than it
// charged. This test is the guard: if either table is edited without the other,
// it fails loudly instead of silently shipping a mismatched price.
const require = createRequire(import.meta.url);
const { getAmount, getOriginalAmount } = require('./server/pricing.cjs');
const { runHardChecks } = require('./server/song-pipeline/code/hard-quality-checks.cjs');

describe('client/server price table parity', () => {
  it('NGN standard current/original amounts match server pricing.cjs', () => {
    expect(DISCOUNTED_PRICING.paystack.standard.amountKobo).toBe(getAmount('ngn', false));
    expect(DISCOUNTED_PRICING.paystack.standard.originalAmountKobo).toBe(getOriginalAmount('ngn', false));
  });

  it('NGN fast-delivery current/original amounts match server pricing.cjs', () => {
    expect(DISCOUNTED_PRICING.paystack.fast.amountKobo).toBe(getAmount('ngn', true));
    expect(DISCOUNTED_PRICING.paystack.fast.originalAmountKobo).toBe(getOriginalAmount('ngn', true));
  });

  it('USD standard current/original amounts match server pricing.cjs', () => {
    expect(DISCOUNTED_PRICING.stripe.standard.amountCents).toBe(getAmount('usd', false));
    expect(DISCOUNTED_PRICING.stripe.standard.originalAmountCents).toBe(getOriginalAmount('usd', false));
  });

  it('USD fast-delivery current/original amounts match server pricing.cjs', () => {
    expect(DISCOUNTED_PRICING.stripe.fast.amountCents).toBe(getAmount('usd', true));
    expect(DISCOUNTED_PRICING.stripe.fast.originalAmountCents).toBe(getOriginalAmount('usd', true));
  });

  it('display strings agree with the numeric amounts they represent', () => {
    expect(DISCOUNTED_PRICING.paystack.standard.current).toBe('₦30,000');
    expect(DISCOUNTED_PRICING.paystack.fast.current).toBe('₦40,000');
    expect(DISCOUNTED_PRICING.stripe.standard.current).toBe('$25');
    expect(DISCOUNTED_PRICING.stripe.fast.current).toBe('$32.50');
  });

  it('fast-delivery current price is exactly 50% off the original, on both currencies', () => {
    expect(DISCOUNTED_PRICING.paystack.fast.amountKobo).toBe(DISCOUNTED_PRICING.paystack.fast.originalAmountKobo * 0.5);
    expect(DISCOUNTED_PRICING.stripe.fast.amountCents).toBe(DISCOUNTED_PRICING.stripe.fast.originalAmountCents * 0.5);
  });
});

// MIN_SPECIAL_MESSAGE_CHARS gates the "What should the song say?" field on the
// client. It must stay >= the real applicability threshold inside
// chorusEchoesHeartMessage (server/song-pipeline/code/hard-quality-checks.cjs) —
// below that threshold the hard quality check for the chorus reports "not
// applicable" and passes by default, silently disabling the chorus's only
// objective quality gate. These tests exercise the REAL runHardChecks, not our
// own constant, so they fail if either side moves out of sync.
function stateWithHeartMessage(heartMessage: string) {
  return {
    normalized_form: { heart_message: heartMessage, recipient_name: '' },
    suno_output: {
      lyrics: {
        intro: 'placeholder', verse_1: 'placeholder', pre_chorus: 'placeholder',
        chorus: 'a completely unrelated chorus line for this test',
        verse_2: 'placeholder', bridge: 'placeholder', final_chorus: 'placeholder', outro: 'placeholder',
      },
    },
    validated_input: { input_depth: 'thin' },
  };
}

describe('special-message length threshold stays in sync with the hard quality check', () => {
  it('a message at exactly MIN_SPECIAL_MESSAGE_CHARS makes the chorus-echo check applicable', () => {
    const heartMessage = 'everything'; // 10 chars, one real word > 3 chars, not a stopword
    expect(heartMessage.length).toBe(MIN_SPECIAL_MESSAGE_CHARS);
    const result = runHardChecks(stateWithHeartMessage(heartMessage));
    expect(result.chorus_echoes_heart_message).not.toBeNull();
  });

  it('a message one character shorter makes the chorus-echo check silently not-applicable', () => {
    const heartMessage = 'everythin'; // 9 chars — one below the threshold
    expect(heartMessage.length).toBe(MIN_SPECIAL_MESSAGE_CHARS - 1);
    const result = runHardChecks(stateWithHeartMessage(heartMessage));
    expect(result.chorus_echoes_heart_message).toBeNull();
  });
});
