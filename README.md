# agent-kit

Generic agent workflow skills, one agent and one output style, packaged as a Claude Code plugin marketplace. The skills use the standard `SKILL.md` format, so Codex, Cursor, opencode and the other agents the `skills` CLI supports can install them too.

Every skill is repo-neutral. Where a skill needs project facts (build commands, dev servers, test accounts, doc style), it reads the repo's `CLAUDE.md` or `AGENTS.md` and the docs they point to.

## Plugins

### `kikstart`

| Kind | Name | What it does |
| --- | --- | --- |
| Skill | `ship` | Drafts a brief for an unattended worktree session, confirms it with you, then spawns it as a self-paced loop. |
| Skill | `spawn` | Writes a self-contained prompt that continues the current session in a fresh one. |
| Skill | `wrapup` | End-of-session chain over this session's commits: code review, security review, simplify, verify, commit. |
| Skill | `review-doc` | Checks one doc against the code it describes and rewrites it shorter and current, in one commit. |
| Skill | `review-feature` | Walks a feature's old and new code one step at a time. |
| Skill | `gist` | Three-part summary: today, what changes, what you'd notice. |
| Skill | `greenfield` | Recommends a design as if nothing were built yet. |
| Skill | `system-design` | Designs a system from a one-line prompt and renders it as one HTML architecture page. |
| Skill | `show-me` | Explains the current topic with the smallest useful diagram or sketch. |
| Skill | `unslop` | Removes AI writing tells. |
| Skill | `bro` | Restates the last message in plain language. |
| Agent | `comment-sicko` | Flags comments for deletion and the code they excuse. Report only. |
| Output style | `terse` | Direct answers: no preamble, no recap, no menus. |

`ship`, `wrapup` and `spawn` use Claude Code features (`loop`, `code-review`, `security-review`, `simplify`, session spawning in the desktop app). In other agents they still work as written procedures.

### `kikstart-next`

| Kind | Name | What it does |
| --- | --- | --- |
| Skill | `build` | Runs the monorepo build from the root and triages failures without changing code. |
| Skill | `verify` | Drives a change in a running Next.js dev server with `nextjs:next-dev-loop`, `agent-browser` and `/_next/mcp`. |

`kikstart-next` depends on Vercel's `nextjs@nextjs` plugin, which supplies the `nextjs:next-dev-loop` skill `verify` follows. Add its marketplace before installing (`claude plugin marketplace add vercel/next.js`) so the dependency resolves. `verify` also expects `agent-browser` on `PATH`.

## Install in Claude Code

Add the marketplace and install at user scope, so every repo gets the plugins:

```bash
claude plugin marketplace add Kikstartai/agent-kit
claude plugin install kikstart@kikstart --scope user
claude plugin install kikstart-next@kikstart --scope user
```

Or inside a session:

```text
/plugin marketplace add Kikstartai/agent-kit
/plugin install kikstart@kikstart
```

Plugin skills are namespaced: `/kikstart:ship`, `/kikstart:wrapup`, `/kikstart-next:verify`. Update with `claude plugin marketplace update kikstart`.

## Install with the skills CLI

For Codex, Cursor, opencode and other agents:

```bash
npx skills add Kikstartai/agent-kit
```

Pick skills with `--skill`, for example `npx skills add Kikstartai/agent-kit --skill unslop --skill gist`. List them with `npx skills add Kikstartai/agent-kit --list`. The CLI finds the skills through `skills.sh.json`. The `comment-sicko` agent and the `terse` output style are Claude Code only.

## Layout

```text
.claude-plugin/marketplace.json
plugins/
  kikstart/
    .claude-plugin/plugin.json
    skills/<name>/SKILL.md
    agents/comment-sicko.md
    output-styles/terse.md
  kikstart-next/
    .claude-plugin/plugin.json
    skills/<name>/SKILL.md
skills.sh.json
```

Check the manifests with `claude plugin validate . --strict`.

## Licence

MIT. See [LICENSE](LICENSE).
