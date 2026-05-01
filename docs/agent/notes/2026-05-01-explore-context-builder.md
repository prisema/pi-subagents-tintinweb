# Explore context builder

## Goal
Tune the embedded `Explore` subagent for "Construir Contexto" workflows so system instructions can delegate context gathering to it before planning or implementation.

## Context
`Explore` already used GPT Codex Spark and read-only FFF search tools. The desired behavior is broader than file search: it should produce an evidence-backed Context Pack the parent agent can use directly.

## Decisions
- Changed Explore description to "Fast context-building agent for codebase discovery (read-only)".
- Rewrote the Explore prompt around a read-only Context Pack workflow.
- Kept strict no-write constraints and no state-changing shell commands.
- Kept FFF search tool preference: `fffind`, `ffgrep`, `fff-multi-grep`.
- Explicitly told Explore not to depend on codedb or qmd.
- Added output structure: Summary, Relevant files, Key facts, Flow/relationships, Existing patterns, Tests/validation hooks, Unknowns/risks, Next best action.
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
- `docs/agent/notes/2026-05-01-explore-context-builder.md`

## Tests
- `npm run typecheck` passes.
- `npm test` passes: 17 tests.
- `./node_modules/.bin/biome check src/ test/` passes.
- `npm run build` passes.

## Risks
- Strong output format may be too structured for very tiny lookups, but the prompt allows quick mode and concise output.
- Explore remains read-only; implementation still belongs to parent/general-purpose agents.

## Next
Add this system AGENTS.md guidance if desired:

```md
When you need to build context before planning or implementation, delegate to the `Explore` subagent first. Ask it for a concise Context Pack with relevant files, key facts, flow/relationships, existing patterns, tests/validation hooks, unknowns/risks, and next best action. Do not use `Explore` for edits; use it only to gather and synthesize context.
```
