---
name: review-doc
description: Review one doc against the source it describes, then rewrite it shorter and current, in one commit
argument-hint: "<doc path, e.g. docs/ORDERS.md>"
allowed-tools: Read, Write, Edit, Grep, Glob, Skill, Bash, PowerShell
disable-model-invocation: true
---

Review `$ARGUMENTS`, decide what changes, and rewrite it. You run this to completion on your own — I am not in the loop.

If `$ARGUMENTS` is empty, ask which doc before doing anything else.

Three phases, in order: **Read → Decide → Rewrite**. Do not edit before the whole assessment is written.

The doc's job is to carry the claims a future session needs and nothing else. The rewrite makes it shorter by removing what is stale, duplicated or argued, never by dropping a fact that still holds. A doc that comes out the same length because every line earned its place is a valid result; say so.

Read the repo's CLAUDE.md or AGENTS.md first. Where it sets its own doc style, docs index or formatting command, those win over the defaults below.

---

# Phase 1 — Read

1. Read the doc in full. Note its line count.
2. Read its entry in the repo's docs index (often `docs/README.md`), and the docs it links to and is linked from (`Grep` the doc's file name across the docs folder and CLAUDE.md / AGENTS.md).
3. Verify every source artefact it names — a file, symbol, table, column, script, command, route, env var, message key — against the live tree. `Grep` for the symbol, `Glob` for the file, read `package.json` for a script. Re-anchor to the repo root after any `cd`. A name that no longer resolves is a stale claim; find what it became (`git log -S<name> --oneline -3`) before deciding whether the claim moved or died.
4. Check every status line — "planned", "outstanding", "not yet", "TODO", a phase table, an open-items list — against the code and `git log`. Work that has landed is written as fact; work that has not stays listed, once.
5. Read the sibling docs that cover the same subject. A paragraph both docs carry is duplicated; the one that owns the feature keeps it and the other gets a one-line pointer.
6. Re-run `git status` and `git log --oneline -5 -- <doc>` immediately before writing the assessment. Another session may be editing this doc; if it is uncommitted in the working tree, stop, leave it, and report that as the reason.

## Four lenses

Run all four, each a separate pass.

### 1. Accuracy

Every claim is either verified against the tree, or a decision the doc records that the tree cannot contradict. List each claim that is stale, with what the tree says instead. A claim you cannot verify by reading — a vendor behaviour, a production fact — is left as written and named in the report.

### 2. Concision

Default house rules for docs, unless the repo sets its own:

- One declarative line per assertion. Cut the reasoning that led to it, the "X rather than Y" justification clause, the restatement of what a table beside it already shows.
- One point per bullet. A rule and its naming consequence are one bullet; two rules are two bullets, not a paragraph.
- Name a source artefact bare — `` `catalog-writer.ts` ``, `runProxy` — never as a path link. Table cells sharing one file hoist it to an "All in `X` except where noted" line above the table.
- No `See also` footers, no scope-boundary boilerplate ("this doc does not cover…"), no history narration ("previously this was…", "after the June rewrite…") unless the old name still appears in the tree and a reader needs the mapping.
- Headings carry the subject, not the shape ("Cart", not "Overview of the cart").
- Zero code comments inside fenced examples; the prose beside the block says what it shows.

### 3. Structure

One feature, one doc. A section that re-explains a concept another doc owns becomes a pointer to it. A section that belongs to no other doc and is not this doc's subject is flagged, not moved — moving content between docs is a decision for the report. Intra-doc anchors and external URLs stay. Cross-doc links are for navigation and are kept.

### 4. Index

The doc's line in the docs index states what the doc is now. A doc absent from the index is flagged. Do not edit the index when `git status` shows it modified by another session. If the repo has no index, skip this lens.

## Assessment

Markdown to the chat before editing:

- **Verdict** — one paragraph: is this doc current, and the single biggest thing wrong with it.
- **Stale claims** — each: the claim, the line, what the tree says.
- **Cuts** — each: the passage, why it goes (duplicated where / argued / stale / boilerplate).
- **Kept but flagged** — each: what you could not verify and where you looked, or a section that may belong elsewhere, and the one fact that makes it my call.
- **Index** — the current line and the proposed one, or "unchanged".

---

# Phase 2 — Decide

In mandate, do without asking:

- Rewriting any sentence for concision when its meaning is unchanged.
- Correcting a stale name to the name the tree has now, with `git log -S` as the evidence.
- Deleting a claim about work that has landed and rewriting it as fact.
- Deleting a duplicated section and leaving a one-line pointer to the doc that owns it.
- Deleting boilerplate, `See also` footers, history narration and path links.
- Updating the doc's own line in the docs index, when the index is clean.

Deferred, report only:

- Deleting a claim you could not verify.
- Moving a section into another doc, or merging two docs.
- Changing what the doc says about a decision — a rule, a rejected alternative, a security or tenancy boundary — even when the tree seems to contradict it. The tree may be the thing that is wrong.
- Any edit to a doc another session holds uncommitted.
- Docs the repo marks as machine-written (review queues, generated reports) are never reviewed.

---

# Phase 3 — Rewrite

Write the whole doc back in one pass, preserving its heading order unless a section is deleted. Then run the repo's formatter on that file only (and the index, if you edited its line). Read what it reports; no other file may appear.

Re-derive `git status` and `git diff --numstat -- <paths>` before committing. One commit, explicit paths, single-line subject:

```bash
git commit -m "docs(orders): cut ORDERS.md to current claims" -- docs/ORDERS.md
```

Never `git commit -- <dir>`, never `.`, never `--no-verify`. Commit on the current branch; do not push. If `git commit` is denied, leave the rewrite in the working tree and report it uncommitted.

# Report

To the chat:

- **Result** — lines before → after, stale claims fixed, sections cut, the commit subject.
- **Deferred** — each item, one line, with the rule that deferred it.
- **Tree state** — committed, or uncommitted and why.

Nothing else.
