# Plan task detail visibility

## Goal
Make the default `Plan` subagent show Taskdone task details clearly when converting plans into `.pi/taskdone/plans/<plan-id>/plan.md` and `taskdone.json`.

## Context
A Prisema MVP planning run wrote the requested files, but the final response only said files were created and validated. The detailed tasks existed in `taskdone.json`, but the user did not see them in chat and `plan.md` only had a high-level table. For the subagents + Taskdone integration, users need reviewable task detail before approval.

## Decisions
- Keep `Plan` as a controlled-write planning artifact author only.
- Require `plan.md` to include a detailed task catalog, not just a phase table.
- Require `taskdone.json` task entries to include dependency, validation, and rollback fields in the manifest shape.
- Require the final `Plan` response to include a visible task catalog preview, not only file paths or validation output.
- Document the visible-preview behavior in README.

## Commands run
- `git status --short`
- `git diff -- src/default-agents.ts test/prompts.test.ts README.md`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `./node_modules/.bin/biome check src/ test/`
- `npm run build`

## Files changed
- `src/default-agents.ts`
- `test/prompts.test.ts`
- `README.md`
- `docs/agent/notes/2026-05-02-plan-task-detail-visibility.md`

## Tests
- `npm test` passed: 17 tests.
- `npm run typecheck` passed.
- `npm run build` passed.
- `./node_modules/.bin/biome check src/ test/` passed.
- `npm run lint` returned harness parse error (`ESLint output (JSON parse failed: EOF while parsing a value at line 1 column 0)`) even though the underlying Biome command passed.

## Risks
- Chat output can still be truncated in compact UI notifications for very large plans, but the full response should include a task preview and both artifacts should be self-contained.
- Existing local changes from prior work are present in this repo; this note only covers the task-detail visibility delta.

## Next
- Run validation commands.
- If green, ask user to rerun the Prisema planning prompt or approve/edit the generated task plan after reviewing `plan.md` and `taskdone.json`.
