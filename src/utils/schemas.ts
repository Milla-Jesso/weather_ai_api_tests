/**
 * Lightweight structural checks for API payloads.
 *
 * These aren't a full JSON-schema validator — for the scope of this
 * assignment, asserting the presence/type of key fields catches real
 * regressions (missing field, wrong type) without the overhead of a
 * schema library. Swap in `ajv` + JSON Schema here if the suite grows.
 */

export function hasKeys(obj: unknown, keys: string[]): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  return keys.every((key) => key in (obj as Record<string, unknown>));
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Structural shape observed from every weather-data endpoint
 * (/v1/weather, /v1/current, /v1/daily, /v1/hourly, /v1/forecast).
 * Confirmed live: all of them echo lat/lon/units/days and include
 * current + daily + hourly blocks regardless of which endpoint was hit
 * (e.g. /v1/current still returns daily/hourly, just scoped to 1 day).
 * Adjust field names here in one place if the API's contract shifts.
 */
export const WEATHER_RESPONSE_KEYS = ['lat', 'lon', 'units', 'current'] as const;

export const ERROR_RESPONSE_KEYS = ['error'] as const;

export function isValidCurrentBlock(current: unknown): boolean {
  return hasKeys(current, ['time', 'temperature', 'windspeed', 'weathercode']);
}
