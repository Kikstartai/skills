---
name: wrapup
description: Autonomous end-of-session review chain — code review, security review, simplify, fast checks, commit
argument-hint: "[optional rev range, e.g. HEAD~4..HEAD]"
---

Run the end-of-session review chain over this session's commits, unattended, strictly in this order. Do not reorder, do not run them in parallel, and do not skip a step because the previous one was clean.

The running app and the slow suites (e2e, database tests, benchmarks, the build) are `deliver`'s job, not this chain's; run alone, wrapup is a code review and tidy only.

Scope: `$ARGUMENTS` if given — a rev range or a base ref — otherwise the commits this session made on the current branch. Derive that range from the session transcript: the first commit you made this session is the tip's ancestor, so the range is `<that commit>^..HEAD`. If no commit was made this session, say so in one line and stop.

**Ignore the uncommitted working diff.** Review `git diff <range>` and `git log <range>`, never `git status` or a bare `git diff`. Uncommitted files may belong to another concurrent session — leave them alone, and exclude any file whose only changes in the range are already superseded by uncommitted edits you did not make.

Read the repo's CLAUDE.md or AGENTS.md first: it names the fast checks and commit conventions this chain uses.

## Loop

Run as a self-paced loop: invoke the `loop` skill with **no interval**, so the chain continues without waiting for me. Minimise questions — you have authority to decide which findings to act on, to apply the fixes, and to commit. End the loop when stage 4 has committed and nothing closable is left, or when genuinely blocked on something only I can supply; in that case commit what is finished, state the block in one line, and stop.

## Stages

1. **Code review** — bug-hunting first. Invoke the `code-review` skill against the session's commit range (`git diff <range>`) rather than a pull request, and report findings here instead of posting them anywhere.
2. **Security review** — invoke the `security-review` skill over the same range. It can still change design, so it must land before polish.
3. **Simplify** — invoke the `simplify` skill last, over the same range. It applies rewrites, so running it earlier would invalidate what the first two reviewed.
4. **Commit** — commit the fixes the earlier stages produced.

Each of stages 1–3 is: review → act on the findings → fast checks → report in a few lines → next stage. Act on every finding that is a real defect or a real simplification; drop the rest with a one-line reason rather than asking. Escalate to me only a finding whose fix is a design decision I have not already settled — and while waiting, finish everything that does not depend on the answer.

A stage skill's instruction about the final reply (such as "reply with only the report") governs that stage's report, not the turn: print the report, then go straight on to the next stage. The chain ends only after stage 4.

## Fast checks

**Mandatory and unbudgeted**, after each stage that changed a file: lint, typecheck for every workspace the change can reach, and the unit tests, as the repo's CLAUDE.md or AGENTS.md names them (falling back to `package.json`).

## Commit

Commit the fixes as new commits on the current branch; never amend or rebase a commit already in the range. Single-line subjects. Atomic `git commit -m "…" -- <explicit file paths>`, listing only files you changed in this chain, so a concurrent session's uncommitted work is never swept in; never `git commit -- <directory>`, and watch untracked files and `git mv` traps. Split into separate commits where the fixes span unrelated concerns. Format only the files you touched; never a repo-wide format. Never `--no-verify`. Never push.

## Report

The conclusion, not the search: per stage, what changed and its commit subject, then **Blocked on me** (or "nothing").
