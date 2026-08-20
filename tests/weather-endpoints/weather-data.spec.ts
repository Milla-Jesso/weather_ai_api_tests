import { test, expect } from '../../src/fixtures/api-fixtures';
import { locations } from '../../src/data/test-locations';
import {
  WEATHER_RESPONSE_KEYS,
  hasKeys,
  isValidCurrentBlock,
} from '../../src/utils/schemas';
import { expectJsonContentType } from '../../src/utils/assertions';

/**
 * All of these endpoints share the same request/response contract
 * (confirmed against the live API — see README "Test strategy"), so we
 * generate one shared test matrix instead of duplicating cases per file.
 * `requiresCoordinates: false` covers /v1/weather-geo, which resolves
 * location from the caller's IP instead of query params.
 */
const weatherEndpoints = [
  { path: '/v1/weather', requiresCoordinates: true },
  { path: '/v1/forecast', requiresCoordinates: true },
  { path: '/v1/current', requiresCoordinates: true },
  { path: '/v1/daily', requiresCoordinates: true },
  { path: '/v1/hourly', requiresCoordinates: true },
  { path: '/v1/weather-geo', requiresCoordinates: false },
];

for (const { path, requiresCoordinates } of weatherEndpoints) {
  test.describe(`GET ${path}`, () => {
    test('returns 200 with a well-formed weather payload @smoke', async ({ apiClient }) => {
      const response = await apiClient.get(path, {
        params: requiresCoordinates ? locations.nairobi : undefined,
      });

      expect(response.status()).toBe(200);
      expectJsonContentType(response);

      const body = await response.json();
      expect(
        hasKeys(body, [...WEATHER_RESPONSE_KEYS]),
        `Response missing expected top-level keys: ${JSON.stringify(body)}`
      ).toBeTruthy();
      expect(
        isValidCurrentBlock(body.current),
        `"current" block missing expected fields: ${JSON.stringify(body.current)}`
      ).toBeTruthy();
    });

    if (requiresCoordinates) {
      test('rejects a request missing lat/lon with 400 @error-handling', async ({ apiClient }) => {
        const response = await apiClient.get(path);
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body).toHaveProperty('error');
      });

      test('rejects non-numeric coordinates with 400 @error-handling', async ({ apiClient }) => {
        const response = await apiClient.get(path, { params: locations.nonNumeric });
        expect(response.status()).toBe(400);
      });

      test('accepts boundary coordinates (equator / prime meridian)', async ({ apiClient }) => {
        const response = await apiClient.get(path, {
          params: locations.equatorPrimeMeridian,
        });
        expect(response.status()).toBe(200);
      });

      test('accepts the antimeridian without error', async ({ apiClient }) => {
        const response = await apiClient.get(path, { params: locations.antimeridian });
        expect(response.status()).toBe(200);
      });
    }

    test('rejects requests with no Authorization header @error-handling', async ({ apiClient }) => {
      const response = await apiClient.get(path, {
        params: requiresCoordinates ? locations.nairobi : undefined,
        authenticated: false,
      });
      expect(response.status()).toBe(401);
    });
  });
}
