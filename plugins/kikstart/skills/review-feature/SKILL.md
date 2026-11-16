---
name: review-feature
description: Step-by-step review of a feature — old vs new code, one step at a time, linked
argument-hint: "[feature]"
disable-model-invocation: true
---

Review and explain the feature: $ARGUMENTS

Rules:
- Concise and high-level. No background, no history lecture.
- One step at a time. Present one step, then stop and wait for me to say "next".
- For each step, show the old and new code at a conceptual level: a short description plus at most a few lines of key code, not whole files.
- Link the new code as `path:line` so I can find it in the files.

Process:
1. Find the change set for the feature: `git log` / `git diff` over the files that implement it. If the feature is ambiguous or matches nothing, ask one question.
2. List the steps in order (3–8 max), one line each, so I can see the route.
3. Present Step 1 only, in this shape:

### Step N: <title>
- **Old:** <conceptual description> — `path:line`
- **New:** <conceptual description> — `path:line`

Then ask: "Next?"
