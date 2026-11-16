---
name: greenfield
description: Recommend the design as if the project were greenfield — churn is not a constraint
argument-hint: "<what to redesign, e.g. the storefront module, the settings layer, this file>"
disable-model-invocation: true
---

Recommend how `$ARGUMENTS` should be designed if this project were greenfield.

If `$ARGUMENTS` is empty, take the subject of the current discussion.

Read what exists first — you are recommending a target, not guessing at one. Then answer as if nothing is built yet.

- **Churn is not a constraint.** Rewrites, renames, deleted modules, moved folders, changed public surfaces, a different data shape — all in scope. Never weigh "how much would this touch", "this is a big refactor", or "we could do it incrementally" into the recommendation.
- **Existing structure carries no authority.** A shape that only exists because it was built that way is not an argument. Sunk cost, familiarity and "the rest of the repo does it" do not survive this question.
- **Real constraints still bind**: the framework, the runtime, the tenancy or deployment model, the vendors, the data actually stored, and anything in the repo's CLAUDE.md or AGENTS.md that is a decision rather than an accident. Say which of those you treated as fixed if it is not obvious.
- **Size it for the target scale.** If the repo's CLAUDE.md or AGENTS.md names one, use it; otherwise state the scale you assumed. Name what in the target grows with load and its cost there, in time and in money; a target that does not hold at that scale is not the recommendation.
- **Take a position.** One recommendation, not a menu. Where a genuine fork exists, name both in one line each and pick one.

Answer in the format of the `gist` skill and nothing else: **Today**, **What
changes** (the greenfield target), **What you'd notice**, under its rules. No
migration plan, no sequencing, no effort estimate, no file-by-file inventory, no
closing offer to implement it.
