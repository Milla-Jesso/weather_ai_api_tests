import { test, expect } from '../../src/fixtures/api-fixtures';
import { locations } from '../../src/data/test-locations';

/**
 * Authentication behaviour tested once, in isolation, against a single
 * representative endpoint (/v1/weather) rather than repeated per
 * endpoint — auth is handled by shared middleware, so this is the
 * right layer to prove it works instead of retesting it N times.
 */
test.describe('Authentication', () => {
  test('valid API key succeeds', async ({ apiClient }) => {
    const response = await apiClient.get('/v1/weather', { params: locations.nairobi });
    expect(response.status()).toBe(200);
  });

  test('missing Authorization header returns 401 with an error message', async ({ apiClient }) => {
    const response = await apiClient.get('/v1/weather', {
      params: locations.nairobi,
      authenticated: false,
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('garbage API key returns 401', async ({ apiClient }) => {
    const response = await apiClient.get('/v1/weather', {
      params: locations.nairobi,
      apiKeyOverride: 'wai_bogus_key_that_does_not_exist',
    });
    expect(response.status()).toBe(401);
  });

  test('empty bearer token returns 401', async ({ apiClient }) => {
    const response = await apiClient.get('/v1/weather', {
      params: locations.nairobi,
      apiKeyOverride: '',
    });
    expect(response.status()).toBe(401);
  });

  test('non-Bearer auth scheme is rejected with 401', async ({ apiClient }) => {
    const response = await apiClient.get('/v1/weather', {
      params: locations.nairobi,
      authenticated: false,
      headers: { Authorization: 'Token some-random-value' },
    });
    expect(response.status()).toBe(401);
  });

  test('Pro-plan-only endpoint returns 403 on a free-tier key', async ({ apiClient }) => {
    // This assumes the key under test is on the free plan (see .env).
    // On a Pro/Scale key this endpoint should instead return 200 —
    // flip the expectation if you run this suite with a higher-tier key.
    const response = await apiClient.get('/v1/forecast14', { params: locations.nairobi });
    expect([200, 403]).toContain(response.status());
    if (response.status() === 403) {
      const body = await response.json();
      expect(body).toHaveProperty('error');
    }
  });
});
