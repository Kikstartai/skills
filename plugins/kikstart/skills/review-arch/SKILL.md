---
name: review-arch
description: Review a folder's architecture, then autonomously implement the findings in a loop, committing per item
argument-hint: "<folder path, e.g. packages/web/src/core/orders>"
allowed-tools: Read, Write, Edit, Grep, Glob, Skill, Bash, PowerShell, TaskCreate, TaskUpdate, TaskList, ScheduleWakeup
---

Review the architecture of `$ARGUMENTS`, decide what to change, and implement it. You run this to completion on your own — I am not in the loop between items.

If `$ARGUMENTS` is empty, ask which folder before doing anything else.

Four phases, in order: **Review → Decide → Implement → Report**. Do not start implementing before the whole review is written; a worklist assembled mid-read is a worklist ordered by what you happened to open first.

If a review of this folder was already produced earlier in this session, reuse it. Do not re-read the tree.

## Repo rules

Read the repo's CLAUDE.md or AGENTS.md and, if present, `docs/ARCH-REVIEW.md` before anything else. That doc holds this repo's specifics for this skill: the conventions lens, extra lenses and the skills they invoke, scale costs, the gate commands and guards, the verification doc, what is in or out of mandate, the ledger and queue files, the formatter and the commit hook. Where it differs from a default below, it wins. Where it is silent, the defaults apply.

## The ledger

The ledger is `docs/arch-reviews/<folder>.md` unless the repo's arch-review doc names another location or naming rule. `<folder>` defaults to the folder's last path segment.

**Read the ledger before anything else.** A prior run's rulings are settled: its non-findings are not re-raised, its explicit rejections are not re-proposed, and its deferred items carry their blocker forward until that blocker changes. Scope the new pass to what changed since — `git diff --stat <last-run-commit>..HEAD -- <folder>` — and say so in the verdict. Append the new pass above the old one in that file rather than replacing it; the previous run's rule proposals and reasoning stay.

---

# Phase 1 — Review

## Gather

1. Enumerate the folder: `Glob` for its whole tree, including nested folders, and note the file count per level. `$ARGUMENTS` may narrow it the way a review queue line does: a trailing `root` means the folder's loose files only, none of its subfolders; a trailing range (`a–p`) means the files whose names sort inside it. A subfolder that is a queue line of its own is read for context, never reviewed here.
2. Read every source file in scope, in full. Never sample: a tree too large to read whole is a queue line to split, so stop and say so in the verdict rather than covering it thinly. Data files (`*.json` message bundles, fixtures) are enumerated for their layout and not line-read.
3. Read what the folder is mounted by and what imports it: `Grep` for its import path (package sub-paths and path aliases alike) across the repo, so a recommendation accounts for its consumers. Re-anchor to the repo root after any `cd` — a working directory persists across Bash calls, and a later repo-root `grep` then fails with "No such file or directory" and reads as a clean, finding-free result.
4. Read the docs the folder's subject matter owns, from the repo's docs index. A convention already written down is not a finding.
5. Diff the folder against its siblings — the equivalent tree in the other apps or packages, or the sibling modules beside it. A file that is byte-identical across three apps reads as ordinary length in a single-tree read and as triplication in the diff.
6. Re-run `git status` and `git log --oneline -5` immediately before writing the review, not only at session start. Another session can land a finding and take ownership of its files between the first read and the report, so a review written off the opening snapshot proposes work that is already done.

## Lenses

Run every lens that applies. Each is a separate pass over the same files, not one blended read.

### 1. General

Judge the folder on its own merits, as a senior engineer who has never read this repo's conventions — deliberately before the convention pass, so a design flaw the conventions happen to permit still surfaces.

Look for: a file doing two jobs, a module whose parts have no reason to sit together, a dependency pointing the wrong way, a type declared twice, a helper that belongs one level up (or down), an abstraction with exactly one caller, a name that lies about what the thing does, error and edge-case handling that is missing rather than deliberate, and duplication that is genuinely the same thing rather than two things that currently look alike.

Cite no convention in this pass. If a finding here is later excused by a repo convention, say so in the convention pass rather than deleting it.

### 2. Repo conventions

Judge structure, cohesion and dependency direction against the repo's own rules — CLAUDE.md or AGENTS.md, and the conventions list in the arch-review doc: module shape and naming, folder splits, barrels and package `exports`, which layers may import which, house style. Invoke any repo skill the doc names for placement and composition questions.

Prefer relative imports inside a module — a package sub-path import into your own module hides the real dependency. Before proposing the reverse, check `exports` in the package's `package.json`: only a declared sub-path resolves, so a minority of relative imports in a self-referencing package is often forced rather than sloppy.

