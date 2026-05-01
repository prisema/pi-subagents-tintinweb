# SEO/GEO global agent placement

## Goal
Move `seo_geo_agent_search` out of bundled default agents and make it a global custom agent with write/edit capabilities.

## Context
A previous change embedded `seo_geo_agent_search` in `src/default-agents.ts` as a default read-only agent. The desired behavior is a global user agent available from `~/.pi/agent/agents/` without forcing Vindula-specific defaults into the extension package.

## Decisions
- Removed `seo_geo_agent_search` from bundled default-agent source, README, types, prompt guidance, and tests.
- Created global custom agent at `/Users/rizzao/.pi/agent/agents/seo_geo_agent_search.md`.
- Gave the global agent all built-in subagent tools: `read`, `bash`, `edit`, `write`, `grep`, `find`, `ls`.
- Kept `extensions: true` and `skills: true` so available extension/media/image tools can be inherited by the subagent runtime.
- Kept model preference as `gpt-5.4`; runtime falls back to parent model if unavailable.

## Commands run
- `rg "seo_geo_agent_search|SEO/GEO|gpt-5.4" src test README.md || true`
- `npm test`
- `npm run typecheck`
- `npm run lint` (failed in harness with `ESLint output (JSON parse failed: EOF while parsing a value at line 1 column 0)`)
- `./node_modules/.bin/biome check src/ test/`

## Files changed
- `/Users/rizzao/.pi/agent/agents/seo_geo_agent_search.md` (global, outside repo)
- `docs/agent/notes/2026-05-01-seo-geo-global-agent.md`

## Tests
- `npm test` passes.
- `npm run typecheck` passes.
- `./node_modules/.bin/biome check src/ test/` passes.

## Risks
- Global agent file is outside Git, so it is machine-local unless synced separately.
- If `gpt-5.4` is unavailable, the extension silently falls back to the parent model for config-specified models.
- Extension/image tools depend on which Pi extensions are loaded in the current runtime.

## Next
Restart/reload Pi extension resources if the current session does not immediately show the new global agent in the Agent tool list.
