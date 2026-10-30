# Project contract

## Workflow
<!-- How review, tests, verification and commits run here. -->
Change cycle:

1. Observation from a real session (a cost, a failure, a rule that misfired).
2. A design note in `docs/design/` only when a change cannot be briefed without one.
3. Change, by subagents with disjoint files.
4. A `reviewer` slice for every change to the orchestrator rules, agents, skills or hooks, whatever its size.
5. Version bump in `plugins/heliotrop/.claude-plugin/plugin.json` and a `CHANGELOG.md` entry.
6. Observation in later real sessions.

## Checks
<!-- Check commands; optional line "on-edit: <command> {file}" runs after each file edit, written at the start of a line. -->
`node tests/hooks/test.js`, then `node --check <hook>` for each file in `plugins/heliotrop/hooks/*.js`. Run them when a
hook changed.

## Documents
<!-- Paths of the documents the engine works through: status, decisions, handover notes, roadmap, others. -->
- Roadmap (status): `docs/roadmap.md`
- Decision register: `docs/decisions.md`
- Handover notes: `docs/sessions/`
- Design notes: `docs/design/heliotrop-<version>.md`
- `CHANGELOG.md`: changes per version.
- `README.md`: install and usage; update it when skills, hooks or agents change.

## User decisions
<!-- What the user decides beyond the engine's list. -->
Direction, design decisions, releases and version bumps, commits, push.

## Overrides
<!-- Only values that differ from the defaults, each at the start of a line: "context-budget: <tokens>", "main-context: <notice> / <hard>". -->

## Notes
<!-- Free; anything else the engine should know. -->
- The user does not write documents.
- The engine runs in place: a change takes effect in every project from its next session. Test hooks on synthetic
  input (`tests/hooks/`), never on the live session.
- Every line of `plugins/heliotrop/core/orchestrator.md` costs context in every session of every project: add a line
  only when it pays for itself.
- One rule, one place: other files refer to it by its heading.
- Nothing project-specific in the engine; a project's paths, commands and documents belong in its own contract and
  CLAUDE.md.
- Versioning: patch for a fix that changes no rule; minor for every change to rules, skills, agents, hooks or the
  contract interface that contracts written for an earlier version of the same major keep working with (a new key or
  heading has a default; a renamed key stays readable under its old name); major only for a redesign of the engine,
  decided by the user.
