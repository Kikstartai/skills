---
name: system-design
description: Design a system from a one-line prompt and publish it as one architecture artifact — decision table, call table, three-tier component diagram, request flow, processing flow, data model, failure modes, scale and cost — then walk the user through it one step at a time. Use when asked to "design X", "system design for X", "how would you build X", an interview-style architecture question, or "take me through the flow". Product-neutral; a repo-specific skill can map the result onto its codebase.
---

# System design

Turn a prompt into one published artifact that answers it, then explain it on request one step at a time. The artifact is rendered from a JSON spec by `scripts/render.cjs`; never hand-draw SVG coordinates.

## 1. Frame

- Read the prompt for the questions it explicitly raises (limits, upload path, resumability, quota, security, duplicates, retries…). Each gets a verdict, never a survey.
- Fix the assumptions the prompt leaves open (cloud, client types, sizes) and state them in the lede. Decide; ask only when two readings change the design materially.
- Name everything that grows with load and give its cost in time and money in the scale section.

## 2. Write the spec

One JSON file in the scratchpad, shaped as in "Spec" below. Sections in this order; each fact appears once, so a later section links to an earlier one instead of restating it.

| # | Section | Holds |
|---|---|---|
| 1 | Decisions | A table of only the decisions that are not the default answer: #, question, decision, because. One line pointing at the sections for the standard ones |
| 2 | Calls | A table of every call the client makes: name + method and path, what the server does, what it returns |
| 3 | Components | `tiers` diagram |
| 4 | Request flow | `steps` diagram driven by the client |
| 5 | Processing flow | `steps` diagram for background work, plus a short list of the queue rules (delivery guarantee, retries, dead-letter, scaling signal) |
| 6 | One section per question | Only what the diagrams do not show: limits tables, SQL, trade-offs. No verdict box repeating the decision table |
| 7 | Data model, other APIs, failure modes, scale and cost | DDL, the non-call endpoints, a failure → effect → recovery table, the cost lines |

## 3. Diagram rules

Each rule is a correction a reader once had to ask for.

**Components (`tiers`)**
- Three horizontal tiers: Presentation, Application, Data. Auth (the identity provider) sits beside the application tier as `side`.
- Data tier is the system of record only. A queue is application tier and says `~transient`.
- Every worker box names its runtime (`~containers · Fargate`); one runtime per worker, never "A or B".
- Arrows start at whoever begins the exchange. Workers pull from queues, so the arrow runs worker → queue.
- Bytes that skip the application tier get `kind: "bytes"`; that one blue line is usually the point of the design.

**Request flow (`steps`)**
- Columns: the client, the handler (`handler: true`), then what the handler calls.
- One step per client request: `call` (one solid arrow) → `box` titled with the URL, e.g. `POST /v1/uploads` → `reply`.
- The box lists, in order, everything done before the reply. A call the handler makes to another service is a line with `to` and a short `note` saying what that service does.
- Idempotency is a line in the box ("idempotency: unique user id + idempotency key"), not a note under it. Say "idempotency", not "repeat check"; "duplicate" means same content, which is deduplication.
- A request that bypasses the handler is a `rows` arrow with `idle` naming the handler column.

**Processing flow (`steps`)**
- Columns: queues, workers (`handler: true`), then storage.
- An event nobody waits on is a `rows` arrow with `kind: "event"`.
- One `box` per worker, titled with the worker and runtime. First line fetches the job from its queue, last line deletes it. Branches use a `{ "kind": "cond", "text": "if clean:" }` line; the other branch is a note.

**All diagrams**
- Labels of two to five words; text is 13–15px and the renderer warns when a label will not fit. Fix every warning.
- The legend is generated from the line kinds used. Solid = request or call, dashed = reply or event, blue = bytes, thin double-headed = a call inside the box and its answer.
- No UML notation for its own sake.

## 4. Render and publish

```bash
node "${CLAUDE_SKILL_DIR}/scripts/render.cjs" <spec.json> <out.html>
```

Check every figure before publishing: screenshot each diagram and read the images.

