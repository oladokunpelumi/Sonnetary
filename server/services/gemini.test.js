import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Pins the CURRENT behavior of the admin AI production-brief service before any
// refactor touches it. This file previously had zero test coverage, and it swallows
// every provider error into buildFallbackBrief (gemini.cjs:274-277), so a regression
// here would be silent — callers can never observe that generation actually failed.
const { generateProductionBrief, buildFallbackBrief } = await import('./gemini.cjs');

const ORDER = {
  recipientType: 'Wife',
  recipientName: 'Aisha',
  senderName: 'Tunde',
  genre: 'Afro-R&B',
  occasion: 'anniversary',
  occasionDetail: '5 years married',
  voiceGender: 'Female Voice',
  specialQualities: 'Kind and steady',
  favoriteMemories: 'Lekki rooftop dinner',
  specialMessage: 'Everything good has your fingerprints on it',
};

const ALL_PROVIDER_ENV_KEYS = [
  'LLM_PROVIDER',
  'LLM_MODEL',
  'GROQ_API_KEY',
  'OPENROUTER_API_KEY',
  'OPENROUTER_BASE_URL',
  'OPENAI_API_KEY',
  'GOOGLE_API_KEY',
  'GEMINI_API_KEY',
];

function clearProviderEnv() {
  for (const key of ALL_PROVIDER_ENV_KEYS) vi.stubEnv(key, '');
}

describe('generateProductionBrief — provider selection and request shape', () => {
  let fetchMock;

  beforeEach(() => {
    clearProviderEnv();
    fetchMock = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('routes to Groq (openai/v1-compatible) when GROQ_API_KEY is set, with the default model', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-groq-key');
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'Groq brief text' } }] }), { status: 200 })
    );

    const result = await generateProductionBrief(ORDER);

    expect(result).toBe('Groq brief text');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(init.headers.Authorization).toBe('Bearer test-groq-key');
    const body = JSON.parse(init.body);
    expect(body.model).toBe('llama-3.3-70b-versatile');
    expect(body.temperature).toBe(0.55);
    expect(body.max_tokens).toBe(650);
  });

  it('routes to OpenRouter when only OPENROUTER_API_KEY is set (Groq takes precedence over it)', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-or-key');
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'OpenRouter brief' } }] }), { status: 200 })
    );

    const result = await generateProductionBrief(ORDER);

    expect(result).toBe('OpenRouter brief');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(init.headers['HTTP-Referer']).toBeDefined();
    expect(init.headers['X-Title']).toBe('YourGbedu Admin');
    const body = JSON.parse(init.body);
    expect(body.model).toBe('openai/gpt-4o-mini');
  });

  it('honors OPENROUTER_BASE_URL override', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-or-key');
    vi.stubEnv('OPENROUTER_BASE_URL', 'https://custom-router.test/api/v1');
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), { status: 200 })
    );

    await generateProductionBrief(ORDER);

    expect(fetchMock.mock.calls[0][0]).toBe('https://custom-router.test/api/v1/chat/completions');
  });

  it('routes to OpenAI when only OPENAI_API_KEY is set, with gpt-4o-mini default', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-openai-key');
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'OpenAI brief' } }] }), { status: 200 })
    );

    const result = await generateProductionBrief(ORDER);

    expect(result).toBe('OpenAI brief');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    // Only OpenRouter gets HTTP-Referer/X-Title
    expect(init.headers['HTTP-Referer']).toBeUndefined();
    const body = JSON.parse(init.body);
    expect(body.model).toBe('gpt-4o-mini');
  });

  it('LLM_MODEL overrides the per-provider default', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-openai-key');
    vi.stubEnv('LLM_MODEL', 'gpt-4o-custom');
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), { status: 200 })
    );

    await generateProductionBrief(ORDER);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe('gpt-4o-custom');
  });

  it('LLM_PROVIDER forces the provider regardless of which keys are set', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-groq-key');
    vi.stubEnv('OPENAI_API_KEY', 'test-openai-key');
    vi.stubEnv('LLM_PROVIDER', 'openai');
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), { status: 200 })
    );

    await generateProductionBrief(ORDER);

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.openai.com/v1/chat/completions');
  });

  it('does not call fetch at all when no provider key is configured (google short-circuits, falls back)', async () => {
    // No keys at all -> normalizeProvider() returns 'fallback' -> buildFallbackBrief
    // directly, without ever reaching an HTTP-compatible branch or the Google SDK.
    const result = await generateProductionBrief(ORDER);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBe(buildFallbackBrief(ORDER));
  });

  it('a Google/Gemini key with no other provider key routes to google and short-circuits on missing key before touching the SDK', async () => {
    // callGoogle() checks `if (!apiKey) throw` before constructing GoogleGenAI, so
    // clearing the key while routing to 'google' exercises the catch->fallback path
    // without ever making a real network call to Google's API.
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('GOOGLE_API_KEY', '');
    vi.stubEnv('LLM_PROVIDER', 'google');

    const result = await generateProductionBrief(ORDER);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBe(buildFallbackBrief(ORDER));
  });
});

describe('generateProductionBrief — error handling swallows into buildFallbackBrief', () => {
  let fetchMock;

  beforeEach(() => {
    clearProviderEnv();
    fetchMock = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('a non-ok HTTP response never throws — returns the deterministic fallback', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-openai-key');
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'rate limited' } }), { status: 429 })
    );

    const result = await generateProductionBrief(ORDER);

    expect(result).toBe(buildFallbackBrief(ORDER));
  });

  it('a network error (fetch rejects) never throws — returns the deterministic fallback', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-openai-key');
    fetchMock.mockRejectedValue(new Error('network blip'));

    const result = await generateProductionBrief(ORDER);

    expect(result).toBe(buildFallbackBrief(ORDER));
  });

  it('an empty response body never throws — returns the deterministic fallback', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-openai-key');
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '' } }] }), { status: 200 }));

    const result = await generateProductionBrief(ORDER);

    expect(result).toBe(buildFallbackBrief(ORDER));
  });
});

describe('buildFallbackBrief', () => {
  it('is deterministic and includes the occasion arc and order details', () => {
    const brief = buildFallbackBrief(ORDER);
    expect(brief).toContain('anniversary');
    expect(brief).toContain('Tunde');
    expect(brief).toContain('Afro-R&B');
    expect(brief).toBe(buildFallbackBrief(ORDER));
  });
});
