# StockPulse Improvement Program

## North Star

- Deliver regulated-ready, data-validated insights with explicit confidence, risk sizing, and audit traceability so investors can act responsibly.
- Maintain Cloudflare Worker latency (<150 ms P95) while raising test coverage to ≥85 % on core modules and enforcing automated QA gates.

## Guiding Principles

- **Purity**: isolate adapters, analysis, and transport layers; inject side effects for deterministic testing.
- **Evidence**: every recommendation communicates inputs, scoring path, and guardrails; no opaque heuristics.
- **Resilience**: handle upstream failures with retries, fallbacks, and observability hooks.
- **Compliance-first**: document assumptions and disclaimers; log all outbound advice for auditability.

## Workstreams

### Architecture & Boundaries

- Refactor `src/index.ts` into `src/http/app.ts`, `src/http/middleware.ts`, and `src/http/controllers/*.ts`.
- Expose `createApp({ analyzer, rateLimiter, cache, logger })` to keep handlers pure and testable.
- Introduce `src/errors.ts` with typed error taxonomy mapped to HTTP responses.
- Update README with a data-flow diagram covering request lifecycle, caching, and rate limiting.

### Data Quality & Adapters

- Add `src/data-sources/yahoo-adapter.ts` with DTO validation and deterministic transforms.
- Implement a cache abstraction (`CacheProvider`) supporting TTL, stale-while-revalidate, and metrics hooks.
- Emit structured telemetry via `src/observability/logger.ts` for outbound calls, retries, and durations.

### Analysis Engine

- Decompose the analyzer into pipeline stages: ingest, indicator calculation, signal scoring, risk sizing, reporting.
- Register `SignalComponent`s with metadata (name, weight, rationale builder) for toggling and experimentation.
- Persist per-ticker scorecards capturing indicator snapshots, rationales, and normalized scores.
- Create a historical benchmark validator comparing recommendations to actual moves over trailing windows.

### Risk & Compliance

- Extend API output with position sizing, drawdown estimates, volatility/liquidity flags, and confidence explanations.
- Enforce guardrails: block buys on illiquid assets, cap stop-loss ratios, downgrade when fundamentals missing.
- Centralize disclaimers in `src/compliance/disclaimers.ts` and surface in API responses and dashboard.
- Log advice events to a KV-backed queue with assumption lists for compliance exports.

### Testing & Quality Gates

- Expand Bun tests under `tests/analyzer/` for indicator weights, veto logic, and risk sizing (fixture-backed).
- Add integration tests for `/api/analyze`, `/api/batch`, `/api/scanner` using mocked adapters.
- Implement rate limiter durability tests via an in-memory Durable Object stub.
- Enforce ≥85 % coverage via `bun run test:coverage`; fail CI below threshold.
- Add property-based validation tests and snapshot checks for scorecards.

### Tooling, CI/CD, and Ops

- Introduce `.github/workflows/ci.yml` running lint, tests, coverage, and Wrangler dry-run deploy.
- Provide `scripts/precommit.sh` (lint + targeted tests) and document hook setup.
- Update `wrangler.toml` for new KV namespaces (`STOCK_CACHE`, `ADVICE_LOG`) and Durable Object bindings.
- Expose `/api/metrics` for latency buckets, cache hit rate, and error counts (API key protected).
- Author runbooks in `docs/runbooks/` for incidents, cache warm-up, and secret rotation.

### Documentation & Knowledge

- Expand README with data provenance, risk methodology, coverage badges, CI status, and ownership map.
- Add `docs/architecture.md` (C4 diagrams, module interactions) and `docs/compliance.md` (disclaimers, logging).
- Provide a sample investor report template (JSON + markdown) in `docs/samples/`.

## Roadmap

| Phase | Focus | Target Duration | Key Deliverables |
| --- | --- | --- | --- |
| Phase 1 – Foundation | Architecture refactor, error taxonomy, adapters, cache abstraction | Week 1 | App factory, validated data sources, logger hooks, architecture documentation |
| Phase 2 – Analysis & Risk | Analyzer pipelines, scorecards, guardrails, compliance logging | Weeks 2–3 | Modular signal engine, risk schema, audit-friendly outputs, regression fixtures |
| Phase 3 – Hardening & Ops | Comprehensive tests, CI/CD, observability, runbooks | Week 4 | ≥85 % coverage, CI workflow, metrics endpoint, runbooks, governance sign-off |

## Success Metrics

- P95 latency: ≤150 ms under 100 RPS.
- Test coverage: ≥85 % for analyzer, utils, rate limiter; regression suite ≤4 min.
- Cache hit rate: ≥70 % on repeat tickers; retries <2 %.
- Compliance logs: 100 % of advice responses with disclaimers and assumption capture.

## Governance

- Weekly architecture reviews with leads from engineering, quant, and ops.
- PR gate: design notes for pipeline changes plus compliance sign-off for risk-affecting updates.
- Monthly benchmark validator review to recalibrate indicator weights and heuristics.

## Immediate Actions

1. Draft RFC for adapter refactor and extended risk schema; circulate for feedback.
2. Create workstream issue board with milestones and owners.
3. Kick off Phase 1 tasks, pairing each structural change with targeted tests to preserve correctness.
