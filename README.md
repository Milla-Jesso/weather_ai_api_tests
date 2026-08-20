# weather-ai-api-tests

API test automation suite for the [WeatherAI](https://weather-ai.co/docs) developer platform, built with [Playwright](https://playwright.dev/docs/api-testing).

**Live report:** _add your GitHub Pages URL here after the first push to `main`_
**CI runs:** see the [Actions tab](../../actions) of this repo

## Setup

Requires Node.js 18+.

```bash
npm install
cp .env.example .env
# then edit .env and set WEATHER_AI_API_KEY to your own key
```

You'll need your own API key from [weather-ai.co](https://weather-ai.co) — free plan is enough to run everything except the Pro/Scale-gated checks, which are designed to degrade gracefully (see [Test strategy](#test-strategy--choices)).

## Running the tests

```bash
npm test                                     # run the full suite, headless (list + HTML + JSON reporters)
npm run report                               # open the last HTML report
npx playwright test tests/auth               # run one folder
npx playwright test -g "out-of-range"        # run tests matching a name
npx playwright test --grep "@smoke"          # run tests matching a tag
```

The HTML report is written to `playwright-report/` and a JSON summary to `test-results/results.json`.

### Test tags

Test titles carry `@smoke`, `@error-handling`, or `@performance` tags (Playwright's `--grep` matches them as a substring against the full title):

- **`@smoke`** — one fast happy-path check per endpoint group; "is the API up and returning the right shape"
- **`@error-handling`** — every negative-path case: bad/missing auth, bad/missing params, unknown routes, plan-gated 403s
- **`@performance`** — the response-time budget and consistency/concurrency checks

Not every test carries a tag (boundary-value cases like poles/antimeridian, and the rate-limit-header discrepancy test, are intentionally untagged) — they still run under the full suite, just aren't selectable via a single tag. This is also what drives the CI manual-dispatch dropdown (see [CI](#ci)).

## Project structure

```
src/
  config/env.ts            # loads & validates required env vars once, fails fast with a clear message
  clients/
    weather-api-client.ts  # single reusable HTTP client: base URL, auth headers, query building
  fixtures/
    api-fixtures.ts        # Playwright fixture that injects a ready-to-use apiClient into every test
  utils/
    schemas.ts              # lightweight response-shape checks (no external schema library needed)
    assertions.ts            # shared assertion helpers (content-type, response-time budget)
  data/
    test-locations.ts        # named lat/lon fixtures (valid + boundary + invalid), used across specs

tests/
  weather-endpoints/         # happy-path + validation, generated once and run across all 6 weather endpoints
  auth/                        # authentication behaviour, tested once in isolation
  validation/                  # parameter validation & documented error-handling gaps
  performance/                # response-time budget + basic concurrency check
  usage/                        # /v1/usage quota endpoint + a known docs discrepancy
```

Everything under `src/` exists so that no test file has to know how to build a request, attach auth, or check a status code from scratch — specs stay focused on *behaviour*, not plumbing. Add a new endpoint by adding one entry to the array in `weather-data.spec.ts`, not by writing a new file.

## Test strategy & choices

**Scope.** The assignment asked for API testing with validation, error handling, performance considerations, and reporting. I scoped this to the endpoints available on a free-plan key (`/v1/weather`, `/v1/forecast`, `/v1/current`, `/v1/daily`, `/v1/hourly`, `/v1/weather-geo`, `/v1/usage`) rather than every documented route. Pro/Scale-only endpoints (`forecast14`, `insights`, `ip-lookup`, webhooks, trees, SMS) are out of scope for direct testing — hitting them would just prove the plan gate works, not exercise real functionality. The one exception, `/v1/forecast14`, is included in `auth.spec.ts` specifically to verify the 403 plan-gate behaves correctly, with the assertion written to also accept `200` so the same test works unmodified on a higher-tier key.

**Why Playwright over Pytest/Mocha/JUnit.** Playwright's `APIRequestContext` covers pure API testing with no browser overhead, ships a built-in HTML reporter (covers the reporting requirement with zero extra tooling), and its fixture system is a natural fit for dependency-injecting a shared, authenticated client into every test — which is what keeps this suite from turning into copy-pasted `fetch` calls.

**Live-probed, not guessed.** The docs at `/docs` don't include example response bodies. Rather than assert against a guessed shape, I hit the live API first to confirm the real payload structure, real error messages, and real status codes, then wrote assertions against what the API actually does. That surfaced two things worth calling out explicitly rather than quietly working around:

- **Rate-limit headers are documented but absent.** The docs promise `X-RateLimit-Limit/-Remaining/-Reset` on every response; live testing found none of them present (quota info is only available via `/v1/usage`'s JSON body). This is captured as an explicit `test.fail()` case in `usage-endpoint.spec.ts` — it reports as a known, expected discrepancy rather than a silent skip or a red build, and would flip to an *unexpected pass* (flagging itself for attention) if the API starts sending those headers.
- **Out-of-range coordinates aren't validated before being forwarded upstream.** `lat=200` or `lon=500` pass the API's own presence/type check and get sent to the underlying weather provider, which fails and surfaces as a generic `502` instead of a `400` with a clear "invalid coordinate range" message. Tested explicitly in `parameter-validation.spec.ts` as current behavior, with a comment explaining it's a gap I found rather than a requirement I inferred.

**Error handling, not just happy paths.** Every endpoint group covers: missing auth (`401`), invalid/garbage auth (`401`), malformed auth scheme (`401`), missing required params (`400`), non-numeric params (`400`), out-of-range params (`502`, see above), and unknown routes (`404`) — alongside boundary-value happy paths (equator, poles, antimeridian).

**Performance, scoped honestly.** A full load/stress test belongs in a dedicated tool (k6, Artillery) and is out of scope for this assignment. What's included instead: a per-request latency budget (`< 3000ms`, well above the ~600–1100ms observed baseline to avoid CI flakiness), a check that repeated calls don't wildly diverge in latency, and a small concurrency check (5 parallel requests all succeed). This is called out as a deliberate scoping decision, not an oversight.

**Reporting.** Three reporters run by default: `list` (readable console output), `html` (visual report with request/response detail, opened via `npm run report`), and `json` (machine-readable, used by CI to publish artifacts). CI additionally deploys the HTML report to GitHub Pages so there's a live link to the latest results, not just a log.

## CI

`.github/workflows/tests.yml` runs on:
- every push/PR to `main` (full suite)
- a daily schedule (`06:00 UTC`), full suite, as a health check against the live API independent of code changes
- manual dispatch (**Actions → API Tests → Run workflow**), where the person triggering it gets a `test_scope` dropdown — `all` / `smoke` / `error-handling` / `performance` — that greps on the matching tag (see [Test tags](#test-tags)); defaults to `all`

All triggers use a `WEATHER_AI_API_KEY` repository secret (never the plaintext key — see [Security note](#security-note)). Every run — regardless of which trigger fired — uploads the HTML report and JSON results as build artifacts, so any reviewer can open the run in the Actions tab and download/view real results; pushes to `main` additionally deploy the HTML report to GitHub Pages for a live link.

**One-time setup after forking/cloning this repo:**
1. Repo **Settings → Secrets and variables → Actions** → add secret `WEATHER_AI_API_KEY`.
2. Repo **Settings → Pages** → set Source to "GitHub Actions".

## Security note

The `.env` file is gitignored and never committed — only `.env.example` (with a placeholder) is tracked. CI reads the key from a GitHub Actions secret, injected as an environment variable at run time, never written to a file or logged.
