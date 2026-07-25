const express = require('express');
const router = express.Router();

// A single checkout page load hits this twice in a row — once via
// /api/checkout-config, then again inside /api/create-checkout-session (which
// re-derives currency itself rather than trusting the client) — and every
// promo-code apply or "try again" click repeats the same POST. Each lookup is
// an external ipapi.co call with a 3s timeout, so uncached, the same visitor
// could pay that latency several times in one checkout session. Cache by IP
// for a few minutes: the answer for a given IP won't change within a session,
// and this doesn't touch the fail-open/local-IP security behavior below.
const GEO_CACHE_TTL_MS = 5 * 60 * 1000;
const geoCache = new Map();

function getCachedGeo(ip) {
    const entry = geoCache.get(ip);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        geoCache.delete(ip);
        return null;
    }
    return entry.result;
}

function setCachedGeo(ip, result) {
    geoCache.set(ip, { result, expiresAt: Date.now() + GEO_CACHE_TTL_MS });
}

// Shared geo-detection logic — used by /api/geo (client-side inference, being
// phased out) and /api/checkout-config (the server-side source of truth).
async function detectCountryFromRequest(req) {
    // Respect x-forwarded-for for reverse proxies (Railway, etc.)
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (forwarded ? forwarded.split(',')[0].trim() : null) || req.ip || '';

    // Local IPs in dev — default to Nigeria so Paystack works locally
    const isLocal =
        !ip ||
        ip === '127.0.0.1' ||
        ip === '::1' ||
        ip.startsWith('::ffff:127.') ||
        ip.startsWith('192.168.') ||
        ip.startsWith('10.');

    if (isLocal) {
        return { country: 'NG', isNigeria: true, source: 'local' };
    }

    const cached = getCachedGeo(ip);
    if (cached) return cached;

    try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`, {
            headers: { 'User-Agent': 'YourGbedu/1.0' },
            signal: AbortSignal.timeout(3000), // 3s timeout
        });

        const data = await response.json();
        const country = data.country_code || 'NG';

        const result = { country, isNigeria: country === 'NG', source: 'ipapi' };
        setCachedGeo(ip, result);
        return result;
    } catch (err) {
        console.error('[Geo] Country detection failed:', err.message);
        // Fail open: default to Nigeria (Paystack) so Nigerian users are never broken.
        // Not cached — a transient network blip shouldn't pin a real visitor to the
        // fallback for the next 5 minutes.
        return { country: 'NG', isNigeria: true, source: 'fallback' };
    }
}

// GET /api/geo and /api/geo/country — detect user's country from IP address.
async function detectCountry(req, res) {
    res.json(await detectCountryFromRequest(req));
}
router.get('/', detectCountry);
router.get('/country', detectCountry);

module.exports = router;
module.exports.detectCountryFromRequest = detectCountryFromRequest;
