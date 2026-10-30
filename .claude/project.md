# Project notes

## Project

Heliotrop, a Claude Code plugin: a project-agnostic orchestrator workflow. Layout:

- `plugins/heliotrop/`: the engine (orchestrator rules, skills, agents, hooks, templates).
- `docs/design/`: one design note per version or larger change.
- `docs/roadmap.md`, `docs/decisions.md`, `docs/sessions/`: see Documents.
- `README.md`, `CHANGELOG.md`: install and usage; changes per version.
- `tests/hooks/`: hook smoke test on synthetic input.

## How we work

Roles:

- User: sets the direction; approves design decisions, releases and commits. Does not write documents.
- Orchestrator: takes decisions with the user, writes briefs, synthesises results. It does not dig: research,
  transcript reading and implementation go to subagents, and it reads their reports, not their sources. It owns the
  wording of every document: objective text, never a paraphrase of the user.
- Subagents: one area each, disjoint files, work from a spec or brief, never commit, return a short report.

Language: conversation Polish; the roadmap Polish; other documents English; code and commits English.

Change cycle:

1. Observation from a real session (a cost, a failure, a rule that misfired).
2. Design note in `docs/design/` for a change larger than one rule or hook.
3. Change, by subagents with disjoint files.
4. A `reviewer` slice for every change to the orchestrator rules, agents, skills or hooks.
5. Version bump in `plugins/heliotrop/.claude-plugin/plugin.json` and a `CHANGELOG.md` entry.
6. Observation in later real sessions.

Commits: Conventional Commits, `<type>(heliotrop): <summary> (<version>)` when the version changes; branch `main`.

## Documents

- Roadmap: `docs/roadmap.md`.
- Decision register: `docs/decisions.md`.
- Handover notes: `docs/sessions/`.
- Design notes: `docs/design/heliotrop-<version>.md`, before a change larger than one rule or hook.
- `CHANGELOG.md`: on every version bump.
- `README.md`: when skills, hooks or agents change.

## Checks

`node tests/hooks/test.js`, then `node --check <hook>` for each file in `plugins/heliotrop/hooks/*.js`; run them when a
hook changed.

on-edit: none

## Always / never

- Ask the user about: direction, design decisions, releases and version bumps, commits, push.
- The engine runs in place: a change takes effect in every project from its next session. Test hooks on synthetic
  input (`tests/hooks/`), never on the live session.
- Moves and renames go last in any change, after the edits inside the moved files.
- Every line of `plugins/heliotrop/core/orchestrator.md` costs context in every session of every project: add a line
  only when it pays for itself.
- One rule, one place: other files refer to it by its heading.
- Nothing project-specific in the engine; a project's paths, commands and documents belong in its own notes.
- A changed behaviour has a version bump and a CHANGELOG entry; no old name or stale reference remains in the files the
  change touched.
- Versioning: patch for a fix that changes no rule; minor for every change to rules, skills, agents, hooks or the notes
  interface that notes written for an earlier version of the same major keep working with (a new key or heading has a
  default; a renamed key stays readable under its old name); major only for a redesign of the engine, decided by the
  user.

## Overrides

context-budget: 100000
main-context: 150k / 200k
