---
name: verify
description: Verify changes against a running Next.js dev server with the nextjs:next-dev-loop skill, agent-browser and the dev server's /_next/mcp endpoint
argument-hint: "[what to verify, e.g. web /orders filter chips]"
allowed-tools: Skill, Read, Grep, Glob, Bash, PowerShell
disable-model-invocation: true
---

Verify your changes against a running dev server, using the `nextjs:next-dev-loop` skill and `agent-browser` as you go. Do not report a change as working until you have driven it in the browser and read the server's own view of it.

Target: `$ARGUMENTS`. If empty, verify whatever you just edited — infer the app and route from the touched files, and say which you picked before driving anything.

Read the repo's CLAUDE.md or AGENTS.md first, and the verification doc it points to if any (often `docs/VERIFY.md`). That doc is the contract: it names the dev-server commands and ports, the hosts, how to sign in, and the test accounts or tenants. Where it differs from this skill, it wins.

## Run it

1. Invoke the `nextjs:next-dev-loop` skill (from the `nextjs@nextjs` plugin) and follow its preflight and loop. It is the procedure; everything below is what it can't know. If it is not installed, say so and suggest `claude plugin marketplace add vercel/next.js` then `claude plugin install nextjs@nextjs`.
2. `agent-browser` should be on `PATH`. If it is not, say so rather than installing it unasked. Run `agent-browser skills get core` once before driving it.
3. Derive the session id once per checkout with `agent-browser session id --scope worktree --prefix next-dev-loop`, and pass `--session <id> --restore` on every command, including `close`. Spawn the daemon first with no URL and output redirected — `agent-browser --session <id> --restore --headed open > file 2>&1` — because on Windows the spawning command never returns to a shell capturing its output.
4. Pair it with `/_next/mcp`: `get_compilation_issues`, `get_errors`, `get_routes`, `get_logs`. Replies are SSE; read the JSON off the `data:` line. On a port other than 3000, set `NEXT_MCP_URL=http://localhost:<port>/_next/mcp`.
5. Verify _as you go_, not once at the end: after each edit that changes runtime behaviour, run the four checks (compiles / no errors / behaves / React-level) before moving to the next edit.

## Dev servers

Start the app the change lives in, from the repo root, as a background command, and leave it running for the rest of the session. Use a server already running on the port rather than starting a second one. Take the command and URL from the repo's docs or `package.json` scripts; a multi-app monorepo usually has one script per app, and the root `dev` often starts every app at once.

Never the in-app Browser pane (`mcp__Claude_Browser__*`) on an authenticated surface: it is a separate profile with no session cookies, so signed-in routes redirect it to sign-in. Use it for unauthenticated pages only, and only when agent-browser is unavailable.

## Signing in

Restore the saved session first. If it reports no state, use the repo's documented non-interactive dev sign-in if it has one; otherwise open the sign-in page `--headed` and ask me to sign in in that window, then close the session so the state is saved. Never type credentials and never create an account.

## False alarms

Before calling anything broken, rule these out:

- **Cold-start 404 / blank first paint.** The first request after `next dev` boots compiles the route; re-request before concluding anything.
- **A page that looks unhydrated.** Under PPR the static shell commits first. Check for a real error via `/_next/mcp` `get_errors` rather than inferring from a screenshot.
- **Signed out.** A redirect to sign-in means the restored session expired, not a routing bug. Sign in again in the same session.
- **A gate, not a fault.** An "unavailable" or "access denied" screen the app renders on purpose is a state, not a crash. Read the copy before calling it a bug.
- **Stale data.** With `"use cache"` and tags, a mutation whose effect doesn't show usually lacks an `updateTag` / `revalidateTag`; check that before suspecting the write. A direct DB write outside the app needs a dev-server restart.
- **The two views disagree.** If `agent-browser` says broken and `/_next/mcp` says clean, suspect a stale browser session first — reopen with the same `--session`/`--restore`. An `open` failing with `os error 10060` is a stale daemon: `agent-browser session kill <id>`, then `agent-browser close --all`, then respawn.

## Report

State what you drove — app, URL, the interaction — and what each view said. A change that only type-checks is not verified. A check that is blocked but closable in development (test data to create, a server to start, a sign-in to redo) is closed before reporting; only what needs my hand is reported as left, with the specific failure.
