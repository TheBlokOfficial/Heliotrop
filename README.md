# Heliotrop

A Claude Code marketplace with one plugin, `heliotrop`: a project-agnostic orchestrator workflow. The main session
(the orchestrator) works with the user: it takes decisions, writes briefs and judges results. Subagents do the reading
and execution, so the main context stays small. Everything that differs between projects lives in each repository's
optional project notes, `.claude/project.md`; the engine never contains a project's paths, commands or documents.

## How it works

| Area | Behaviour | Rule |
|---|---|---|
| Roles | User: direction and decisions. Orchestrator: plans, delegates, decides, integrates. Subagents: one slice each, from a brief, with a short return. | `core/orchestrator.md` |
| Main context | Notices at 150k (reading moves to subagents) and 200k (hard point: `handover`), then every further 50k; notes line `main-context:`. | hard rules |
| Subagent budget | Each subagent is told near `context-budget:` (default 100k), at it and past it; at the budget it returns `Status: partial` with the remaining steps. | hard rules |
| User decisions | Deleting or overwriting data, anything outward-facing, choices that bind architecture, interfaces or direction, and scope changes: the orchestrator asks all open questions at once, each with a recommendation. | hard rules |
| Writing agents | Two writing agents never touch the same files. | hard rules |
| Guidance | Context economy, briefs, slices, focus, communication, session end, documents, prompt cache: a few sentences each, with the reason. | guidance |
| Prompt cache | One notice when the main session writes the cache with a 5-minute TTL; the orchestrator offers `"promptCacheTtl": "1h"` in user settings only with approval. | guidance |
| Project notes | Optional, short, free-form `.claude/project.md`, injected after the core at session start; precedence: the user, the notes, the engine. | `skills/init/notes-template.md` |
| Roadmap | When the project keeps a status document, it is the user's command center: where the project stands, what waits for the user, stages with ticked and open steps. Written in the user's language. | `write-doc` `## Language` |

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
build.bat, build.ps1                  packs the plugin into build/
build/heliotrop-<version>.zip         packed plugin, rebuilt with every release
docs/                                 design notes, decision register, roadmap
```

## Skills

| Skill | Use |
|---|---|
| `/heliotrop:init` | Set Heliotrop up in a repository: survey what exists, ask what the survey cannot show, write short project notes. Also updates existing notes and offers to rewrite a 1.x contract as notes. |
| `/heliotrop:end` | Close a session: small leftovers, the status document and decision register if the project keeps them, the notes' end steps, a short report. |
| `/heliotrop:handover` | Like `end`, plus a handover note and how to resume in a fresh session. |
| `/heliotrop:guide` | A short orientation on how Heliotrop works in this project. |
| `heliotrop:write-doc` | Internal: rules for writing documents; optional templates in `skills/write-doc/templates/`: `decisions`, `roadmap`, `handover-note`, `adr`, `spec`, `changelog`. |
| `heliotrop:protocol` | Internal: subagent protocol, preloaded into every Heliotrop agent. |

The notes template is `skills/init/notes-template.md`.

## Hooks

| Hook | Does |
|---|---|
| SessionStart | Injects the orchestrator rules and the project notes, or one line suggesting `/heliotrop:init` when there are none; resets the main-context notices after a compaction; deletes budget state older than 7 days. |
| PostToolUse, Edit/Write | Runs the notes' `on-edit:` command for the edited file; a failure is reported back. |
| PostToolUse, every tool | Main-context, subagent-budget and prompt-cache notices (`Heliotrop main context`, `Heliotrop context budget`, `Heliotrop cache`). |
| Stop | In a project with notes, copies the session's transcripts to `~/.claude/heliotrop-archive/`. |

## Agents

| Agent | Model | Role |
|---|---|---|
| `heliotrop:researcher` | haiku | search and heavy reading; writes a note only where the brief names a path |
| `heliotrop:implementer` | sonnet | one scoped change plus its checks |
| `heliotrop:test-writer` | sonnet | tests for a finished slice from its specification; reports defects |
| `heliotrop:reviewer` | opus | review of diffs and designs; writes a report only where the brief names a path |
| `heliotrop:doc-writer` | sonnet | documents per the project notes and templates |
| `heliotrop:verifier` | haiku | runs checks or a checklist, reports the outcome |

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

A project with a 1.x contract keeps working: the contract is read as project notes. Run `/heliotrop:init` to rewrite it
as short notes.

Recommended user setting in `~/.claude/settings.json`: `"promptCacheTtl": "1h"`. The orchestrator often waits on
subagents longer than 5 minutes, and a plugin cannot set the main session's cache TTL (orchestrator rules, prompt
cache).

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

The rules for working on this repository are in its own project notes, [.claude/project.md](.claude/project.md). Changes
are listed in [CHANGELOG.md](CHANGELOG.md), lasting decisions in [docs/decisions.md](docs/decisions.md), the state and open
work in [docs/roadmap.md](docs/roadmap.md). The 2.0 design is in [docs/design/heliotrop-2.0.md](docs/design/heliotrop-2.0.md).
