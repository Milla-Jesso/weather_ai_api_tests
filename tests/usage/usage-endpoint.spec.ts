import { test, expect } from '../../src/fixtures/api-fixtures';
import { hasKeys } from '../../src/utils/schemas';
import { expectJsonContentType } from '../../src/utils/assertions';

test.describe('GET /v1/usage', () => {
  test('returns plan quota fields', async ({ apiClient }) => {
    const response = await apiClient.get('/v1/usage');
    expect(response.status()).toBe(200);
    expectJsonContentType(response);

    const body = await response.json();
    expect(
      hasKeys(body, ['plan', 'used', 'limit', 'remaining', 'unlimited']),
      `Response missing expected keys: ${JSON.stringify(body)}`
    ).toBeTruthy();
    expect(body.remaining).toBeLessThanOrEqual(body.limit);
    expect(body.used).toBeGreaterThanOrEqual(0);
  });

  test('rejects unauthenticated requests', async ({ apiClient }) => {
    const response = await apiClient.get('/v1/usage', { authenticated: false });
    expect(response.status()).toBe(401);
  });

  /**
   * The docs (/docs, "Rate Limiting & Quotas") state that every response
   * carries X-RateLimit-Limit / -Remaining / -Reset headers. Live testing
   * against a free-plan key found these headers absent on every endpoint
   * checked, including here — quota info is only exposed via this
   * endpoint's JSON body. Marked with `test.fail()` so the report shows
   * this as a known, expected discrepancy instead of a broken build —
   * if the API starts sending these headers, this test flips to an
   * unexpected pass and surfaces that the docs mismatch was fixed.
   */
  test('documents rate-limit header presence (known docs discrepancy)', async ({ apiClient }) => {
    test.fail(true, 'Docs promise X-RateLimit-* headers; none observed on live responses');
    const response = await apiClient.get('/v1/usage');
    expect(response.headers()).toHaveProperty('x-ratelimit-remaining');
  });
});
