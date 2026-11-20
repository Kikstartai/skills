---
name: spawn
description: Emit a self-contained prompt that continues this session in a fresh one — phase overview first, stand down until I say go, then run as a self-paced loop
argument-hint: "<optional focus, e.g. field phase 4a; defaults to what this session was doing>"
allowed-tools: Read, Grep, Glob, Bash, PowerShell
---

This session's context is large. Write the prompt that continues `$ARGUMENTS` in a new session. **Emit the prompt. Start nothing, spawn nothing, change nothing.**

If `$ARGUMENTS` is empty, take what this session has actually been working on.

## Gather first

- `git status --porcelain` and `git log --oneline -15` — what has landed, and what is still uncommitted and where.
- The doc that owns this effort, if the repo keeps one (a feature doc, plan or spec; the repo's CLAUDE.md or AGENTS.md says where docs live). It carries the phase plan and the one outstanding list.
- Any memory entry for this effort, for status and settled decisions.

Where a decision was taken in this session's conversation and is written down nowhere else, it exists only here — carry it into the prompt or it is lost.

## Emit

One fenced block, nothing else before it but a single line naming the effort. Everything inside stands alone: no "as we discussed", no reference to this conversation, no session ids. Written to the new session in the second person.

The block carries, in order:

1. **Effort** — one line: what this is, and the doc and memory that own it.
2. **Where it stands** — one line per phase, in order: phase name — done / in progress / not started, and the single fact that decides which. Where the doc and the commits disagree, take the commits and say so.
3. **Uncommitted state** — the branch, the checkout it lives in, and the dirty files by path with one clause each on what they change. Say plainly if it is clean. A session that opens in a fresh worktree will not see any of it, so the prompt says which checkout to open.
4. **Decisions taken and not yet written down** — from this conversation, one line each. Omit the section if there are none.
5. **Next up** — the outstanding items of the phase in progress, numbered, one short line each.
6. **Owed by me** — a decision, a credential, a live-environment action the session cannot take. Omit if there is none.
7. **Read first** — the doc, the memories, and the three or four files that actually matter. Paths only.
8. The standing instruction, verbatim as the last two paragraphs of the block:

   > Read those first, then give me the overview above in your own words, corrected against what you find — one line per phase, then the numbered next-up list. Then stop and wait. No plan, no options menu, no recommendation of what to do first unless I ask, no edits, no commits. Ending your first turn with nothing started is the correct outcome.
   >
   > Once I have given the go-ahead, invoke the `loop` skill with no interval and work the next-up list to done on a self-paced loop, without me. You have authority to make the ordinary judgment calls and to commit — one commit per item, at each build → verify boundary, and never with `--amend`. Where my go-ahead sets a different commit protocol, it wins. Keep the effort doc's outstanding list as the single record of what is left. Check in only when genuinely blocked on something only I can supply: write the block into the effort doc, commit what is finished, and stop in one line. Do not stall waiting, and do not invent a workaround to avoid asking.

Then stop. No summary of the block, no offer to spawn it, no next step.