### 3. Composition (React repos)

If the `vercel-composition-patterns` skill is installed, invoke it and apply it. Focus on boolean-prop proliferation and escape-hatch props, compound-component opportunities, context vs prop drilling, render-props vs children, and the React 19 API changes. A prop that exists so one caller can differ is a defect, not a feature.

### 4. Next.js (Next.js repos)

If the `nextjs-app-architecture` skill is installed, invoke it and apply it, translating its vocabulary through the repo's own folder names where the arch-review doc maps them. Focus on the client/server boundary and `"use client"` placement, where `<Suspense>` sits and who owns the skeleton, `params.then()`, `"use cache"` + `cacheTag`/`cacheLife`/`updateTag`, server-action vs query placement, static-shell prerendering and CLS.

### 5. Target scale

Apply when the repo states a target scale (in CLAUDE.md, AGENTS.md or the arch-review doc). List everything in the folder whose cost grows with the scaling unit — a loop or connection per unit, a sequential step, per-request work, per-unit infrastructure, an operator step, the blast radius of one fault — and state each one's cost at the target, in time and in money, judging the redesign greenfield. Anything too slow, too fragile or too expensive there is a finding, ranked by how soon the system reaches the count that breaks it. The redesign is in mandate when it stays inside the folder and needs no schema change; otherwise it is deferred with that cost as the one fact. A folder with nothing that grows says so in one line.

### Repo lenses

Run any further lens the arch-review doc adds, the same way.

## Report the review

Markdown to the chat before implementing anything:

- **Verdict** — one paragraph: is this folder structurally sound, and what is the single biggest thing wrong with it.
- **Findings**, grouped by lens, each one: what, the file (`path:line`), why it matters, and the concrete change. Rank by impact within each group.
- **Non-findings** — one line each for anything that looks wrong but is deliberate, so it is not re-raised next time.
- **Leave alone** — what is fine, briefly, so the report isn't read as a rewrite mandate.

Rules for findings:

- Cite a real file and line for every one — no hypotheticals.
- Mark a finding you could not confirm by reading as **unconfirmed**, and name where you looked.
- Say plainly when a finding is a judgment call rather than a convention violation.
- Do not recommend a change whose only justification is symmetry with a pattern the repo has already rejected — read the docs and CLAUDE.md / AGENTS.md before proposing one.
- If the folder is clean under a lens, say so in one line rather than manufacturing findings.
- Trace a cache tag to every writer before reporting a missing invalidation. A shared revalidate helper in another module may already call `updateTag` with a name that matches the tag exactly.
- A predicate called twice is not duplication when it is a type guard. Narrowing a union in both branches is work a hoisted `const` cannot do; check what the false branch is typed as before proposing the hoist.
- A zero-caller export is only dead if nothing claims it. Read the feature's doc and any comment at the definition first — one held for a surface still to be built is not dead. When a decision keeps such an export, write the reason at the definition **and** in the doc, so the next sweep doesn't re-raise it.
- A dev-gated debug string is not user-facing copy. Remove the English word rather than adding a message key in every language.
- When one file or route behaves unlike its siblings, find the mechanism before attributing it to anything. The siblings are the control, and they disprove most first theories.
- Apply every further finding rule the arch-review doc lists.

End with a **Suggested order** — the findings sequenced so each change lands on a tree the previous one left valid. That order is the loop's worklist.

---

# Phase 2 — Decide

