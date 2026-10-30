# Heliotrop 1.1: roadmap and user-document language

Status: approved 2026-10-30. Version 1.1.0 (minor: a 1.0 contract keeps working unchanged).

## Problem

1. The user of a project works from one status document, but the engine's status document, the backlog, is built for
   the next session, not for the user: finished items are deleted, so it never shows the whole plan, what is done and
   what is left.
2. One contract value, `documents:`, sets the language of every document. A document the user works from should be in
   the user's language; technical documents (session files, decisions, ADRs, architecture, specs, research notes) stay
   in the project's document language, often English.
3. The engine repository's versioning rule made every new contract key a major version, which turns small additions
   into 2.0.

## 1. Roadmap replaces the backlog

The roadmap is the user's command center: the one document the user opens to see where the project stands, what is
done, what is next and what waits for them. It is also the only status document of the project; other documents link
to it instead of copying status.

- Contract key `roadmap:` in `## Documents`, default `docs/roadmap.md`, committed. It replaces `backlog:`.
- Compatibility: a 1.0 contract's `backlog:` line is read as `roadmap:` (same path), and a file still in backlog form
  is turned into the roadmap form the first time `end` or `handover` updates it. `init` migration renames the key.
- An existing roadmap or status list found by `init` becomes `roadmap:` and keeps its own format.
- Engine template `skills/write-doc/templates/roadmap.md` replaces `backlog.md`. Sections, in this order:
  1. Where we are: 2-4 sentences on the current state, the work in progress and what comes next. Rewritten, not
     appended, by every `end` and `handover`.
  2. Waiting for you: decisions and actions only the user can take, one line each with a link; removed once done.
  3. Stages: one `###` heading per stage with its goal in one sentence; steps as `- [ ]` / `- [x]` lines. A finished
     step is ticked with its date and a link to its session file, never deleted. A finished stage collapses to its
     heading line (`### ✓ <stage>, done <date>` with a link) so the document stays short.
  4. Later: ideas and parked topics (triage parking goes here).
  5. Known problems: problem and its effect, one line each.
- Writing rules for the roadmap: written for a reader who does not read the code or the other documents: plain words,
  no internal identifiers unless the user uses them, one line per item, details behind a link.
- Who writes it: `plan` adds the stages and steps of a plan that spans more than the current session; `end` and
  `handover` tick finished steps, add open items and Next sessions topics as steps, update Waiting for you and rewrite
  Where we are; triage parks new topics under Later.
- The start of a session reads the roadmap in place of the backlog.
- Light mode (no contract) is unchanged: no files, so no roadmap.

## 2. Language of user documents

- Contract `## Language` gets a new line `- user documents: <language>`: the language of documents written for the
  user to work from. In 1.1 that is the roadmap. Missing line: the conversation language.
- `documents:` keeps its meaning for every other document.
- `init` sets `user documents:` without asking, to the conversation language, like the other language values.
- The rule lives in one place, the `write-doc` skill under a `## Language` heading; every other file (orchestrator,
  `end`, `handover`, `doc-writer`, session file template, contract template) refers to that heading instead of
  restating it. The orchestrator's `Language` line keeps only the conversation language.
- Headings of an engine template are translated into the document's language.

## 3. Versioning of the engine

Engine repository contract, `## Rules`: patch for a fix that changes no rule; minor for every change to rules, skills,
agents, hooks or the contract interface that a contract written for an earlier version of the same major keeps working
with (a new key or heading has a default; a renamed key stays readable under its old name); major only for a redesign
of the engine, decided by the user.

## 4. Files

| Slice | Files |
|---|---|
| A: documents core | `skills/write-doc/templates/roadmap.md` (new), `skills/write-doc/templates/backlog.md` (delete), `skills/write-doc/SKILL.md`, `agents/doc-writer.md`, `core/orchestrator.md`, `skills/end/report-template.md` |
| B: skills | `skills/init/SKILL.md`, `skills/init/contract-template.md`, `skills/end/SKILL.md`, `skills/handover/SKILL.md`, `skills/guide/SKILL.md`, `skills/plan/SKILL.md` |
| C: repository | `README.md`, `CHANGELOG.md`, `plugin.json` (1.1.0), `.claude/project.md`, `docs/roadmap.md` (from `docs/backlog.md`), `docs/decisions.md`, build zip |

Paths in A and B are under `plugins/heliotrop/`. Hooks are unchanged.
