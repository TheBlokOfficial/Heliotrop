# Heliotrop 2.0: a short, organic engine

Status: approved 2026-10-30. Version 2.0.0 (major: a redesign of the engine; 1.x contracts keep working as project notes).

## Problem

The 1.x engine is about 80 KB of Markdown, and 5-6k tokens of rules are loaded into every session. It reads as
procedure, not as guidance. Causes:

1. The `write-doc` rule that every rule needs numeric thresholds turned every behaviour into a number.
2. Each observation added a rule and none was removed (1.0 to 1.2 in one day).
3. The engine imposes a documentation model: `init` maps every document into the contract, session files, the
   decision register, the roadmap and the research, reviews and code-maps directories are mandatory, and CLAUDE.md is
   reduced. The contract is a config file with `key:` lines that hooks parse.
4. The same content is stated several times: the session-kind table (orchestrator, `end`), the prompt cache (four
   places), the budget numbers (four places).

## What stays

The orchestrator and its subagents. The orchestrator owns the outcome: it plans, delegates reading and execution,
judges the results, decides and keeps the user informed. Subagents keep the main context small. The six agents
(researcher, implementer, test-writer, reviewer, doc-writer, verifier), the budget hooks, `post-edit` and
`archive-transcript` stay.

## Hard rules

Few, unambiguous, enforced or signalled by hooks. Everything else is guidance.

- Main context: at 150k, hand the remaining reading to subagents and write down open decisions. At 200k, dispatch no
  new agents, collect the running ones, run `handover`, tell the user what is done, what is left and how to continue,
  and ask what next. A reminder every further 50k.
- Subagent budget (default 100k): near it, plan to finish or return partial. At it, wrap up and return
  `Status: partial` with the remaining steps. Far past it, stop.
- The user decides, and the orchestrator asks all open questions at once, each with a recommendation: deleting or
  overwriting data or history; anything outward-facing (push, publish, pull request, messages); choices that bind
  architecture, public interfaces or direction, and choices of taste; scope changes; whatever the project notes add.
  Everything else: decide and continue.
- Two writing agents never touch the same files.

## Guidance

A few sentences each, with the reason. Numbers only where they matter.

- Context economy: everything loaded is re-sent on every turn, so delegate heavy reading and execution. Do small
  things on material already in context yourself; starting a subagent costs about 10-15k tokens.
- Briefs: the goal and why, the files you know, constraints and decisions made, when it is done, a short return. No
  fixed field format and no size arithmetic.
- Slices: one coherent item per agent; independent items in parallel; review and fixes stay separate; split what would
  grow too large.
- Focus: switching topics mid-work is inefficient, because the current context is paid on every turn. Notice it, say so
  briefly and recommend parking the topic (the status document or the end report) or a new session. Small unrelated
  questions wait for the end. The user decides; comply.
- Communication: a short statement at the start of what will be done; progress messages only when something changes;
  results in the message text. Interpret the user and write requirements in your own words. Conversation language from
  the project notes, else the user's.
- Session end: a short report (done, decisions taken without the user, open, suggested next); update the project's
  status document if it keeps one.
- Documents: work with the project's existing documents in their own format. Suggest a new document only where a real
  gap shows (status lost between sessions, decisions that keep being re-discussed). Never restructure without approval.
- Prompt cache: one sentence. The hook gives a one-time notice when the main session caches with 5m; the orchestrator
  offers `"promptCacheTtl": "1h"` in the user's settings only with approval.

## Removed concepts

| Removed | Reason |
|---|---|
| Session kinds (6-kind table, `kind:` lines) | Inferred behaviour; the table duplicated `end` and the orchestrator. |
| Message-by-message triage classification | Replaced by the focus guidance. |
| Deviation log, Deferred ceremony | Guidance may be adapted; no log needed. |
| Slice-size arithmetic, `Size` field | The budget hook enforces the ceiling. |
| Code maps, review markers as engine concepts | A project may keep them in its notes. |
| `plan` skill | Folds into the core guidance (slices, briefs). |
| Light mode | The core is short enough to load always. |
| Session file created at session start | Only `handover` writes a note. |
| 0.x (`stack`) migration path in `init` | No longer supported. |
| Cache check step in `init` | The hook covers it. |

## Project notes

`.claude/project.md` replaces the contract. Optional, free-form, short. Suggested headings only: what the project is;
how we work (tests, review, commits and push, language); where documents live; checks and commands; what Claude should
always or never do.

- Without notes the hooks run on defaults.
- Hooks still read the optional lines `context-budget:`, `main-context:` and `on-edit:` anywhere in the file, so a 1.x
  contract keeps working.
- Precedence: the user, then the project notes, then the engine.

## Init

Keeps the name `init`; it sets up, orients and updates.

1. One `heliotrop:researcher` slice surveys what exists: what the project is, commands, CI, conventions, agent
   configuration, a one-line-per-document inventory, signs of a 1.x contract.
2. A short conversation asks only what the survey cannot show, each question with a recommendation; "defaults OK" is
   accepted. Topics: tests, review, commits and push, language, how status is tracked, anything Claude should always
   or never do.
