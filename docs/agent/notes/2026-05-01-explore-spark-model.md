# Explore agent Spark model

## Goal
Switch the embedded `Explore` default subagent from Claude Haiku to GPT Codex Spark.

## Context
The desired model name should match the shorthand style already used by the global SEO/GEO agent (`gpt-5.4`), so `Explore` uses `gpt-5.3-codex-spark` rather than a provider-prefixed ID.

## Decisions
- Updated `Explore` default agent config to `model: "gpt-5.3-codex-spark"`.
- Updated README default-agent table.
- Updated agent registry tests to assert Spark as the Explore model.
- Left model resolution behavior unchanged: if `gpt-5.3-codex-spark` is unavailable in Pi's model registry, the extension silently falls back to the parent model for config-specified models.

## Commands run
- `npm run typecheck`
- `npm test`
- `./node_modules/.bin/biome check src/ test/`
- `npm run build`

## Files changed
- `src/default-agents.ts`
- `README.md`
- `test/agent-types.test.ts`
- `docs/agent/notes/2026-05-01-explore-spark-model.md`

## Tests
- `npm run typecheck` passes.
- `npm test` passes: 17 tests.
- `./node_modules/.bin/biome check src/ test/` passes.
- `npm run build` passes.

## Risks
- If the local Pi model registry does not expose `gpt-5.3-codex-spark`, Explore falls back to the parent model.
- Spark is intended for fast code exploration; deep planning remains assigned to `Plan`.

## Next
Verify in Pi UI that `Explore` displays/resolves Spark when the model is configured.
