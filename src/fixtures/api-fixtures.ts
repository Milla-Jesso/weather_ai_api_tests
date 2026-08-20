import { test as base } from '@playwright/test';
import { WeatherApiClient } from '../clients/weather-api-client';

interface ApiFixtures {
  apiClient: WeatherApiClient;
}

/**
 * Extends Playwright's base test with an `apiClient` fixture so every
 * spec gets a ready-to-use client instead of constructing one by hand.
 * Import `test`/`expect` from this file everywhere instead of '@playwright/test'.
 */
export const test = base.extend<ApiFixtures>({
  apiClient: async ({ request }, use) => {
    await use(new WeatherApiClient(request));
  },
});

export { expect } from '@playwright/test';