```bash
node "${CLAUDE_SKILL_DIR}/scripts/shot.cjs" <out.html> <scratchpad>/fig
```

`${CLAUDE_SKILL_DIR}` is the folder holding this SKILL.md; outside Claude Code, use that folder's path. Run `shot.cjs` from a directory where `playwright` resolves (a repo that depends on it, or after `npm i -D playwright`). Fix overlaps through the spec (`w`, `x`, `offset`, `toX`, `labelAt`), never by editing the output. Publish the HTML with the Artifact tool; republish the same path to keep the link.

## 5. Walkthrough mode

When asked to "take me through it" or to explain a flow:

- One step per reply, then stop for "next". Conceptual, a few lines.
- Tie every statement to the diagram: name the arrow or the box line it explains, in the diagram's own words. Never restate a step in different terms.
- When asked for detail, show the real HTTP request and response, or the exact SQL, not a paraphrase.
- A question that exposes a diagram gap (who initiates, how many calls, what a line style means) is fixed in the spec and republished in the same turn, then answered.
- Keep a list of edits the user defers ("remind me at the end") and raise it when the walkthrough ends.

## Spec

```json
{
  "title": "Large-File Sharing on S3",
  "eyebrow": "System design",
  "lede": "One paragraph of HTML: what it is and the core idea.",
  "footer": "optional",
  "sections": [
    { "id": "decisions", "h2": "Decisions that aren't the obvious answer", "html": "<div class=\"scroll\"><table class=\"decisions\">…</table></div>" },
    { "id": "q1", "qn": "1", "h2": "Max file size", "html": "…", "ruleBefore": true },
    { "id": "components", "h2": "Components", "caption": "…", "diagram": {
      "type": "tiers",
      "tiers": [
        { "name": "Presentation", "nodes": [{ "id": "client", "title": "Client", "sub": ["browser · mobile"], "w": 280 }] },
        { "name": "Application", "nodes": [{ "id": "api", "title": "API service", "sub": ["quota · presign"] }] },
        { "name": "Data", "nodes": [{ "id": "s3", "title": "S3 bucket", "parts": [{ "text": "scan = pending", "tone": "warn" }] }] }
      ],
      "side": { "tier": 1, "node": { "id": "auth", "title": "Auth", "sub": ["identity provider"] } },
      "edges": [{ "from": "client", "to": "s3", "label": "PUT parts", "kind": "bytes" }]
    } },
    { "id": "flow", "h2": "Upload flow", "caption": "…", "diagram": {
      "type": "steps",
      "columns": [{ "id": "B", "name": "Browser" }, { "id": "A", "name": "API", "handler": true }, { "id": "S", "name": "S3" }],
      "steps": [{
        "title": "Start the upload",
        "side": { "col": "B", "text": "picks trip.mov" },
        "call": { "from": "B", "label": "start upload" },
        "box": { "title": "POST /v1/uploads", "lines": [{ "text": "reserve quota" }, { "text": "open a multipart upload", "to": "S", "note": "returns an id" }] },
        "reply": { "to": "B", "label": "session id" },
        "notes": ["optional muted line under the step"]
      }]
    } }
  ]
}
```

| Field | Meaning |
|---|---|
| node `sub` | Lines under the title; a leading `~` sets italic |
| node `tone` | `ok`, `warn`, `bad`, `info` tint |
| node `parts` | Coloured state pills inside the node |
| node `w`, `x` | Width and left edge, to leave a channel for a line that crosses a tier |
| edge `kind` | `call` (default), `event`, `bytes` |
| edge `both` | Arrowheads at both ends |
| edge `x` | Force the vertical line's x |
| edge `toX` | Where a routed line lands on the target |
| edge `above` | Same-tier edge that routes over the boxes between |
| edge `offset` | Separate two edges between the same nodes |
| edge `labelAt` | `[x, y]` for a label the router places badly |
| line `kind` | `event` (dashed, one head) or `cond` (italic branch header) |
| row `kind` | `call`, `reply`, `event`, `bytes` |
