import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { detectCountryFromRequest } = await import('./geo.cjs');

function reqFromIp(ip) {
  return { headers: {}, ip };
}

describe('detectCountryFromRequest caching', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn(async () => ({
      json: async () => ({ country_code: 'GB' }),
    }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not call the external geo API for local/dev IPs', async () => {
    const result = await detectCountryFromRequest(reqFromIp('127.0.0.1'));
    expect(result).toMatchObject({ country: 'NG', isNigeria: true, source: 'local' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reuses the cached result for a repeat lookup of the same IP', async () => {
    const ip = '203.0.113.10';
    const first = await detectCountryFromRequest(reqFromIp(ip));
    const second = await detectCountryFromRequest(reqFromIp(ip));

    expect(first).toMatchObject({ country: 'GB', isNigeria: false, source: 'ipapi' });
    expect(second).toMatchObject({ country: 'GB', isNigeria: false, source: 'ipapi' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('looks up each distinct IP independently', async () => {
    await detectCountryFromRequest(reqFromIp('203.0.113.20'));
    await detectCountryFromRequest(reqFromIp('203.0.113.21'));

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not cache a failed lookup, so a transient error can recover on retry', async () => {
    const ip = '203.0.113.30';
    fetchMock.mockRejectedValueOnce(new Error('network blip'));

    const failed = await detectCountryFromRequest(reqFromIp(ip));
    expect(failed).toMatchObject({ country: 'NG', isNigeria: true, source: 'fallback' });

    const recovered = await detectCountryFromRequest(reqFromIp(ip));
    expect(recovered).toMatchObject({ country: 'GB', isNigeria: false, source: 'ipapi' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
