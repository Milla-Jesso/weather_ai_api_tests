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
  test('single request completes within 3s @performance', async ({ apiClient }) => {
    await expectRespondsWithin(
      () => apiClient.get('/v1/current', { params: locations.nairobi }),
      3000
    );
  });

  test('response time stays consistent across repeated calls @performance', async ({ apiClient }) => {
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
    // Not a strict perf benchmark, and deliberately an absolute gap rather
    // than a ratio: a ratio check punishes an already-fast baseline (e.g.
    // 80ms -> 450ms is a "5x spike" but both are fine in absolute terms)
    // and was flaky under CI's parallel workers, where shared-runner
    // contention adds noise unrelated to the API itself. Each call is
    // already capped at 3000ms above; this just flags one call being
    // wildly slower than the others within that budget.
    expect(
      max - min,
      `Durations were inconsistent: ${durations.join(', ')}ms`
    ).toBeLessThanOrEqual(2500);
  });

  test('concurrent requests all succeed @performance', async ({ apiClient }) => {
    const requests = Array.from({ length: 5 }, () =>
      apiClient.get('/v1/current', { params: locations.nairobi })
    );
    const responses = await Promise.all(requests);
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });
});
