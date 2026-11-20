---
name: gist
description: The point of it, in three short parts — what's wrong today, what changes, what I'd notice
argument-hint: "<optional subject — defaults to what we're discussing>"
---

Give me the gist of `$ARGUMENTS`.

If `$ARGUMENTS` is empty, take the current proposal or the thing we are discussing.

Three short parts, each its own paragraph or a few bullets, led by a bold label:

**Today** — what is true now and why it bites. One or two sentences.

**What changes** — the move itself. One or two sentences, or up to three bullets
when the change genuinely has separate pieces.

**What you'd notice** — the visible difference afterwards. Bullets, one fact
each, at most three.

Nothing else: no heading above the parts, no summary line after them.

- Plain terms, the way you would say it out loud. No file paths, no symbol names,
  no step numbers, no code spans.
- A bullet is one short clause. If a bullet needs a second sentence, it is two
  bullets or it is too much detail.
- Mechanism only where it *is* the point. How it is wired, where the code goes,
  what gets deleted — leave it out unless the answer is meaningless without it.
- No preamble, no recap of my question, no caveats, no closing offer.

If the honest answer is "this is plumbing, nobody notices", say that in a sentence
and stop.
