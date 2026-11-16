---
name: build
description: Build every app and package in a JS/TS monorepo (turbo, nx or a plain workspace build) and triage any failures without changing code
argument-hint: "[workspace filter, e.g. web]"
allowed-tools: Bash, PowerShell, Read, Grep, Glob
disable-model-invocation: true
---

Run a full workspace build and confirm every app and package compiles.

Find the build first: read the repo's CLAUDE.md or AGENTS.md, then the root `package.json` `build` script. Note what it runs before the compile (lint, guards, tests) and which package manager the repo uses (the lockfile says: `bun.lock`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`). Use that package manager, never another.

- If `$ARGUMENTS` is empty, build the entire workspace with the root `build` script.
- If `$ARGUMENTS` is given, treat it as a workspace filter and build only that target with the orchestrator's filter (`turbo build -F $ARGUMENTS`, `nx build $ARGUMENTS`, `pnpm --filter $ARGUMENTS build`). The orchestrator still builds its dependencies first.

## Invoking it

The build command is **one command, run from the repo root, with nothing chained in front of it**.

- Never prefix it with `cd <package>` or chain it after another command. Inside a package, `build` is usually that package's own build, not the root one: it exits in seconds having built one workspace, and the orchestrator's summary never appears.
- If a package must be built first, invoke it explicitly and separately through the orchestrator's filter. Do not reach it by changing directory.

## Waiting for it

If you background the build, wait on **process exit**, not on output shape.

- Do not poll for a summary line (turbo's `Tasks:` / `Cached:`). It exists only for a root orchestrated build, and a filtered or single-package build may never print it. Polling for it hangs forever on a build that already succeeded.
- If a waiter outlives the process, the waiter is wrong, not the build — read the actual output and report what it says.

Then:

1. If the build succeeds, report a concise **PASS** summary listing the apps and packages that built (and any that were cache-hit / skipped).
2. If the build fails, report **FAIL**: identify which guard, test or workspace failed, show the relevant TypeScript / compiler errors, and `Read` the offending files to pinpoint the cause. Report the diagnosis — do not change any code unless I explicitly ask.
