# Project contract

<!-- Contract of the Heliotrop engine repository itself, built from plugins/heliotrop/skills/init/contract-template.md.
The engine's own rules are in plugins/heliotrop/; this file holds the rules for working on them. -->

## Project

Heliotrop, a Claude Code plugin: a project-agnostic orchestrator workflow. Layout:

- `plugins/heliotrop/`: the engine (orchestrator rules, skills, agents, hooks, templates).
- `docs/design/`: one design note per version or larger change.
- `docs/decisions.md`, `docs/roadmap.md`, `docs/sessions/`: see `## Documents`.
- `README.md`, `CHANGELOG.md`: install and usage; changes per version.
- `tests/hooks/`: hook smoke test on synthetic input.

## Roles

- User: sets the direction; approves design decisions, releases and commits. Does not write documents.
- Orchestrator: takes decisions with the user, writes briefs, synthesises results. It does not dig: research,
  transcript reading and implementation go to subagents, and it reads their reports, not their sources. It owns the
  wording of every document: objective text, never a paraphrase of the user.
- Subagents: one area each, disjoint files, work from a spec or brief, never commit, return a short report (changed,
  checked, interpreted).

## Language

- conversation: Polish
- documents: English
- user documents: Polish
- code, commits: English
- guidance: brief

## Sessions

- start reading: none
- end steps: none

## Documents

- sessions: docs/sessions/, committed  <!-- only for sessions that took decisions -->
- decisions: docs/decisions.md, committed
- roadmap: docs/roadmap.md, committed
- research: docs/research/, temporary
- reviews: docs/reviews/, temporary
- code-maps: docs/code-maps/, temporary
- optional: spec: docs/design/heliotrop-<version>.md, template: engine, when: before a change larger than one rule or
  hook
- optional: changelog: CHANGELOG.md, template: engine, when: every version bump
- existing:
  - README.md — what Heliotrop is, install and reinstall, skills, hooks, agents — when a change alters any of them —
    orchestrator
  - tests/hooks/test.js — hook smoke test — when a hook changes — implementer

## Pipeline

Change cycle:

1. Observation from a real session (a cost, a failure, a rule that misfired).
2. Design note in `docs/design/` for a change larger than one rule or hook.
3. Change, by subagents with disjoint files.
4. Version bump in `plugins/heliotrop/.claude-plugin/plugin.json` and a `CHANGELOG.md` entry.
5. Observation in later real sessions.

Gates: a `reviewer` slice for every change to the orchestrator rules, agents, skills or hooks; the hook smoke test for
every hook change. Documents and discussions have no mandatory pipeline.

## Verification

check: `node tests/hooks/test.js`, then `node --check <hook>` for each file in `plugins/heliotrop/hooks/*.js`
on-edit: none
checklist: none

## Definition of done

- `check` passes when a hook changed.
- Changed behaviour has a version bump and a CHANGELOG entry.
- No old name or stale reference remains in the files the change touched.

## Rules

- The engine runs in place: a change takes effect in every project from its next session. Test hooks on synthetic
  input (`tests/hooks/`), never on the live session.
- Moves and renames go last in any change, after the edits inside the moved files.
- Every line of `plugins/heliotrop/core/orchestrator.md` costs context in every session of every project: add a line
  only when it pays for itself.
- One rule, one place: other files refer to it by its heading.
- Nothing project-specific in the engine; a project's paths, commands and documents belong in its own contract.
- Versioning: patch for a fix that changes no rule; minor for every change to rules, skills, agents, hooks or the
  contract interface that a contract written for an earlier version of the same major keeps working with (a new key or
  heading has a default; a renamed key stays readable under its old name); major only for a redesign of the engine,
  decided by the user.

## User decisions

- Direction, design decisions, releases and version bumps, commits, push.

## Budgets

context-budget: 100000  <!-- integer form: the 0.x hook still installed until reinstall reads "100k" as 0 -->
main-context: 150k / 200k

## Agents

none

## Conventions

- commits: Conventional Commits, `<type>(heliotrop): <summary> (<version>)` when the version changes
- branches: main
