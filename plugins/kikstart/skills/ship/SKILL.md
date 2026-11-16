---
name: ship
description: Hand a major piece of work to an unattended agent session in its own git worktree, running as a self-paced loop until done and committing as it goes. The brief is confirmed with the user before anything is spawned. Use when the user wants work delivered with minimal interaction — "spawn a chip for this", "run this autonomously", "loop until it's done", "ship this in a worktree", "/ship <thing>" — or when a task is large enough to hand off rather than do inline. Also use when splitting work across two or more dependent sessions.
argument-hint: "<the work, e.g. add the inventory ledger tables and module>"
allowed-tools: Read, Grep, Glob, Skill, Bash, PowerShell, AskUserQuestion, mcp__ccd_session__start_session
disable-model-invocation: true
---

# Ship

Compose an unattended worktree session for `$ARGUMENTS`, confirm the brief with the user, then spawn it as a new session. Nothing is spawned before the user has said yes.

If `$ARGUMENTS` is empty and the conversation names no work, ask what to ship before doing anything else.

## Procedure

0. **Check you can spawn.** If `mcp__ccd_session__start_session` is not available, say that `ship` needs the Claude desktop app's sessions, offer to print the brief for the user to paste into a fresh worktree session themselves, and stop. Continue only if the user takes that offer, and then print the final prompt in one fenced block in step 5 instead of spawning.

1. **Find the repo's harness.** Read the repo's CLAUDE.md or AGENTS.md. If either points to an agent-session contract, read it and restate its harness sections in full in the prompt, never paraphrased: the spawned session shares no context with you, and neither memory nor gitignored `.claude/` rules, settings and hooks travel into a worktree. Otherwise, state the **Default harness** below in the prompt, filled in with the repo's real commands from CLAUDE.md, AGENTS.md and `package.json`.

2. **Assemble the brief** from the **Brief** table, plus **Allowance**: the model and effort, whether extra usage may be spent (default no), and any time-boxed allowance the user names (a discount or reset ending at a set time) with what happens when it passes. Default when it passes: keep going on normal allowance and say so in the final report.

   Investigate before drafting. Read the files, run the greps, and name the real helpers, tables and routes involved rather than describing them approximately. Decide the ordinary calls yourself; ask the user only where two readings would produce materially different work.

3. **Split if the work has a hard internal dependency.** Give each dependent session a Gate that checks its base branch for the artefact it needs and stops in one line if absent, then spawn all of them at once. Never rely on the user clicking them in order.

4. **Confirm.** Print each brief to the chat — its sections, the session title and the branch it will work from. Add a short **Open questions** list only where an answer would change the work, each carrying your recommendation so the user can confirm rather than compose. Then stop. Do not spawn in the same turn as the draft. On a correction, revise and re-print; never spawn a brief the user has not seen in its amended form.

5. **Spawn each** on the user's yes, with `mcp__ccd_session__start_session` — `initiation: "user_asked"`, `context: "fresh"`, `use_worktree: true`, the Allowance's `model` and `effort`, the brief plus the harness plus the child lines from **Usage limits** as `prompt`, one or two plain sentences of goal as `background`. A model or effort above this session's is silently capped; raise them with `mcp__ccd_session_mgmt__set_session_model` and `mcp__ccd_session_mgmt__set_session_effort` right after the start, while the user is still there to approve it. Both apply from the child's next turn, so its first turn only runs setup and starts the loop. The prompt stands alone: no "as we discussed", no reference to this conversation. The title is imperative, under 60 characters, and names the dependency if there is one. The prompt's last task, after the Definition of done is met, is to run the `wrapup` skill, and the session is not done until it has finished.
6. **Report** what each session covers, in a few lines — the decisions it carries and the gates it must pass — and that resumes need the app open and the machine awake, then stop. Do not restate the prompt.

## Brief

Every section is required; an empty one means the work isn't ready to hand over.