3. Git check stays: `git init` or a GitHub repository only on a yes.
4. Writes short project notes and one pointer line in CLAUDE.md. CLAUDE.md is not reduced without approval.
5. Suggests documents only for real gaps; the `doc-writer` creates them after approval.
6. A 1.x contract: offers once to rewrite it as notes, keeping its content (pipeline, rules, user decisions,
   conventions). Existing documents stay as they are.
7. Ends with a few lines of explanation.

## Skills

| Skill | After 2.0 | Target |
|---|---|---|
| `init` | As above. `contract-template.md` is replaced by a short notes template. | up to ~45 lines |
| `end` | Work off small leftover items; update the status document if any; add lasting decisions to the decision register if the project keeps one; run the project's end steps (commit only if the notes say so); give the report. | up to ~30 |
| `handover` | Like `end`, plus a handover note. | up to ~30 |
| `guide` | A short orientation. | ~15 |
| `write-doc` | Shrunk, see below. | up to ~30 |
| `protocol` | Shrunk, see below. | up to ~20 |
| `plan` | Removed. | none |

Handover note: default `docs/sessions/YYYY-MM-DD-<topic>.md`, or where the notes say. Contents: done; state (branch,
uncommitted changes, last check); what is left; the first steps of the next session with the files to read. `handover`
tells the user how to resume.

Session start: the orchestrator reads the project notes, the status document if any, and, when continuing that work,
the next steps of the newest handover note.

`write-doc` keeps: intent over wording (the user's words are intent; write in your own words; never name the user or
the conversation as the source); one fact in one place, link instead of copy; concise; no invented facts (gaps marked
`TODO`); an existing document keeps its format. It drops the numeric-threshold rule in favour of: be concrete, say
what to do and when, use a number only where it matters. Language: documents in the notes' language, else the
repository's. Templates become optional suggestions: keep roadmap, decisions, handover note, adr, spec and changelog;
drop architecture and research-note unless cheap to keep. The handover-note template replaces `report-template.md`.

## Protocol and agents

The subagent protocol, in short:

- Read the project notes if present.
- Read what the brief names first; large files in excerpts.
- Stay in scope; findings outside it go under Attention.
- A budget notice is binding: wrap up and return partial.
- A case that belongs to the user: `Status: blocked` with a recommendation.
- Return Status / Result / Files / Attention, short.

The six agents stay. Only references to removed contract sections change: "the contract's Rules / Definition of done"
becomes "the project notes", and the `reviews:`, `research:` and `existing:` references go.

## Hooks

- `session-start.js`: injects the core always (no light mode). When there are no project notes it adds one line
  suggesting `/heliotrop:init`, at most once and only when useful. Keeps the compaction reset and the state cleanup.
  The session-file template pointer goes.
- `context-budget.js`: keeps all levels and thresholds above. Messages shrink to the fact plus a short instruction.
  The one-time cache notice stays.
- `post-edit.js` (`on-edit:`) and `archive-transcript.js` are unchanged; the archive is data for a later return of
  metrics.

## Targets

- Core rules about 70 lines or fewer (about 1.5k tokens, from about 4k).
- Each skill about 30 lines or fewer, `init` about 45, `protocol` about 20.
- Total engine Markdown about half of 1.x.

## Compatibility

2.0.0, major. A 1.x contract keeps working as project notes, and the hooks read its override lines. `init` offers
simplification once. Existing documents are never touched by the upgrade.

## Implementation slices

Paths under `plugins/heliotrop/`. The files of the slices are disjoint, so A to E can run in parallel.

| Slice | Files |
|---|---|
| A: core | `core/orchestrator.md` |
| B: hooks | `hooks/session-start.js`, `hooks/context-budget.js`, `tests/hooks/test.js` |
| C: init and guide | `skills/init/SKILL.md`, `skills/init/contract-template.md` (replaced by a notes template), `skills/guide/SKILL.md` |
| D: end and handover | `skills/end/SKILL.md`, `skills/handover/SKILL.md`, templates (including the new handover-note template), removal of `skills/plan/` and `skills/end/report-template.md` |
| E: protocol, write-doc, agents | `skills/protocol/SKILL.md`, `skills/write-doc/SKILL.md`, the six files in `agents/` |

Then a review of A to E. Last, the repository slice: `README.md`, `CHANGELOG.md`, `.claude-plugin/plugin.json`
(2.0.0) and the engine repository's own `.claude/project.md`, rewritten as project notes.

## Resolved questions

1. `session-start.js` injects the project notes after the core when `.claude/project.md` exists; the notes are short
   by design, and injecting them guarantees they are known without a tool call.
2. Research notes and review reports are written only where the brief names a path.
3. The architecture and research-note templates are dropped.
4. The core's heading is `# Heliotrop 2.0: orchestrator rules`; no hook parses it any more (light mode is gone).
5. The engine repository's own roadmap, decision register and session files stay as they are, apart from the usual
   update at the end of the work.
6. The status document written for the user (the roadmap) is in the conversation language unless the notes say
   otherwise; every other document follows the notes' language, else the repository's.
