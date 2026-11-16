---
name: wrapup
description: Autonomous end-of-session review chain — code review, security review, simplify, verify, commit
argument-hint: "[optional rev range, e.g. HEAD~4..HEAD]"
disable-model-invocation: true
---

Run the end-of-session review chain over this session's commits, unattended, strictly in this order. Do not reorder, do not run them in parallel, and do not skip a step because the previous one was clean.

Scope: `$ARGUMENTS` if given — a rev range or a base ref — otherwise the commits this session made on the current branch. Derive that range from the session transcript: the first commit you made this session is the tip's ancestor, so the range is `<that commit>^..HEAD`. If no commit was made this session, say so in one line and stop.

**Ignore the uncommitted working diff.** Review `git diff <range>` and `git log <range>`, never `git status` or a bare `git diff`. Uncommitted files may belong to another concurrent session — leave them alone, and exclude any file whose only changes in the range are already superseded by uncommitted edits you did not make.

Read the repo's CLAUDE.md or AGENTS.md first: it names the checks, gates and commit conventions this chain uses.

## Loop

Run as a self-paced loop: invoke the `loop` skill with **no interval**, so the chain continues without waiting for me. Minimise questions — you have authority to decide which findings to act on, to apply the fixes, and to commit. End the loop when stage 4 has been verified and committed and nothing closable is left, or when genuinely blocked on something only I can supply; in that case commit what is finished, state the block in one line, and stop.

## Stages

1. **Code review** — bug-hunting first. Invoke the `code-review` skill against the session's commit range (`git diff <range>`) rather than a pull request, and report findings here instead of posting them anywhere.
2. **Security review** — invoke the `security-review` skill over the same range. It can still change design, so it must land before polish.
3. **Simplify** — invoke the `simplify` skill last, over the same range. It applies rewrites, so running it earlier would invalidate what the first two reviewed.
4. **Commit** — if the fixes change what a route renders or reads, run the repo's end gate once (the slow checks CLAUDE.md or AGENTS.md says run before a commit, such as e2e or performance budgets). Then commit the fixes the earlier stages produced.

Each of stages 1–3 is: review → act on the findings → verify → report in a few lines → next stage. Act on every finding that is a real defect or a real simplification; drop the rest with a one-line reason rather than asking. Escalate to me only a finding whose fix is a design decision I have not already settled — and while waiting, finish everything that does not depend on the answer.

## Verification

**Mandatory and unbudgeted**, after each stage that changed a file: the repo's fast checks — lint, typecheck for every workspace the change can reach, and any guard scripts the build runs — as CLAUDE.md, AGENTS.md or `package.json` name them.

**Live verification**: drive every change to what a route renders or does in the running app. Read the verification doc CLAUDE.md or AGENTS.md names, if any (dev servers, sign-in, test accounts); it wins where it differs. In a Next.js app, invoke the `nextjs:next-dev-loop` skill (from the `nextjs@nextjs` plugin) and follow its loop; if it is not installed, say so and verify by hand. The five-minute budget applies to a stuck attempt, not to a verification that is merely fiddly. Schema work goes to a throwaway database branch, app-level verification to the repo's test environment or tenant, never live data. A verification still closable in development is closed, not listed; only one that needs my hand goes under **Unverified**, with the path attempted and its specific failure.

## Commit

Commit the fixes as new commits on the current branch; never amend or rebase a commit already in the range. Single-line subjects. Atomic `git commit -m "…" -- <explicit file paths>`, listing only files you changed in this chain, so a concurrent session's uncommitted work is never swept in; never `git commit -- <directory>`, and watch untracked files and `git mv` traps. Split into separate commits where the fixes span unrelated concerns. Format only the files you touched; never a repo-wide format. Never `--no-verify`. Never push.

## Report

The conclusion, not the search: per stage, what changed and its commit subject, then **Unverified** and **Blocked on me** (or "nothing").
