# Heliotrop

A Claude Code marketplace with one plugin, `heliotrop`: a project-agnostic orchestrator workflow. The main session
(the orchestrator) works with the user: it takes decisions, writes briefs and judges results. Subagents do the reading
and execution, so the main context stays small. Everything that differs between projects lives in each repository's
contract, `.claude/project.md`; the engine never contains a project's paths, commands or documents.

The repository folder keeps its old name, `agent-stack`.

## How it works

| Area | Behaviour | Rule |
|---|---|---|
| Roles | User: direction and decisions. Orchestrator: plans, delegates, decides, integrates. Subagents: one slice each, from a brief, with a short return. | `core/orchestrator.md` |
| Session kinds | `build`, `design`, `talk`, `research`, `debug`, `review`, inferred from the request and never asked; the kind sets the session file, the delegation and the end-report sections. | `## Session` |
| Triage | Every message during work is in focus, a side question or a new topic; a new topic gets its cost here and three options: backlog, new session (`handover`), switch focus. | `## Triage` |
| Explaining | Consequences the user likely does not see (cost, risk, conflict with a decision, a better alternative) are stated in 1-3 sentences with a recommendation; contract `guidance: explain \| brief`. | `## Explaining` |
| Main context | Notices at 150k (reading moves to subagents) and 200k (hard point: `handover`), then every further 50k; contract `main-context:`. | `## Budgets` |
| Slice budget | Each subagent is told at 80% of `context-budget:` (default 100k), at 100% and every further 20%. | `## Budgets` |
| Prompt cache | One notice when the main session writes the cache with a 5-minute TTL; the orchestrator offers `"promptCacheTtl": "1h"` in user settings. | `## Budgets` |
| Documents | Session journal `docs/sessions/`, decision register `docs/decisions.md`, backlog `docs/backlog.md`; paths and other documents in the contract's `## Documents`. | `## Documents` |
| Light mode | Without a contract: triage, explaining and the context and cache notices only; no session files, no archive. | `hooks/session-start.js` |

## Layout

```
.claude-plugin/marketplace.json       marketplace "heliotrop"
plugins/heliotrop/
  .claude-plugin/plugin.json
  core/orchestrator.md                orchestrator rules, injected at session start
  agents/                             researcher, implementer, test-writer, reviewer, doc-writer, verifier
  skills/                             see Skills
  hooks/                              SessionStart, PostToolUse and Stop hooks (Node.js)
tests/hooks/test.js                   hook smoke test on synthetic input
docs/                                 design notes, decision register, backlog
```

## Skills

| Skill | Use |
|---|---|
| `/heliotrop:init` | Set Heliotrop up in a repository (audit of existing docs, contract, cache TTL check), or review or migrate a contract. |
| `/heliotrop:plan` | Break a task into stages and slices with ready briefs. |
| `/heliotrop:end` | Close a session: session file, decision register, backlog, contract's end steps. |
| `/heliotrop:handover` | Hand the work over to a fresh session (state, Next briefs, backlog, how to resume). |
| `/heliotrop:guide` | Explain how Heliotrop works in this project, with the contract's values. |
| `heliotrop:write-doc` | Document rules; engine templates in `skills/write-doc/templates/`: `decisions`, `backlog`, `architecture`, `spec`, `adr`, `changelog`, `research-note`. |
| `heliotrop:protocol` | Subagent protocol, preloaded into every Heliotrop agent. |

Templates of the engine itself: `skills/init/contract-template.md` (contract), `skills/end/report-template.md` (session
file).

## Hooks

| Hook | Does |
|---|---|
| SessionStart | Injects the orchestrator rules and the session file template path (contract) or the light core (no contract); resets the main-context notices after a compaction; deletes budget state older than 7 days. |
| PostToolUse, Edit/Write | Runs the contract's `on-edit:` command for the edited file; a failure is reported back. |
| PostToolUse, every tool | Main-context, slice-budget and prompt-cache notices (`Heliotrop main context`, `Heliotrop context budget`, `Heliotrop cache`). |
| Stop | With a contract, copies the session's transcripts to `~/.claude/heliotrop-archive/`. |

## Agents

| Agent | Model | Role |
|---|---|---|
| `heliotrop:researcher` | haiku | search and heavy reading; writes research notes and code maps only |
| `heliotrop:implementer` | sonnet | one scoped change plus its checks |
| `heliotrop:test-writer` | sonnet | tests for a finished slice from its specification; reports defects |
| `heliotrop:reviewer` | opus | review of diffs and designs; writes only its report |
| `heliotrop:doc-writer` | sonnet | documents per the contract's `## Documents` and templates |
| `heliotrop:verifier` | haiku | runs checks or a checklist, reports the outcome |

A contract may override a model in its `## Agents` section.

## Install

Requirements: Claude Code and Node.js on `PATH`.

```
claude plugin marketplace add <path to this repository>
claude plugin install heliotrop@heliotrop --scope user
```

Reinstall from the old `stack` plugin (0.x):

```
claude plugin uninstall stack@agent-stack
claude plugin marketplace remove agent-stack
claude plugin marketplace add <path to this repository>
claude plugin install heliotrop@heliotrop --scope user
```

In a project with a 0.x contract, run `/heliotrop:init`: it offers to migrate the contract.

Recommended user setting in `~/.claude/settings.json`: `"promptCacheTtl": "1h"`. The orchestrator often waits on
subagents longer than 5 minutes, and a plugin cannot set the main session's cache TTL (orchestrator rules,
`### Prompt cache`).

The marketplace is a local directory, so the plugin runs in place: edits take effect at the next session start or
after `/reload-plugins`. Onboard a project with `/heliotrop:init`.

## Changing the engine

The rules for working on this repository are in its own contract, [.claude/project.md](.claude/project.md). Changes
are listed in [CHANGELOG.md](CHANGELOG.md), lasting decisions in [docs/decisions.md](docs/decisions.md), open work in
[docs/backlog.md](docs/backlog.md).
