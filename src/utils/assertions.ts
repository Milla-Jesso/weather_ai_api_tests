import { APIResponse, expect } from '@playwright/test';

/**
 * Reusable assertion helpers shared across spec files. Keeping these in
 * one place means a change to how we validate a cross-cutting concern
 * (content type, timing) only has to happen once.
 */

export function expectJsonContentType(response: APIResponse): void {
  const contentType = response.headers()['content-type'] ?? '';
  expect(contentType, 'Expected a JSON response').toContain('application/json');
}

/** Asserts a call completed within a max duration (ms). Lightweight perf guardrail. */
export async function expectRespondsWithin<T>(
  fn: () => Promise<T>,
  maxMs: number
): Promise<{ result: T; durationMs: number }> {
  const start = Date.now();
  const result = await fn();
  const durationMs = Date.now() - start;
  expect(
    durationMs,
    `Expected response within ${maxMs}ms, took ${durationMs}ms`
  ).toBeLessThanOrEqual(maxMs);
  return { result, durationMs };
}
