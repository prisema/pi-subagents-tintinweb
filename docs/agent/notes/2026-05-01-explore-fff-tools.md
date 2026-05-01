# Explore FFF tools

## Goal
Allow the embedded `Explore` subagent to use read-only FFF search tools from `@ff-labs/pi-fff` and bias its prompt toward faster code discovery.

## Context
`Explore` is a read-only file/codebase discovery agent. The user wants it to use the FFF extension tools (`fffind`, `ffgrep`, `fff-multi-grep`) while preserving read-only safety.

## Decisions
- Added an FFF extension allowlist for Explore: `ffgrep`, `fffind`, `fff-multi-grep`.
- Kept built-in Explore tools read-only: `read`, `bash`, `grep`, `find`, `ls`.
- Updated Explore prompt to prefer FFF tools and fall back to built-in `find`/`grep` only when needed.
- Added a prompt rule to read strongest results after limited searching instead of looping through search calls.
- Updated README and tests.

## Commands run
- `npm run typecheck`
- `npm test`
- `./node_modules/.bin/biome check src/ test/`
- `npm run build`

## Files changed
- `src/default-agents.ts`
- `README.md`
- `test/agent-types.test.ts`
- `test/prompts.test.ts`
- `docs/agent/notes/2026-05-01-explore-fff-tools.md`

## Tests
- `npm run typecheck` passes.
- `npm test` passes: 17 tests.
- `./node_modules/.bin/biome check src/ test/` passes.
- `npm run build` passes.

## Risks
- If `@ff-labs/pi-fff` is not installed or loaded, Explore still has built-in read-only search tools.
- Extension allowlist matching is by tool name/prefix/includes in the subagent runtime, so tool names must stay `ffgrep`, `fffind`, and `fff-multi-grep`.

## Next
Potential Explore improvements: structured evidence output, search budgets by thoroughness level, codedb preference when available, dependency/import graph hints, and better final "critical files" summaries.
