---
name: deliver
description: Take a defined feature brief (goal, requirements, the tests that prove them) from implementation to committed, evidenced work with no questions — implement in a loop, wrapup, every test suite, /verify in the running app, build, commit. Use when handed a brief to deliver unattended, "deliver this", "/deliver <brief>", or as the last task of a ship session.
argument-hint: "<the brief, or a path naming one>"
---

# Deliver

Input: a brief with a **goal**, **requirements** and **the tests that prove them**, in the conversation or named by `$ARGUMENTS` (a path or a heading). Read it, then run start to end without asking anything. Ordinary judgment calls are yours; stop only when blocked on something only I can supply, and then commit what is finished and say so under **Blocked on me**.

Read the repo's CLAUDE.md or AGENTS.md first. Its **Checks** table names the suites, their commands, when each is needed and how long it takes; its commit rules decide how you commit.

## Order

1. **Implement** as a self-paced loop: invoke the `loop` skill with no interval. After every change that touches a file, run the fast checks (lint, typecheck, unit tests). They are never skipped or time-boxed.
2. **`wrapup`** over the commits this run made.
3. **Tests.** Run every suite in the Checks table by default. Skip one only with a written reason tied to the diff (for example "no file under `db/` or the SQL layer changed"). Run the performance check (such as `db:bench:quick`) whenever SQL, indexes, the query planner or the schema change. Record each suite's duration. A test that fails and then passes on an unchanged rerun is **flaky**: record it under Test health and do not work around it.
4. **`/verify`** — the built-in Claude Code skill — on each requirement in the running app, following the project's verify note (`.claude/skills/verify` or what CLAUDE.md/AGENTS.md names). Budget: 20 minutes in total, split across the requirements, with a 5-minute cap on any stuck attempt. A requirement that runs out of time is marked **Unverified** with the path tried. Verification drives the running app; it never edits tests. Use the in-app browser (`mcp__Claude_Browser__*`) by default; use agent-browser only where it is absent (outside the desktop app). The project's note adds how to start its app and which pages to drive.
5. **`build`** — invoke the `build` skill. If it fails, go back to step 1 with its diagnosis.
6. **Commit** with the repo's commit rules: new commits, single-line subjects, explicit file paths, only files this run changed. Never amend, never `--no-verify`, never push.

A failure in step 3 or step 4 also loops back to step 1, carrying the failure as the next change to make. The run ends when every requirement has evidence or is marked Unverified, and the build is green.

## Staying alive

A turn can end before the run does: a nested skill's "reply with only the report", a long tool result, an interruption. The loop's wakeup is the safety net, so it is never optional.

- At the start of step 1 and again at the start of every later step, call `ScheduleWakeup` with `delaySeconds` 1200 and the same loop input, as the fallback heartbeat. A turn that ends early then resumes on its own.
- On any wakeup, find where the run stands from `git log`, the working tree and the transcript, say the step in one line, and carry on from it. Never restart a finished step.
- `wrapup` runs inside this loop: it does not start a loop of its own.
- Stop the loop (`ScheduleWakeup` with `stop: true`) only in the same turn as the final report, or when blocked on me.

## Report

The final message carries these headings and nothing else:

- **Evidence** — each requirement → the test and/or verify step that proves it.
- **Test health** — the slow suites with their times; flaky tests, each with its file; suites skipped, each with its reason.
- **Browser health** — one line: which browser was used and anything it did wrong, or "no issues".
- **Unverified** — each requirement not proven, with the path tried (or "nothing").
- **Changed** — one line per commit subject.
- **Blocked on me** — or "nothing".
