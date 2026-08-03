// Single registry for AI provider base URLs, model IDs, and per-provider headers —
// replaces IDs previously scattered across llm.cjs, song-pipeline.cjs, and gemini.cjs.
// No top-level env reads: everything reads process.env at call time so vi.stubEnv works.

const MODEL_ROLES = Object.freeze({
    INTAKE: 'intake',
    WRITER: 'writer',
    BRIEF: 'brief',
    JUDGE_CHEAP_1: 'judge_cheap_1',
    JUDGE_CHEAP_2: 'judge_cheap_2',
});

// api: 'openai-chat' means POST {baseUrl}/chat/completions with the standard OpenAI
// request/response shape — the only call path llm.cjs currently speaks. 'google-genai'
// providers use a different SDK entirely and are not wired into that call path yet
// (see gemini.cjs); they're modeled here so a future migration has one place to read
// model IDs from, not scattered per-provider constants.
const PROVIDER_DEFS = {
    openrouter: {
        id: 'openrouter',
        label: 'OpenRouter',
        api: 'openai-chat',
        baseUrl: 'https://openrouter.ai/api/v1',
        baseUrlEnv: 'OPENROUTER_BASE_URL',
        apiKeyEnv: ['OPENROUTER_API_KEY'],
        headers: () => ({
            'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000',
            'X-Title': 'YourGbedu Admin',
        }),
        // Every role OpenRouter has served historically (llm.cjs DEFAULT_MODELS +
        // song-pipeline.cjs DEFAULT_PANEL_EXTRA_MODELS).
        models: {
            intake: 'anthropic/claude-haiku-4.5',
            writer: 'anthropic/claude-sonnet-4.6',
            judge_cheap_1: 'google/gemini-flash-latest',
            judge_cheap_2: 'deepseek/deepseek-chat',
            brief: 'openai/gpt-4o-mini',
        },
        modelEnvOverrides: {
            intake: ['YG_MODEL_INTAKE', 'LLM_MODEL'],
            writer: ['YG_MODEL_SONNET', 'LLM_MODEL'],
            brief: ['LLM_MODEL'],
        },
        timeoutMs: 90000,
    },
    // Non-profit, no published SLA — fallback only. Models are null until the probe
    // (server/song-pipeline/tools/probe-ai-provider.cjs) discovers real callable IDs
    // and this object is updated with the findings. No HTTP-Referer/X-Title: those are
    // OpenRouter-specific and would leak CLIENT_URL to a third party for no reason here.
    // No modelEnvOverrides: LLM_MODEL holds OpenRouter-style IDs and must not leak here.
    agentrouter: {
        id: 'agentrouter',
        label: 'AgentRouter',
        api: 'openai-chat',
        baseUrl: 'https://agentrouter.org/v1',
        baseUrlEnv: 'AGENTROUTER_BASE_URL',
        apiKeyEnv: ['AGENTROUTER_API_KEY'],
        headers: () => ({}),
        models: {
            intake: null,
            writer: null,
            judge_cheap_1: null,
            judge_cheap_2: null,
            brief: null,
        },
        modelEnvOverrides: {},
        timeoutMs: 90000,
    },
    groq: {
        id: 'groq',
        label: 'Groq',
        api: 'openai-chat',
        baseUrl: 'https://api.groq.com/openai/v1',
        baseUrlEnv: null,
        apiKeyEnv: ['GROQ_API_KEY'],
        headers: () => ({}),
        models: { intake: null, writer: null, judge_cheap_1: null, judge_cheap_2: null, brief: 'llama-3.3-70b-versatile' },
        modelEnvOverrides: { brief: ['LLM_MODEL'] },
        timeoutMs: 20000,
    },
    openai: {
        id: 'openai',
        label: 'OpenAI',
        api: 'openai-chat',
        baseUrl: 'https://api.openai.com/v1',
        baseUrlEnv: null,
        apiKeyEnv: ['OPENAI_API_KEY'],
        headers: () => ({}),
        models: { intake: null, writer: null, judge_cheap_1: null, judge_cheap_2: null, brief: 'gpt-4o-mini' },
        modelEnvOverrides: { brief: ['LLM_MODEL'] },
        timeoutMs: 20000,
    },
    google: {
        id: 'google',
        label: 'Google',
        api: 'google-genai',
        baseUrl: null,
        baseUrlEnv: null,
        apiKeyEnv: ['GOOGLE_API_KEY', 'GEMINI_API_KEY'],
        headers: () => ({}),
        models: { intake: null, writer: null, judge_cheap_1: null, judge_cheap_2: null, brief: 'gemini-2.0-flash' },
        modelEnvOverrides: { brief: ['LLM_MODEL'] },
        timeoutMs: 20000,
    },
};

// Deep-cloned once at module load so __resetProvidersForTests can undo whatever a
// test mutates via __setProviderModelsForTests.
const PRISTINE_MODELS = Object.fromEntries(
    Object.entries(PROVIDER_DEFS).map(([id, def]) => [id, { ...def.models }])
);

function getProvider(id) {
    return PROVIDER_DEFS[id] || null;
}

function firstEnvValue(envNames) {
    for (const name of envNames || []) {
        const value = process.env[name];
        if (value) return value;
    }
    return null;
}

function dedupe(arr) {
    return Array.from(new Set(arr));
}

