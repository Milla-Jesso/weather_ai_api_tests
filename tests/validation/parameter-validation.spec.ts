import { test, expect } from '../../src/fixtures/api-fixtures';
import { locations } from '../../src/data/test-locations';

test.describe('Parameter validation & error handling', () => {
  test('missing lat/lon returns 400 with a descriptive error', async ({ apiClient }) => {
    const response = await apiClient.get('/v1/weather');
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/lat|lon/i);
  });

  test('non-numeric lat/lon returns 400', async ({ apiClient }) => {
    const response = await apiClient.get('/v1/weather', { params: locations.nonNumeric });
    expect(response.status()).toBe(400);
  });

  test('unknown route returns 404', async ({ apiClient }) => {
    const response = await apiClient.get('/v1/this-route-does-not-exist');
    expect(response.status()).toBe(404);
  });

  /**
   * KNOWN GAP (discovered while testing, not documented in /docs):
   * out-of-range coordinates (e.g. lat=200, outside -90..90) pass the
   * API's own param presence/type check and get forwarded to the
   * upstream weather provider, which then fails and surfaces as a
   * generic 502 instead of a 400 "invalid coordinate range" response.
   * Asserting the *current* behaviour here (rather than skipping it)
   * so this test starts failing loudly — and gets noticed — if the
   * API's validation improves or regresses further.
   */
  test('out-of-range latitude surfaces as a 502 (upstream failure), not a 400', async ({ apiClient }) => {
    const response = await apiClient.get('/v1/weather', { params: locations.outOfRangeLat });
    expect(response.status()).toBe(502);
  });

  test('out-of-range longitude surfaces as a 502 (upstream failure), not a 400', async ({ apiClient }) => {
    const response = await apiClient.get('/v1/weather', { params: locations.outOfRangeLon });
    expect(response.status()).toBe(502);
  });

  test('pole coordinates (lat = ±90) are accepted', async ({ apiClient }) => {
    const north = await apiClient.get('/v1/weather', { params: locations.northPole });
    const south = await apiClient.get('/v1/weather', { params: locations.southPole });
    expect(north.status()).toBe(200);
    expect(south.status()).toBe(200);
  });
});
