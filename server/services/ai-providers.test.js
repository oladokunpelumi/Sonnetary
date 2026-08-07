import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const {
  resolveProviderChain,
  resolveModelId,
  roleForModelId,
  classifyLlmError,
  describeChain,
  getProvider,
  __setProviderModelsForTests,
  __resetProvidersForTests,
} = await import('./ai-providers.cjs');

const ALL_ENV_KEYS = [
  'AI_PROVIDER',
  'AI_PROVIDER_FALLBACK',
  'OPENROUTER_API_KEY',
  'OPENROUTER_BASE_URL',
  'AGENTROUTER_API_KEY',
  'AGENTROUTER_BASE_URL',
  'GROQ_API_KEY',
  'OPENAI_API_KEY',
  'GOOGLE_API_KEY',
  'GEMINI_API_KEY',
  'YG_MODEL_INTAKE',
  'YG_MODEL_SONNET',
  'LLM_MODEL',
];

function clearEnv() {
  for (const key of ALL_ENV_KEYS) vi.stubEnv(key, '');
}

beforeEach(() => {
  clearEnv();
});

afterEach(() => {
  __resetProvidersForTests();
});

describe('resolveProviderChain', () => {
  it('defaults to openrouter alone when AI_PROVIDER/AI_PROVIDER_FALLBACK are unset (today\'s behavior, byte-for-byte)', () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const chain = resolveProviderChain();
    expect(chain).toHaveLength(1);
    expect(chain[0].id).toBe('openrouter');
    expect(chain[0].baseUrl).toBe('https://openrouter.ai/api/v1');
    expect(chain[0].apiKey).toBe('test-key');
  });

  it('honors AI_PROVIDER_FALLBACK as a comma-separated ordered list', () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'or-key');
    vi.stubEnv('AGENTROUTER_API_KEY', 'ar-key');
    vi.stubEnv('AI_PROVIDER_FALLBACK', 'agentrouter');
    const chain = resolveProviderChain();
    expect(chain.map((p) => p.id)).toEqual(['openrouter', 'agentrouter']);
  });

  it('drops a provider with no resolvable API key and keeps the rest', () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'or-key');
    // AGENTROUTER_API_KEY intentionally left unset
    vi.stubEnv('AI_PROVIDER_FALLBACK', 'agentrouter');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const chain = resolveProviderChain();
    warnSpy.mockRestore();
    expect(chain.map((p) => p.id)).toEqual(['openrouter']);
  });

  it('drops an unknown provider id without throwing', () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'or-key');
    vi.stubEnv('AI_PROVIDER_FALLBACK', 'totally-not-a-provider');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const chain = resolveProviderChain();
    warnSpy.mockRestore();
    expect(chain.map((p) => p.id)).toEqual(['openrouter']);
  });

  it('throws when the resolved chain is empty', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => resolveProviderChain()).toThrow(/No AI provider available/);
    warnSpy.mockRestore();
  });

  it('honors baseUrlEnv overrides', () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'or-key');
    vi.stubEnv('OPENROUTER_BASE_URL', 'https://custom.test/v1');
    const chain = resolveProviderChain();
    expect(chain[0].baseUrl).toBe('https://custom.test/v1');
  });

  it('opts.provider/opts.fallback override env', () => {
    vi.stubEnv('AI_PROVIDER', 'openrouter');
    vi.stubEnv('OPENROUTER_API_KEY', 'or-key');
    vi.stubEnv('AGENTROUTER_API_KEY', 'ar-key');
    const chain = resolveProviderChain({ provider: 'agentrouter', fallback: '' });
    expect(chain.map((p) => p.id)).toEqual(['agentrouter']);
  });

  it('agentrouter sends no HTTP-Referer/X-Title (those are OpenRouter-specific and would leak CLIENT_URL)', () => {
    vi.stubEnv('AGENTROUTER_API_KEY', 'ar-key');
    const chain = resolveProviderChain({ provider: 'agentrouter' });
    expect(chain[0].headers).toEqual({});
  });

  it('openrouter sends HTTP-Referer/X-Title', () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'or-key');
    const chain = resolveProviderChain();
    expect(chain[0].headers['X-Title']).toBe('YourGbedu Admin');
    expect(chain[0].headers['HTTP-Referer']).toBeTruthy();
  });
});

describe('resolveModelId', () => {
  it('returns the provider default for a role with no override', () => {
    expect(resolveModelId('openrouter', 'writer')).toBe('anthropic/claude-sonnet-4.6');
    expect(resolveModelId('openrouter', 'intake')).toBe('anthropic/claude-haiku-4.5');
  });

  it('YG_MODEL_SONNET overrides the writer role for openrouter', () => {
    vi.stubEnv('YG_MODEL_SONNET', 'anthropic/claude-opus-4.7');
    expect(resolveModelId('openrouter', 'writer')).toBe('anthropic/claude-opus-4.7');
  });

  it('LLM_MODEL overrides both intake and writer for openrouter (legacy global override)', () => {
    vi.stubEnv('LLM_MODEL', 'some/override-model');
    expect(resolveModelId('openrouter', 'intake')).toBe('some/override-model');
    expect(resolveModelId('openrouter', 'writer')).toBe('some/override-model');
  });

  it('a role-specific override wins over the LLM_MODEL global override', () => {
    vi.stubEnv('LLM_MODEL', 'global-override');
    vi.stubEnv('YG_MODEL_INTAKE', 'specific-override');
    expect(resolveModelId('openrouter', 'intake')).toBe('specific-override');
  });

  it('agentrouter ignores LLM_MODEL entirely — it holds OpenRouter-style IDs that would 404', () => {
    vi.stubEnv('LLM_MODEL', 'anthropic/claude-sonnet-4.6');
    expect(resolveModelId('agentrouter', 'writer')).toBeNull();
  });

  it('returns null for an unknown provider or unknown role', () => {
    expect(resolveModelId('not-a-provider', 'writer')).toBeNull();
    expect(resolveModelId('openrouter', 'not-a-role')).toBeNull();
  });

  it('__setProviderModelsForTests / __resetProvidersForTests round-trip', () => {
    __setProviderModelsForTests('agentrouter', { writer: 'discovered-model-id' });
    expect(resolveModelId('agentrouter', 'writer')).toBe('discovered-model-id');
    __resetProvidersForTests();
    expect(resolveModelId('agentrouter', 'writer')).toBeNull();
  });
});