// Builds the ordered list of resolvable providers for one logical AI call. Reads
// AI_PROVIDER (default 'openrouter') then AI_PROVIDER_FALLBACK (comma-separated,
// default empty) unless overridden via opts — unset env means today's behavior
// byte-for-byte. Drops any provider with no resolvable API key (warning as it goes)
// and throws if nothing resolvable remains.
function resolveProviderChain({ provider, fallback } = {}) {
    const primaryId = (provider ?? process.env.AI_PROVIDER ?? 'openrouter').trim() || 'openrouter';
    const fallbackRaw = fallback ?? process.env.AI_PROVIDER_FALLBACK ?? '';
    const fallbackIds = String(fallbackRaw)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    const orderedIds = dedupe([primaryId, ...fallbackIds]);
    const resolved = [];

    for (const id of orderedIds) {
        const def = getProvider(id);
        if (!def) {
            console.warn(`[ai-providers] Unknown provider id "${id}" — skipping.`);
            continue;
        }
        const apiKey = firstEnvValue(def.apiKeyEnv);
        if (!apiKey) {
            console.warn(`[ai-providers] Provider "${id}" has no configured API key (expected one of: ${def.apiKeyEnv.join(', ')}) — skipping.`);
            continue;
        }
        const baseUrl = (def.baseUrlEnv && process.env[def.baseUrlEnv]) || def.baseUrl;
        resolved.push({
            id: def.id,
            label: def.label,
            api: def.api,
            baseUrl,
            apiKey,
            headers: def.headers(),
            timeoutMs: def.timeoutMs,
        });
    }

    if (resolved.length === 0) {
        throw new Error(
            `No AI provider available — checked [${orderedIds.join(', ')}], none had a resolvable API key.`
        );
    }
    return resolved;
}

// Resolves role -> concrete model ID for one provider, per call (not cached at
// construction) — under failover the same role must resolve against whichever
// provider is actually being called, never a stale ID from a different provider.
function resolveModelId(providerId, role) {
    const def = getProvider(providerId);
    if (!def) return null;
    const overrideEnvNames = def.modelEnvOverrides?.[role];
    const override = overrideEnvNames ? firstEnvValue(overrideEnvNames) : null;
    if (override) return override;
    return def.models?.[role] ?? null;
}

function roleForModelId(providerId, modelId) {
    const def = getProvider(providerId);
    if (!def || !modelId) return null;
    for (const [role, id] of Object.entries(def.models || {})) {
        if (id === modelId) return role;
    }
    return null;
}

const CONTENT_BLOCK_PATTERN = /content[_-]?block|content[_-]?filter|moderat|flagged|safety|prohibited/i;
const CONTENT_BLOCK_CODES = new Set(['content_blocked', 'content-blocked', 'content_filter', 'moderation_blocked']);

function bodyText(body) {
    if (typeof body === 'string') return body;
    try {
        return JSON.stringify(body ?? '');
    } catch {
        return String(body);
    }
}

function looksContentBlocked(status, body) {
    if (![400, 403, 422, 451].includes(status)) return false;
    const code = body?.error?.code || body?.error?.type || body?.code || body?.type;
    if (code && CONTENT_BLOCK_CODES.has(String(code).toLowerCase())) return true;
    return CONTENT_BLOCK_PATTERN.test(bodyText(body));
}

// Classifies one failed attempt into a retry/failover policy. `sameProviderRetry` is
// whether the SAME provider is worth trying again at all (the caller's retry loop
// owns the actual attempt count and backoff per kind); `failover` is one of
// 'after_budget' (only once the same-provider retry budget is exhausted),
// 'immediate' (skip remaining same-provider retries and fail over now), or 'none'
// (never fail over — the request itself is the problem, not the provider).
function classifyLlmError({ status, body, err } = {}) {
    if (!status) {
        const isTimeout = err?.name === 'AbortError' || /aborted|timeout/i.test(String(err?.message || ''));
        return { kind: 'server_error', sameProviderRetry: true, failover: 'after_budget', code: isTimeout ? 'timeout' : 'network_error' };
    }
    if (status === 429 || status === 408) {
        return { kind: 'rate_limited', sameProviderRetry: true, failover: 'after_budget', code: String(status) };
    }
    if (status >= 500) {
        return { kind: 'server_error', sameProviderRetry: true, failover: 'after_budget', code: String(status) };
    }
    if (looksContentBlocked(status, body)) {
        return { kind: 'content_blocked', sameProviderRetry: false, failover: 'immediate', code: 'content_blocked' };
    }
    if (status === 401 || status === 402 || status === 403 || status === 404) {
        return { kind: 'provider_config', sameProviderRetry: false, failover: 'immediate', code: String(status) };
    }
    if (status >= 400 && status < 500) {
        console.warn(`[ai-providers] Unclassified 4xx (status ${status}): ${bodyText(body).slice(0, 500)}`);
        return { kind: 'bad_request', sameProviderRetry: true, failover: 'none', code: String(status) };
    }
    return { kind: 'bad_request', sameProviderRetry: false, failover: 'none', code: 'unknown' };
}

function describeChain(chain) {
    return (chain || []).map((p) => p.id).join('>');
}

function __setProviderModelsForTests(providerId, models) {
    const def = getProvider(providerId);
    if (!def) throw new Error(`Unknown provider "${providerId}"`);
    Object.assign(def.models, models);
}

function __resetProvidersForTests() {
    for (const [id, models] of Object.entries(PRISTINE_MODELS)) {
        PROVIDER_DEFS[id].models = { ...models };
    }
}

module.exports = {
    MODEL_ROLES,
    PROVIDERS: PROVIDER_DEFS,
    getProvider,
    resolveProviderChain,
    resolveModelId,
    roleForModelId,
    classifyLlmError,
    describeChain,
    __setProviderModelsForTests,
    __resetProvidersForTests,
};
