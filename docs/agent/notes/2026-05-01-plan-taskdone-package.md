# Plan agent Taskdone package

## Goal
Merge Superpowers-style planning, Taskdone manifest drafting, and the subagents workflow into the embedded `Plan` agent.

## Context
The desired direction is to reduce duplicate planning flows (`/proposta`, Taskdone plan mode, ad hoc subagent planning) by making `Plan` the read-only planning architect that produces an approval-gated Taskdone-ready package.

Relevant materials reviewed earlier in this session:
- Superpowers `brainstorming`, `writing-plans`, `executing-plans`, `subagent-driven-development`, `test-driven-development`, and `verification-before-completion` skills.
- Taskdone README and plan/task generation prompts.
- Prisema `/proposta` flow and Taskdone handoff code.

## Decisions
- Reframed `Plan` as `Taskdone-ready planning architect (read-only)`.
- Kept `Plan` read-only: it must not write files or implement code.
- Changed `Plan` extensions from unrestricted `true` to FFF-only: `ffgrep`, `fffind`, `fff-multi-grep`.
- Added a full Taskdone manifest contract to the Plan prompt.
- Added Superpowers-inspired gates: clarify scope, use Context Pack, options/tradeoffs, recommendation, no placeholders, validation gates, approval request.
- Required Plan to end with: `Aprova este plano e o Taskdone JSON, ou quer ajustes?`
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
- `docs/agent/notes/2026-05-01-plan-taskdone-package.md`

## Tests
- `npm run typecheck` passes.
- `npm test` passes: 17 tests.
- `./node_modules/.bin/biome check src/ test/` passes.
- `npm run build` passes.

## Risks
- `Plan` now drafts JSON but remains read-only. The parent or Taskdone flow must save/apply the approved manifest.
- The JSON includes metadata fields (`meta`, optional `dependsOn`, `parallelGroup`) that Taskdone tolerates, but the current Taskdone executor only enforces task order/status/markers and does not schedule dependencies itself.
- `/proposta` is not removed from `pi-extension-prisema` in this commit; it should be deprecated or rewritten separately to avoid mixing repos and unrelated local changes.

## Next
- Update Prisema AGENTS guidance to make the canonical flow: `Explore` Context Pack -> `Plan` Taskdone Planning Package -> user approval -> save manifest/run Taskdone.
- Deprecate `/proposta` in `pi-extension-prisema` or turn it into a wrapper around the new Plan/Taskdone flow.
