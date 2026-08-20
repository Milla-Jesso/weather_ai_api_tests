import { test, expect } from '../../src/fixtures/api-fixtures';
import { locations } from '../../src/data/test-locations';
import { expectRespondsWithin } from '../../src/utils/assertions';

/**
 * Lightweight performance guardrails, not a load-testing suite.
 * A full load/stress test (sustained concurrency, throughput under
 * load) is out of scope for a 48-hour assignment and belongs in a
 * dedicated tool (k6, Artillery) — noted in the README. What we can
 * usefully assert here: single-call latency budgets and that latency
 * stays stable across repeated calls (no obvious degradation).
 */
test.describe('Performance', () => {
  test('single request completes within 3s', async ({ apiClient }) => {
    await expectRespondsWithin(
      () => apiClient.get('/v1/current', { params: locations.nairobi }),
      3000
    );
  });

  test('response time stays consistent across repeated calls', async ({ apiClient }) => {
    const durations: number[] = [];

    for (let i = 0; i < 5; i++) {
      const { durationMs } = await expectRespondsWithin(
        () => apiClient.get('/v1/current', { params: locations.nairobi }),
        3000
      );
      durations.push(durationMs);
    }

    const max = Math.max(...durations);
    const min = Math.min(...durations);
    // Not a strict perf benchmark — just flags wild variance (e.g. one
    // call taking 10x the others), which usually signals a real issue.
    expect(max, `Durations were inconsistent: ${durations.join(', ')}ms`).toBeLessThanOrEqual(
      Math.max(min * 5, 1000)
    );
  });

  test('concurrent requests all succeed', async ({ apiClient }) => {
    const requests = Array.from({ length: 5 }, () =>
      apiClient.get('/v1/current', { params: locations.nairobi })
    );
    const responses = await Promise.all(requests);
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });
});