Split the findings into **in mandate** and **deferred**, using [Always ask](#always-ask) plus the two lists below and any additions in the arch-review doc. Say which bucket each finding landed in and why, in one line each. Do not ask me — the deferred list is how you ask.

## In mandate — do it, do not ask

- Deleting dead code: zero-caller exports, unreferenced files, unused props. A zero-caller `"use server"` export goes on sight — it is a live RPC endpoint, not dead weight — once nothing claims it.
- Removing a provably-inert call (an `updateTag` naming a tag nothing sets), or adding the missing invalidation for a tag that is already read.
- Collapsing a duplicated composition into one accessor, especially where a doc already names it.
- Deleting a locally re-declared type in favour of the canonical one it shadows.
- Renames and moves **inside** one module, and the import updates they force.
  A file rename also updates every path literal naming it — guard scripts and allowlists often hold repo-relative paths, so grep the old path across the whole repo, not only the source trees, and run every guard the gate lists before committing the rename.
- Convention fixes: file and symbol naming, intra-module import paths, barrel contents, `exports` sub-paths.
- Prop-shape fixes: making an optional-with-default prop required, removing an escape hatch, removing one hop of prop drilling.
- `<Suspense>` placement, skeleton ownership, await ordering and `Promise.all` batching, hydration-unsafe formatting, missing guards on values that can be undefined.
- i18n: replacing raw English with a message key, adding the key when the namespace already exists.
- Extracting a shared helper, including one that lands outside the module under review — place it by the repo's placement rules.
- Updating every consumer of a surface you changed, in the same commit as the change.

## Deferred — implement nothing, report why

- Anything that changes authorization or security semantics: a role becoming a permission, a gate's fail-open/fail-closed direction, what an auth check or row-level policy is trusted for.
- Anything needing a schema change, a migration, a public API or RPC signature change, or a data fix.
- Anything whose runtime surface the dev environment does not reach. Before implementing an observable item, name the route and the account or data that will execute it. A component that renders only from data the system must produce at runtime needs that flow driven once during Review; if it fails, defer every item on that surface before implementing any.
- Anything the review itself marked as possibly a decision rather than a defect.
- Anything needing a secret, a live production system, or an external service to validate.
- Anything whose blast radius you cannot bound by reading — if you cannot enumerate the consumers, it is deferred.
- Anything touching a file another session holds uncommitted, or whose fix would consume an export that only exists in their working tree. Name the file that blocked it. Building on an uncommitted export breaks the moment they revert.

A deferred item is not a failure. Report it with the one fact that makes it my call.

---

# Phase 3 — Implement

Run under `/loop` in dynamic (self-paced) mode so the session continues without me. Before the first item:

- Write the worklist to `TaskCreate` — one task per finding, in the suggested order — and mirror it to a file in the scratchpad. Context may compact mid-run; the task list and that file are what survive.
- Note which apps or packages the folder's consumers live in; the gate's per-workspace typecheck needs the list.
- If any item involves renaming or moving a directory, stop the dev server first. `git mv` on a directory can fail with Permission denied while a dev server watches it, and leaves a half-moved tree behind.
- Expect the worklist to grow by an item or two. Verify surfaces defects every lens missed; add them as tasks rather than carrying them in prose.

Then one item per iteration, smallest coherent change first. Default to one commit per finding, made as soon as its gate passes — not once at the end of the run.

Batch findings into one commit only when **both** hold: they edit the same files, and none is independently revertable. Splitting those produces commits that re-touch the same files and cannot be read or reverted on their own. Everything else stays one-per-commit — the gate still runs per commit, not per batch. Decide the grouping when you write the worklist, and say which findings you batched and why.

## Per item: change → gate → verify → commit

**Gate — every item, no exceptions.**

Run the checks the arch-review doc lists; without one, the lint, typecheck and guard scripts CLAUDE.md / AGENTS.md names. Typecheck each affected workspace, and run every guard script the change could break. Run the full pre-build check set once before the final commit of the session regardless. Rebuild any package a dependent consumes from its built output before typechecking that dependent.

Re-run a failed gate before believing it. `tsc` reading a file mid-save reports syntax errors in files this session never touched, and a stale generated type file (Next.js `.next/types/validator.ts`) names routes that no longer exist — if the missing modules are routes your change never touched, it is the artifact, not you.

**Verify — only when the change has a runtime surface.**

Verify in the running app when a route renders differently, a Suspense boundary or skeleton moved, a client interaction changed, or a cache fix should now show fresh data. In a Next.js repo whose verification doc exists (named by CLAUDE.md, AGENTS.md or the arch-review doc), use the `nextjs:next-dev-loop` skill (from the `nextjs@nextjs` plugin), following that doc; otherwise verify by hand the way the doc describes. Skip it for pure deletions, type changes, renames and import-path moves — a dev server proves nothing there.

Batch it. One dev-server boot, one pass over every affected route, rather than a boot per item. If several items in a row are non-observable, carry them and verify once at the end of that run.

An item that adds or widens a guard is verified by making it fail: perturb one value, watch the guard exit non-zero, revert, watch it pass. A guard added to a tree that already passes is otherwise indistinguishable from one that passes vacuously.

- Use the dev server the user already has running. Starting a second one just collides on the port.
- Before trusting a green verify, find a discriminator that proves the server is serving your code — a visible string one of the items changed does this for free. A refactor that is behaviour-identical by construction leaves no such string: perturb data the change reads, watch two independent surfaces follow it, and revert. A gated route still runs its `generateMetadata`, so perturb a value that metadata emits (a canonical, a title) to prove a moved export is what the gated route serves. A metadata **image** route — `icon.tsx`, `opengraph-image.tsx` — is the cheapest discriminator of all: change the constant behind its `size` export, fetch the route, and read the served PNG's pixel dimensions. It needs no session, no seeded data and no module, and the dimensions are unambiguous in a way a rendered string is not.
- A client's handling of a failed server action is reachable without a real outage: in the one `eval` that clicks, replace `window.fetch` with a function that rejects every `POST`. Drive it before the edit too, so the error boundary it lands on is the baseline.
- A change React Compiler can miscompile — a promise derived in render, `params.then()` replacing a page-local async wrapper — needs a runtime check, not just a typecheck. Drive two variants of the same route and assert they differ; identical output proves nothing.
- A failing automated check proves the check failed. Drive the case by hand before writing "broken" anywhere.
- Settle the page before you read it, or a clean snapshot is a false pass. A route whose body suspends renders its shell first, so a snapshot taken straight after `open` shows the header and the spinner and no error — the throw lands seconds later and replaces the whole tree with the error boundary. Always wait for network idle between `open` and `snapshot`, and apply the same settle to the control route: an unsettled control "passes" too, and the pair then reads as a defect unique to the route under review.
- A runtime error that appears after your change is not yet yours. Restore the pre-change shape in the working tree, reload, and see whether it reproduces — that A/B is cheap and separates your regression from a defect the run merely uncovered. One the run uncovered becomes its own worklist item and its own commit, scoped to the module it actually lives in.
- Apply every further verification note the arch-review doc lists (sign-in, seeding, reaching gated surfaces).

**Commit.**

Format only the files the item edited, with the repo's formatter (the arch-review doc or CLAUDE.md / AGENTS.md names it). If the formatter takes a path prefix, pass the narrowest one that covers your own edits, re-derived per item, never once for the run: another session's edits land mid-loop, so a prefix that was clean on the first item sweeps their working files on the fourth. Read the list it prints; any file on it you did not edit means the prefix was too wide.

Re-derive `git status` before every commit, not just the first — the user commits to the same tree while the loop runs, so the set of files that are not yours changes mid-session. Diff each file you are about to include, not just the status list: another session renaming a symbol inside the module under review leaves changes a formatter will sweep in and `git commit -- <paths>` will ship under your subject.

Take a commit's path list from the files the item edited — the rename's own grep, the paths you wrote — never from `git diff --name-only`, which lists every peer's uncommitted file too. If a peer file does ship under your subject, report it and leave the commit alone: never `reset` to split it, because a peer can commit on top between your `git log` and the reset, and the reset then undoes their commit instead of yours.

Then one commit per finding, explicit paths, single-line subject, conventional prefix, module as the scope:

```bash
git commit -m "fix(identity): drop cache tags nothing sets" -- src/core/identity/person-actions.ts
```

Never `git commit -- <dir>`, never `.`, never `--no-verify`. If a pre-commit hook rejects the commit, fix what it reports; the arch-review doc says how to handle the repo's hook. Commit on the current branch; do not push. Untracked files a change depends on must be `git add`ed by path first, or the commit silently ships a broken tree.

## When an item fails

Three failed gates on one item: revert that item's edits, mark the task not-done with the error text, and move on. Never leave the tree broken to chase the next item, and never disable a guard to get past it.

If an item turns out to depend on a deferred one, skip it and say so — do not implement half of a deferred decision.

If `git commit` is denied, keep implementing. Finish every item under its full gate and report the tree as uncommitted with the per-finding subjects — do not abandon the run, and do not fold the worklist into one workaround commit to get past the refusal.

## Loop control

`ScheduleWakeup` with the same `/kikstart:review-arch` input each iteration. When the worklist is empty, call it with `stop: true` and write the report.

---

# Phase 4 — Report

To the chat, and into the ledger, at the end of the run:

- **Done** — item, the one-line why, and the commit subject.
- **Not done** — item, and which of the two reasons applies: deferred by mandate (say which rule), or attempted and failed (say what failed). Nothing else belongs in this list; an item still closable in development is closed before the report.
- **Tree state** — what is committed, what is uncommitted, whether every gate passes on the final tree.
  Nothing else. A standing rule this session taught is written straight into the repo's arch-review doc (see [Adding a rule](#adding-a-rule)) as part of the run — decided, not proposed. Do not close the report with a list of rules awaiting my approval.

---

# Standing policy

## Always ask

Never decide these in a loop:

- Changes to authorization semantics, gate direction, or what a security boundary is trusted for.
- Schema changes, migrations, public API or RPC signatures, data fixes.
- Pushing, force-pushing, or committing anything to a branch other than the one already checked out.

## Adding a rule

A rule this session taught goes into `docs/ARCH-REVIEW.md`, under the section for the phase it governs, phrased as an instruction, undated; create the doc if the repo has none and add it to the docs index. A repo or environment fact rather than a step of the review — a build trap, a Windows lock, a stale artifact — goes to memory instead, so the doc stays the procedure and not a log.
