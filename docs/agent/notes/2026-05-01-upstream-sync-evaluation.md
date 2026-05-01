# Upstream sync evaluation

## Goal
Review `upstream/master` and upstream branches from `tintinweb/pi-subagents`, bring useful upstream fixes into the Prisema fork, and avoid changes that increase runtime risk.

## Context
Current fork diverged from upstream at `94f7f78` (`v0.5.2`). Before this sync:
- `origin/master`: `95a6cf6`
- `upstream/master`: `32dbe29`
- Upstream had 27 commits not in the fork.
- Fork had 4 commits not in upstream.

## Decisions
Brought into the fork:
- Pi 0.68+ `createAgentSession({ tools })` compatibility by passing built-in tool names instead of cwd-bound tool objects.
- `getAgentDir()` support so global custom agents honor `PI_CODING_AGENT_DIR` instead of hardcoded `~/.pi/agent`.
- Subagent prompt isolation with `noContextFiles: true` and `appendSystemPromptOverride: () => []`, preventing `AGENTS.md` / `APPEND_SYSTEM.md` from leaking into standalone or isolated subagents.
- Persistent `/agents` settings via global/project `subagents.json` plus `subagents:settings_loaded` and `subagents:settings_changed` events.
- Windows-safe output file cwd encoding and safer `chmod` handling.
- Abort propagation from parent tool call into foreground subagent execution.
- Default-agent strategy fields left undefined so callsite params like `run_in_background`, `inherit_context`, and `isolated` work.
- `defineTool()` wrappers from upstream for better typed tool registration.
- Upstream tests for settings/output file behavior.
- Dependency-shape fix adapted for this fork: Pi framework packages moved out of runtime dependencies into peer/dev deps, while keeping Prisema metadata and local dev on `^0.68.0`.

Preserved fork behavior:
- Kept `cleanupInterval.unref?.()` so print/non-interactive runs can exit.
- Kept guarded output-file creation fallback for missing/older `ctx.sessionManager.getSessionId`.
- Kept Prisema package metadata/repository.

Deferred / not brought now:
- Upstream version-only release commits and changelog-only release mechanics were not copied as-is.
- `upstream/feat/scheduled-subagents` is interesting but large and unmerged; defer until there is a concrete need for scheduled agent jobs.
- `upstream/fix/token-counts` is promising for UI usage accuracy and compaction visibility, but it is not in upstream master; defer to a separate focused pass.
- `upstream/feat/cross-extension-api` is already mirrored in our `origin/feat/cross-extension-api` branch and not merged to master.

## Commands run
- `git fetch --all --prune`
- `git merge-base origin/master upstream/master`
- `git log --oneline --decorate --no-merges <base>..upstream/master`
- `git branch -r --format='%(refname:short) %(committerdate:short) %(subject)'`
- `git checkout upstream/master -- README.md src/agent-manager.ts src/agent-runner.ts src/agent-types.ts src/custom-agents.ts src/default-agents.ts src/index.ts src/output-file.ts src/settings.ts test/agent-runner.test.ts test/agent-types.test.ts test/custom-agents.test.ts test/output-file.test.ts test/settings.test.ts`
- `npm install --package-lock-only --ignore-scripts`
- `npm run typecheck`
- `npm test`
- `./node_modules/.bin/biome check src/ test/`
- `npm run build`
- `npm run lint` (failed in harness with `ESLint output (JSON parse failed: EOF while parsing a value at line 1 column 0)`; direct Biome command above passed)
- `npm pack --dry-run`

## Files changed
- `.gitignore`
- `.npmignore`
- `README.md`
- `package.json`
- `package-lock.json`
- `src/agent-manager.ts`
- `src/agent-runner.ts`
- `src/agent-types.ts`
- `src/custom-agents.ts`
- `src/default-agents.ts`
- `src/index.ts`
- `src/output-file.ts`
- `src/settings.ts`
- `test/agent-runner.test.ts`
- `test/agent-types.test.ts`
- `test/custom-agents.test.ts`
- `test/output-file.test.ts`
- `test/settings.test.ts`
- `docs/agent/notes/2026-05-01-upstream-sync-evaluation.md`

## Tests
- `npm run typecheck` passes.
- `npm test` passes: 17 tests.
- `./node_modules/.bin/biome check src/ test/` passes.
- `npm run build` passes.
- `npm pack --dry-run` passes and excludes local codedb snapshots / agent notes after `.npmignore` update.
- Local `codedb.snapshot*` artifacts are ignored by Git via `.gitignore`.

## Risks
- Moving Pi packages to peer/dev dependencies changes install shape. This should reduce duplicate runtime instances, but packaging should be checked before publish.
- Persisted settings now write `.pi/subagents.json` from `/agents` settings; this is intended but creates new project-local config state.
- Prompt isolation is a behavior change: standalone subagents no longer implicitly receive project `AGENTS.md` / `APPEND_SYSTEM.md`. Agents that need parent rules should use append mode or inline instructions.
- Deferred upstream branches may still contain useful UI/feature work and should be reviewed separately.

## Next
- Run this extension inside Pi and verify `/agents`, global custom-agent discovery, background agent output files, and foreground abort behavior.
- Consider a separate branch/patch for `upstream/fix/token-counts` after manual UI review.
- Consider `upstream/feat/scheduled-subagents` only if scheduled subagents become a requested feature.