describe('roleForModelId', () => {
  it('reverse-resolves a known model id to its role', () => {
    expect(roleForModelId('openrouter', 'anthropic/claude-sonnet-4.6')).toBe('writer');
    expect(roleForModelId('openrouter', 'anthropic/claude-haiku-4.5')).toBe('intake');
  });

  it('returns null for an unknown model id or provider', () => {
    expect(roleForModelId('openrouter', 'not-a-real-model')).toBeNull();
    expect(roleForModelId('not-a-provider', 'anthropic/claude-sonnet-4.6')).toBeNull();
  });
});

describe('classifyLlmError', () => {
  const cases = [
    // rate_limited
    [{ status: 429, body: {} }, { kind: 'rate_limited', sameProviderRetry: true, failover: 'after_budget' }],
    [{ status: 408, body: {} }, { kind: 'rate_limited', sameProviderRetry: true, failover: 'after_budget' }],
    // server_error (HTTP)
    [{ status: 500, body: {} }, { kind: 'server_error', sameProviderRetry: true, failover: 'after_budget' }],
    [{ status: 503, body: {} }, { kind: 'server_error', sameProviderRetry: true, failover: 'after_budget' }],
    // server_error (network / timeout, no status)
    [{ err: new Error('fetch failed') }, { kind: 'server_error', sameProviderRetry: true, failover: 'after_budget', code: 'network_error' }],
    [{ err: Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }) }, { kind: 'server_error', sameProviderRetry: true, failover: 'after_budget', code: 'timeout' }],
    // content_blocked — three different shapes, since the real shape is unverified
    [{ status: 400, body: { error: { message: 'Your request was flagged by our content moderation system' } } }, { kind: 'content_blocked', sameProviderRetry: false, failover: 'immediate' }],
    [{ status: 403, body: { error: { code: 'content_blocked' } } }, { kind: 'content_blocked', sameProviderRetry: false, failover: 'immediate' }],
    [{ status: 422, body: { message: 'prohibited content detected' } }, { kind: 'content_blocked', sameProviderRetry: false, failover: 'immediate' }],
    // provider_config
    [{ status: 401, body: { error: 'invalid api key' } }, { kind: 'provider_config', sameProviderRetry: false, failover: 'immediate' }],
    [{ status: 402, body: {} }, { kind: 'provider_config', sameProviderRetry: false, failover: 'immediate' }],
    [{ status: 403, body: { error: 'forbidden, no access to this model' } }, { kind: 'provider_config', sameProviderRetry: false, failover: 'immediate' }],
    [{ status: 404, body: { error: 'model not found' } }, { kind: 'provider_config', sameProviderRetry: false, failover: 'immediate' }],
    // bad_request — unclassified 4xx, retried once on the same provider, never fails over
    [{ status: 400, body: { error: 'malformed JSON body' } }, { kind: 'bad_request', sameProviderRetry: true, failover: 'none' }],
    [{ status: 422, body: { error: 'schema validation failed' } }, { kind: 'bad_request', sameProviderRetry: true, failover: 'none' }],
  ];

  it.each(cases)('classifies %o', (input, expected) => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = classifyLlmError(input);
    warnSpy.mockRestore();
    expect(result).toMatchObject(expected);
  });

  it('logs the raw body for an unclassified 4xx so the real shape can be learned from prod', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    classifyLlmError({ status: 400, body: { error: 'some brand new error shape' } });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('some brand new error shape'));
    warnSpy.mockRestore();
  });

  it('an input with no status and no err is treated as a transient network-level failure (retryable)', () => {
    // Real call sites always pass either {status, body} from a received HTTP response
    // or {err} from a caught exception — never literally nothing. Absent a status,
    // the safest default is "something prevented a real response", not "give up".
    expect(classifyLlmError({})).toMatchObject({ kind: 'server_error', sameProviderRetry: true, failover: 'after_budget' });
  });
});

describe('describeChain', () => {
  it('joins provider ids with >', () => {
    expect(describeChain([{ id: 'openrouter' }, { id: 'agentrouter' }])).toBe('openrouter>agentrouter');
    expect(describeChain([])).toBe('');
    expect(describeChain(undefined)).toBe('');
  });
});

describe('getProvider', () => {
  it('returns null for an unknown id', () => {
    expect(getProvider('does-not-exist')).toBeNull();
  });

  it('returns the descriptor for a known id', () => {
    expect(getProvider('openrouter')?.label).toBe('OpenRouter');
  });
});
