# Plan writes Taskdone planning files

## Goal
Allow the embedded `Plan` subagent to create/update planning artifacts instead of only returning a Taskdone JSON draft in chat.

## Context
Using `Plan` in `/Users/rizzao/Projetos/MeusProjetos/prisema_core` produced a useful planning note, but the new default `Plan` prompt was changed to strict read-only in the prior iteration. That conflicted with the desired workflow where `Plan` owns the plan files and asks the user to approve or request edits.

## Decisions
- `Plan` is now a controlled-write planning artifact author, not a fully read-only agent.
- `Plan` gets built-in `write` and `edit` in addition to read/search tools.
- `Plan` may write only:
  - `.pi/taskdone/plans/<plan-id>/plan.md`
  - `.pi/taskdone/plans/<plan-id>/taskdone.json`
  - `.pi/taskdone/plans/<plan-id>/tasks/*.md` only when explicitly requested
  - `docs/agent/notes/YYYY-MM-DD-<slug>.md` only when explicitly requested by parent
- Product code, config, tests, scripts, migrations, package files, and normal docs remain forbidden.
- The prompt tells Plan to use `write` for creating plan files because parent directories are created automatically.
- README and tests were updated for the controlled-write contract.

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
- `docs/agent/notes/2026-05-02-plan-writes-taskdone-files.md`

## Tests
- TypeScript typecheck passed.
- Test suite passed: 17 tests.
- Biome check passed.
- Build passed.

## Risks
- Tool access is coarse: the runtime can grant `write`/`edit`, but path safety is prompt-enforced unless future tool-level path constraints are added.
- `Plan` should still not be used as an implementation agent; use `general-purpose` or Taskdone execution after user approval.

## Next
- Update Prisema flow to deprecate `/proposta` and route proposal planning through `Explore -> Plan writes .pi/taskdone/plans/<id>/plan.md + taskdone.json -> user approval -> Taskdone execution`.