| Section | Contents |
| --- | --- |
| **Goal** | One paragraph: what exists at the end that doesn't now. |
| **Gate** | Only for a dependent session: the artefact to check for in the base branch, and an instruction to stop in one line if it is absent. |
| **Read first** | The skills to load, chosen by what the work touches, not by habit. The docs to read. |
| **Current state** | What exists today, with file paths, told as "verify, don't trust". Includes what to reuse so the session doesn't build a second one. |
| **Design — decided** | The decisions already made, with the reasoning compressed to the constraint that forced each. Ends with "implement it; do not redesign". |
| **Definition of done** | A numbered list, each item independently checkable, carrying one item that says verification is complete rather than attempted. |
| **Non-goals** | The adjacent work another session owns, named explicitly. |

## Default harness

Use when CLAUDE.md and AGENTS.md point to no agent-session contract. Restate each section in the prompt, with the repo's real commands filled in.

- **Loop.** Run as a self-paced loop: invoke the `loop` skill with no interval. End when the Definition of done is met, or when genuinely blocked on something only the user can supply: write the block down, commit, and stop. Minimise questions; the session has authority to make ordinary judgment calls and to commit. Done means nothing closable is left; an item still closable in development is work, not a caveat. The final message carries three headings and nothing else: **Blocked on me** (or "nothing"), **Changed** (one line per commit subject), **Found** (defects or decisions surfaced outside the brief, each with its file).
- **Worktree setup.** A worktree checks out tracked files only: no `.env` files, no dependencies installed. Run the repo's worktree setup script if it has one; otherwise copy the env files the repo documents and install with the repo's package manager before anything else.
- **Verification.** Run the repo's fast checks (lint, typecheck, guards, unit tests, as CLAUDE.md, AGENTS.md or `package.json` name them) after every change that touches a file; they are never skipped or time-boxed. Run the slow end gates once, before the final commit. Drive runtime changes in a real browser or device, not only a typecheck. A five-minute budget applies to a stuck verification attempt, not to one that is merely fiddly. An abandoned verification names the path attempted and the specific failure under **Unverified**.
- **Commit rules.** Commit on the worktree branch, never on the default branch, and never push. Single-line subjects. `git commit -m "…" -- <explicit file paths>`; never a directory or `.`, never `--no-verify`, never `--amend`. Commit per coherent milestone. Format only the files you touched; never a repo-wide format. Watch untracked files and `git mv` traps.
- **Merging back.** Merge the default branch into the worktree branch early and often, and before any review pass, so reviews run against the tree that will merge. Prefer main's approach where both sides solved the same problem. The user fast-forwards the default branch afterwards.
- **Docs.** Record deferred work in the feature's doc, in one outstanding list, if the repo keeps feature docs.

## Usage limits

- **Child lines**, restated in every prompt: do nothing at a limit, the app or the user resumes you; never spend extra usage unless the brief's Allowance says to.
- **The 5-hour limit resumes itself.** The desktop app retries an interrupted turn after the reset while the session-limit card's **Auto-continue when limits reset** stays checked (the default) and the app stays open.
- **A weekly limit stops the run.** The user sends the child "continue" after the reset.
- **Never spend beyond the plan.** Extra usage changes nothing unless the Allowance says to spend it.
- **A time-boxed allowance passing** follows what the Allowance recorded; the default is to keep going on normal allowance and note it in the report.

## Calibration

The harness is fixed; the brief is where judgment goes. A brief that reads as a list of wishes produces a session that invents scope. A brief that names the constraint behind each decision produces one that holds the line when it hits friction.

Spend the effort on **Current state** and **Design — decided**. Those two are what stop the session from rebuilding something that exists or redesigning something already settled.

If the repo's CLAUDE.md or AGENTS.md sets a target scale, **Design — decided** states the design's cost at that scale, in time and in money, for everything in it that grows with load. A design that does not hold there is redesigned before the brief is spawned, not handed to the session to discover.
