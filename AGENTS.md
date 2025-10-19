# Repository Guidelines
## Project Structure & Module Organization
StockPulse runs as a Cloudflare Worker with Hono routing. `src/index.ts` wires HTTP handlers, rate limiting, and the dashboard. Feature logic lives in focused modules (`src/analyzer.ts`, `src/tickerFetcher.ts`, `src/rateLimiter.ts`) with shared helpers in `src/utils.ts` and types in `src/types.ts`. Keep new files beside their feature and mirror that shape under `tests/`. Project settings live in `wrangler.toml`, TypeScript config in `tsconfig.json`, and lint rules in `biome.json`.
## Build, Test, and Development Commands
- `bun install` — install dependencies from `package.json`.
- `bun run dev` — run Wrangler’s local worker with live reload.
- `bun run test` — execute Bun unit tests in `tests/`.
- `bun run test:watch` — keep tests running while editing.
- `bun run test:coverage` — produce coverage output for CI.
- `bun run lint` — apply Biome linting and formatting; run before commits.
- `bun run deploy` — push the worker via Wrangler using `wrangler.toml`.
## Coding Style & Naming Conventions
Use modern TypeScript with ES modules, two-space indentation, and Biome’s no-semicolon default. Prefer named exports, PascalCase for classes (`StockAnalyzer`), camelCase for functions and variables, kebab-case file names (`rate-limiter.ts`), and keep functions small. Only move cross-cutting helpers into `src/utils.ts` after they see reuse.
## Testing Guidelines
Bun’s test runner lives alongside the code; add new suites as `*.test.ts` under `tests/featureName`. Stub external calls with fixtures or in-memory mocks to avoid Yahoo Finance traffic. Target ≥80% coverage for `analyzer`, `utils`, and `rateLimiter`, and ensure each endpoint has success and failure assertions.
## Commit & Pull Request Guidelines
Follow the existing history: imperative, concise subjects under 72 characters (e.g., `Improve rate limiter messaging`). Group related changes per commit and avoid WIP noise. Each PR should explain intent, link issues, list verification commands (`bun run lint`, `bun run test`), and add screenshots or payload samples when UI or responses change.
## Security & Configuration Tips
Manage secrets with Wrangler (`wrangler secret put RATE_LIMITER`) and never commit `.env` artifacts. Declare new bindings in `wrangler.toml` and document them in the README. When adding caches or external services, note default TTLs and fallback behaviour so others can reproduce production setups.
