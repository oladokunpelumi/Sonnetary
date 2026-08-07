#!/usr/bin/env node
// Go/no-go probe for a new AI provider before hardcoding any model ID into
// server/services/ai-providers.cjs. Not a test — deliberately un-collectable by
// vitest (no test.config exists; the default include glob is
// **/*.{test,spec}.?(c|m)[jt]s?(x)`, which this .cjs under tools/ doesn't match).
// Refuses to run without a real API key. Writes no files; prints only.
//
// Usage: node server/song-pipeline/tools/probe-ai-provider.cjs <providerId>
//        npm run probe:ai -- <providerId>

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env.local') });
const { getProvider } = require('../../services/ai-providers.cjs');

const ROLE_PATTERNS = {
    intake: [/haiku/i],
    writer: [/sonnet/i, /opus/i],
    judge_cheap_1: [/gemini/i, /flash/i, /glm/i],
    judge_cheap_2: [/deepseek/i],
    brief: [/gpt-4o-mini/i, /mini/i, /gpt-4o/i],
};

// A benign but genuinely heavy prompt — this app sends memorial/grief/apology
// stories through the judge stage, so this is what a real payload looks like.
// The point of phase 4 is to learn AgentRouter's actual moderation behavior on
// content like this, not to test extreme or malicious input.
const HEAVY_JUDGE_PROMPT = `You are judging a custom song's lyrics for a grieving customer.
The song is a memorial tribute written for a father who recently passed away.
Score these lyrics honestly on emotional specificity, singability, hook strength,
genre fit, and occasion fit (1-10 each), then give a one-line verdict.

Lyrics:
"Empty chair at the table, your coffee cup still there,
I hear your laugh in the hallway, feel you everywhere.
Dad, you built this house with your own two hands,
Now I'm the one who has to understand."

Reply ONLY with JSON: {"scores": {...}, "one_line_verdict": "..."}`;

function log(...args) {
    console.log(...args);
}

async function callChatCompletion({ baseUrl, apiKey, headers, model, system, user, timeoutMs = 20000 }) {
    const start = Date.now();
    try {
        const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                ...headers,
            },
            body: JSON.stringify({
                model,
                max_tokens: 300,
                temperature: 0.3,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: user },
                ],
            }),
            signal: AbortSignal.timeout(timeoutMs),
        });
        const latencyMs = Date.now() - start;
        const text = await res.text();
        let body;
        try {
            body = JSON.parse(text);
        } catch {
            body = text;
        }
        return { ok: res.ok, status: res.status, body, latencyMs };
    } catch (err) {
        return { ok: false, status: null, body: null, err, latencyMs: Date.now() - start };
    }
}

function matchRole(modelIds, role) {
    const patterns = ROLE_PATTERNS[role] || [];
    return modelIds.filter((id) => patterns.some((p) => p.test(id)));
}

