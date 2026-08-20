import { APIRequestContext, APIResponse } from '@playwright/test';
import { env } from '../config/env';

export interface RequestOptions {
  /** Query params to append, e.g. { lat: -1.29, lon: 36.82 } */
  params?: Record<string, string | number | boolean | undefined>;
  /** Attach a valid Authorization header. Defaults to true — set false to test auth failures. */
  authenticated?: boolean;
  /** Override the API key used (e.g. to send a garbage key). Implies authenticated: true. */
  apiKeyOverride?: string;
  /** Extra/override headers merged in last. */
  headers?: Record<string, string>;
}

/**
 * Thin, reusable wrapper around Playwright's APIRequestContext for the
 * WeatherAI API. Centralizes base URL, auth header handling, and query
 * building so individual tests stay focused on behaviour, not plumbing.
 */
export class WeatherApiClient {
  constructor(private readonly request: APIRequestContext) {}

  private buildHeaders(options: RequestOptions = {}): Record<string, string> {
    const { authenticated = true, apiKeyOverride, headers = {} } = options;
    const built: Record<string, string> = {};

    if (authenticated || apiKeyOverride) {
      built.Authorization = `Bearer ${apiKeyOverride ?? env.apiKey}`;
    }

    return { ...built, ...headers };
  }

  private buildQuery(params: RequestOptions['params']): string {
    if (!params) return '';
    const entries = Object.entries(params).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return '';
    const search = new URLSearchParams(
      entries.map(([k, v]) => [k, String(v)])
    );
    return `?${search.toString()}`;
  }

  async get(path: string, options: RequestOptions = {}): Promise<APIResponse> {
    const query = this.buildQuery(options.params);
    return this.request.get(`${path}${query}`, {
      headers: this.buildHeaders(options),
    });
  }

  async post(
    path: string,
    body: Record<string, unknown>,
    options: RequestOptions = {}
  ): Promise<APIResponse> {
    return this.request.post(path, {
      data: body,
      headers: this.buildHeaders(options),
    });
  }

  async delete(path: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.request.delete(path, {
      headers: this.buildHeaders(options),
    });
  }
}
