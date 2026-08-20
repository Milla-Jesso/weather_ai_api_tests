import 'dotenv/config';

/**
 * Single source of truth for environment configuration.
 * Fails fast with a clear message if required values are missing,
 * instead of letting every test fail individually with a confusing 401.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Copy .env.example to .env and fill it in.`
    );
  }
  return value;
}

export const env = {
  baseUrl: process.env.WEATHER_AI_BASE_URL ?? 'https://weather-ai.co',
  apiKey: required('WEATHER_AI_API_KEY'),
};
