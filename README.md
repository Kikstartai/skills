# skills

Generic agent workflow skills and one agent, packaged as a Claude Code plugin marketplace. The skills use the standard `SKILL.md` format, so Codex, Cursor, opencode and the other agents the `skills` CLI supports can install them too.

Every skill is repo-neutral. Where a skill needs project facts (build commands, dev servers, test accounts, doc style), it reads the repo's `CLAUDE.md` or `AGENTS.md` and the docs they point to. `review-arch` also reads an optional `docs/ARCH-REVIEW.md` for the repo's conventions, checks, verification notes and ledger location.

## Plugin

### `kikstart`

| Kind | Name | What it does |
| --- | --- | --- |
| Skill | `ship` | Drafts a brief for an unattended worktree session, confirms it with you, then spawns it as a self-paced loop. Manual only. |
| Skill | `spawn` | Writes a self-contained prompt that continues the current session in a fresh one. |
| Skill | `wrapup` | End-of-session chain over this session's commits: code review, security review, simplify, verify, commit. |
| Skill | `build` | Runs the monorepo build from the root and triages failures without changing code. Manual only. |
| Skill | `review-arch` | Reviews a folder's architecture against the repo's own rules, then implements the findings in a self-paced loop, one commit each, keeping a ledger. Manual only. |
| Skill | `review-doc` | Checks one doc against the code it describes and rewrites it shorter and current, in one commit. |
| Skill | `review-feature` | Walks a feature's old and new code one step at a time. |
| Skill | `gist` | Three-part summary: today, what changes, what you'd notice. |
| Skill | `greenfield` | Recommends a design as if nothing were built yet. |
| Skill | `system-design` | Designs a system from a one-line prompt and renders it as one HTML architecture page. |
| Agent | `comment-sicko` | Flags comments for deletion and the code they excuse. Report only. |

`wrapup` and `spawn` use Claude Code features (`loop`, `code-review`, `security-review`, `simplify`). In other agents they still work as written procedures. `ship` spawns through the Claude desktop app's sessions; without them it stops and offers to print the brief for you to paste.

### Next.js repos

For Next.js repos, also install Vercel's `nextjs@nextjs` plugin. `wrapup` and `review-arch` verify runtime changes with its `nextjs:next-dev-loop` skill when it is installed:

```bash
claude plugin marketplace add vercel/next.js
claude plugin install nextjs@nextjs
```

## Install in Claude Code

Add the marketplace and install at user scope, so every repo gets the plugin:

```bash
claude plugin marketplace add Kikstartai/skills
claude plugin install kikstart@kikstart --scope user
```

Or inside a session:

```text
/plugin marketplace add Kikstartai/skills
/plugin install kikstart@kikstart
```

Plugin skills are namespaced: `/kikstart:ship`, `/kikstart:wrapup`, `/kikstart:build`. Update with `claude plugin marketplace update kikstart`.

## Install with the skills CLI

For Codex, Cursor, opencode and other agents:

```bash
npx skills add Kikstartai/skills
```

Pick skills with `--skill`, for example `npx skills add Kikstartai/skills --skill gist --skill greenfield`. List them with `npx skills add Kikstartai/skills --list`. The CLI finds the skills through `skills.sh.json`. The `comment-sicko` agent is Claude Code only.

## Layout

```text
.claude-plugin/marketplace.json
plugins/
  kikstart/
    .claude-plugin/plugin.json
    skills/<name>/SKILL.md
    agents/comment-sicko.md
skills.sh.json
```

Check the manifests with `claude plugin validate . --strict`.

## Licence

MIT. See [LICENSE](LICENSE).