async function main() {
    const providerId = process.argv[2];
    if (!providerId) {
        console.error('Usage: node server/song-pipeline/tools/probe-ai-provider.cjs <providerId>');
        process.exit(1);
    }

    const def = getProvider(providerId);
    if (!def) {
        console.error(`Unknown provider "${providerId}". Known providers are defined in server/services/ai-providers.cjs.`);
        process.exit(1);
    }

    const apiKey = (def.apiKeyEnv || []).map((name) => process.env[name]).find(Boolean);
    if (!apiKey) {
        console.error(
            `No API key found for "${providerId}". Set one of [${(def.apiKeyEnv || []).join(', ')}] in your environment ` +
            `(e.g. .env.local) before running this probe. Refusing to run without a real key.`
        );
        process.exit(1);
    }

    const baseUrl = (def.baseUrlEnv && process.env[def.baseUrlEnv]) || def.baseUrl;
    const headers = def.headers ? def.headers() : {};

    log(`\n=== Probing ${def.label} (${providerId}) at ${baseUrl} ===\n`);

    // Phase 1: list models
    log('--- Phase 1: GET /models ---');
    let modelIds = [];
    try {
        const res = await fetch(`${baseUrl.replace(/\/$/, '')}/models`, {
            headers: { Authorization: `Bearer ${apiKey}`, ...headers },
            signal: AbortSignal.timeout(20000),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
            log(`FAILED: GET /models returned ${res.status}. Body: ${JSON.stringify(data).slice(0, 500)}`);
        } else {
            modelIds = (data?.data || data?.models || []).map((m) => m.id || m.name || m).filter(Boolean);
            log(`Found ${modelIds.length} models:`);
            for (const id of [...modelIds].sort()) log(`  ${id}`);
        }
    } catch (err) {
        log(`FAILED: ${err.message}`);
    }

    // Phase 2: pattern-match candidates per role
    log('\n--- Phase 2: candidate models per role (pattern match — verify with phase 3 before trusting) ---');
    const candidatesByRole = {};
    for (const role of Object.keys(ROLE_PATTERNS)) {
        candidatesByRole[role] = matchRole(modelIds, role);
        log(`${role}: ${candidatesByRole[role].join(', ') || '(no match — inspect the full list above manually)'}`);
    }

    // Phase 3: actually call each candidate
    log('\n--- Phase 3: test-calling each candidate (a listing is not entitlement) ---');
    const callable = {};
    for (const [role, ids] of Object.entries(candidatesByRole)) {
        callable[role] = [];
        for (const model of ids) {
            const result = await callChatCompletion({
                baseUrl,
                apiKey,
                headers,
                model,
                system: 'Reply only with JSON.',
                user: 'Reply with exactly this JSON and nothing else: {"ok": true}',
            });
            if (result.ok) {
                log(`  PASS  ${role.padEnd(14)} ${model}  (${result.latencyMs}ms)`);
                callable[role].push(model);
            } else if (result.err) {
                log(`  FAIL  ${role.padEnd(14)} ${model}  network error: ${result.err.message}`);
            } else {
                log(`  FAIL  ${role.padEnd(14)} ${model}  status ${result.status}: ${JSON.stringify(result.body).slice(0, 300)}`);
            }
        }
    }

    // Phase 4: one deliberately heavy payload to capture the real content-blocked shape
    log('\n--- Phase 4: heavy memorial-song judge prompt (capturing the real moderation shape, if any) ---');
    const probeModel = callable.writer[0] || callable.judge_cheap_1[0] || Object.values(callable).flat()[0];
    if (!probeModel) {
        log('SKIPPED: no callable model found in phase 3 to probe with.');
    } else {
        const result = await callChatCompletion({
            baseUrl,
            apiKey,
            headers,
            model: probeModel,
            system: 'You are a music production quality judge.',
            user: HEAVY_JUDGE_PROMPT,
        });
        if (result.ok) {
            log(`PASS — model "${probeModel}" did not block this content. Response: ${JSON.stringify(result.body).slice(0, 300)}`);
        } else if (result.err) {
            log(`Network error, not a moderation block: ${result.err.message}`);
        } else {
            log(`BLOCKED/REJECTED — status ${result.status}. Full body (paste this into the classifier if it's a moderation block):`);
            log(JSON.stringify(result.body, null, 2));
        }
    }

    // Summary + go/no-go
    const rolesCallable = Object.entries(callable).filter(([, ids]) => ids.length > 0).map(([role]) => role);
    log(`\n=== Summary ===`);
    log(`Roles with at least one callable model: ${rolesCallable.join(', ') || '(none)'}`);
    log(
        rolesCallable.length >= 2
            ? 'GO — at least two roles are callable. Paste the passing model IDs from phase 3 into ai-providers.cjs.'
            : 'NO-GO — fewer than two roles are callable on this provider/plan. Do not wire this provider in as a fallback yet.'
    );
}

main().catch((err) => {
    console.error('Probe crashed:', err);
    process.exit(1);
});
