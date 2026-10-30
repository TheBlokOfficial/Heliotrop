# Heliotrop

A Claude Code marketplace with one plugin, `heliotrop`: a project-agnostic orchestrator workflow. The main session
(the orchestrator) works with the user: it takes decisions, writes briefs and judges results. Subagents do the reading
and execution, so the main context stays small. Everything that differs between projects lives in the repository: the
workflow contract `.claude/contract.md` and a marked block in the root `CLAUDE.md`. The engine never contains a
project's paths, commands or documents.

## How it works

| Area | Behaviour | Rule |
|---|---|---|
| Roles | User: direction and decisions. Orchestrator: plans, delegates, decides, integrates. Subagents: one slice each, from a brief, with a short return. | `core/orchestrator.md` |
| Main context | A notice point (reading moves to subagents, plan the landing) and a hard point (`handover`), then reminders. | hard rules |
| Subagent budget | Each subagent is told near the budget, at it and past it; at the budget it returns `Status: partial` with the remaining steps. | hard rules |
| Quality floor | Changes are verified by running something, larger ones reviewed by another agent, changed behaviour tested, no check weakened. Only the user lowers it, recorded in the contract. | hard rules |
| User decisions | Deleting or overwriting data, anything outward-facing, choices that bind architecture, interfaces or direction, taste, and scope changes: the orchestrator asks all open questions at once, each with a recommendation. | hard rules |
| Kinds of work | The mode follows the request: build, conversation or design (the orchestrator thinks with the user), one-off question (direct answer). | guidance |
| Guidance | Context economy, briefs, slices, focus, communication, documents, session start and end: a few sentences each, with the reason. | guidance |
| Contract | `.claude/contract.md` with a fixed skeleton: Workflow, Quality, Checks, Documents, User decisions, Overrides, Notes. Injected after the rules at session start; precedence: the user, the contract, the engine. | `skills/init/contract-template.md` |
| CLAUDE.md block | Facts every agent needs (project and layout, language, conventions, always/never, engine boundary) between `engine:begin` and `engine:end` in the root `CLAUDE.md`. Reaches the main session and custom subagents. | `skills/init/claude-block-template.md` |
| Guard | A project without `.claude/contract.md` gets nothing: no rules, notices, on-edit check or archive. One exception: 2.x project notes (`.claude/project.md`) produce a single line pointing to `/heliotrop:init`. | `hooks/common.js` |
| Roadmap | The user's command center: where the project stands, what waits for the user, stages with ticked and open steps. Written in the user's language. | `write-doc` `## Language` |

The numbers (subagent budget, main-context points, reminder step, warning share, state age) are set only in
`hooks/common.js`. The rules the session receives show the values in effect for the project, including contract
overrides.

## Layout

```
.claude-plugin/marketplace.json       marketplace "heliotrop"
plugins/heliotrop/
  .claude-plugin/plugin.json
  core/orchestrator.md                orchestrator rules, injected at session start
  agents/                             researcher, implementer, test-writer, reviewer, doc-writer, verifier
  skills/                             see Skills
  hooks/                              SessionStart, PostToolUse and Stop hooks (Node.js); common.js holds the numbers
tests/hooks/test.js                   hook smoke test on synthetic input
build.bat, build.ps1                  packs the plugin into build/
build/heliotrop-<version>.zip         packed plugin, rebuilt with every release
docs/                                 design notes, decision register, roadmap, handover notes
```

## Skills

| Skill | Use |
|---|---|
| `/heliotrop:init` | Set the engine up in a repository: survey what exists, ask what the survey cannot show, write the contract `.claude/contract.md` and the CLAUDE.md block, propose the document set (`docs/roadmap.md`, `docs/sessions/`; a decision register stays optional). Also reviews an existing setup and migrates 2.x project notes and 1.x contracts. |
| `/heliotrop:end` | Close a session: small leftovers, the status document and decision register if the project keeps them, the contract's end steps, a short report. |
| `/heliotrop:handover` | Like `end`, plus a handover note and how to resume in a fresh session. |
| `heliotrop:write-doc` | Internal: rules for writing documents; optional templates in `skills/write-doc/templates/`: `decisions`, `roadmap`, `handover-note`, `adr`, `spec`, `changelog`. |
| `heliotrop:protocol` | Internal: subagent protocol, preloaded into every engine agent. |

`end` and `handover` tell a project without a contract that the engine is not set up there; `init` always works.

## Hooks

| Hook | Does |
|---|---|
| SessionStart | In a project with a contract: injects the orchestrator rules (numbers filled in) and the contract; resets the main-context notices after a compaction; deletes budget state past its age limit. Without a contract: silent, or the single legacy line for 2.x notes. |
| PostToolUse, Edit/Write | Runs the contract's `on-edit:` command for the edited file; a failure is reported back (`On-edit check failed for <file>`). |
| PostToolUse, every tool | Main-context and subagent-budget notices, prefixed `Main context:` and `Context budget:`. |
| Stop | In a project with a contract, copies the session's transcripts to `~/.claude/heliotrop-archive/`. |

## Agents

| Agent | Model | Role |
|---|---|---|
| `heliotrop:researcher` | haiku | search and heavy reading; writes a note only where the brief names a path |
| `heliotrop:implementer` | sonnet | one scoped change plus its checks |
| `heliotrop:test-writer` | sonnet | tests for a finished slice from its specification; reports defects |
| `heliotrop:reviewer` | opus | review of diffs and designs; writes a report only where the brief names a path |
| `heliotrop:doc-writer` | sonnet | documents per the contract and templates |
| `heliotrop:verifier` | haiku | runs checks or a checklist, reports the outcome |

Subagents never commit.

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

Upgrading a project from 1.x or 2.x: the engine stays inactive there until `/heliotrop:init` migrates `.claude/project.md`
into `.claude/contract.md` and the CLAUDE.md block. The old file is removed only after approval.

Tip: set `"promptCacheTtl": "1h"` in `~/.claude/settings.json`. The orchestrator often waits on subagents longer than
5 minutes, and a plugin cannot set the main session's cache TTL.

The marketplace is a local directory, so the plugin runs in place: edits take effect at the next session start or
after `/reload-plugins`. Onboard a project with `/heliotrop:init`.

## Build

`build/heliotrop-<version>.zip` holds the plugin with `.claude-plugin/plugin.json` at the zip root, for installs that
take a plugin archive instead of a marketplace. Rebuild it after a change to `plugins/heliotrop/` and commit it with the
release: run `build.bat` (or double-click it), a wrapper for `build.ps1`.

The version comes from `plugin.json`; older zips in `build/` are removed. The script packs git-tracked and untracked,
non-ignored files from the working tree, with forward-slash paths and a fixed timestamp, so unchanged content gives an
identical zip.

## Changing the engine

This repository is the engine's source; its own working rules are in [.claude/contract.md](.claude/contract.md) and
[CLAUDE.md](CLAUDE.md). Changes are listed in [CHANGELOG.md](CHANGELOG.md), lasting decisions in
[docs/decisions.md](docs/decisions.md), the state and open work in [docs/roadmap.md](docs/roadmap.md). The 2.0 design is
in [docs/design/heliotrop-2.0.md](docs/design/heliotrop-2.0.md); 3.0 has no design note, its decisions are in the
register.
