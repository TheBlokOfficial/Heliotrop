# Decisions

<!-- Decision register: one entry per lasting decision (one that binds later sessions), newest first. The `end` and
`handover` skills add the lasting decisions of a session. A changed decision gets a new entry
that names the one it replaces; the old entry gets `Superseded by: <date> <title>`. Entries before 2026-10-30 were
reconstructed from commit messages; their source is the commit. -->

## 2026-10-30: 3.0 is built without a design note

- Decision: engine 3.0 is built from a shared specification carried in the briefs, with no note in `docs/design/`; the
  decisions are recorded in this register and the changes in the CHANGELOG. Narrows the practice of one design note per
  larger change.
- Reason: a design note costs a session of its own, and the briefs can carry the specification of a change whose
  decisions are already taken.
- Source: user decision, 2026-10-30

## 2026-10-30: Init proposes the standard document set

- Decision: `init` proposes `docs/roadmap.md` (status) and `docs/sessions/` (handover notes), mapping an equivalent
  document the project already has instead of creating a duplicate. The decision register stays optional: mapped if
  the project keeps one, created later when the work needs it. The paths go into the contract `## Documents`.
- Reason: a status document and handover notes are what a fresh session needs to resume; a register pays off only once
  decisions accumulate.
- Source: [CHANGELOG](../CHANGELOG.md), 3.0.0
- Supersedes in part: 2026-10-30 Init orients and asks (documents only for a real gap)

## 2026-10-30: Removed in 3.0: guide, prompt-cache notice, two-writers rule

- Decision: removed: the `guide` skill (the agent answers questions about the engine directly); the prompt-cache notice
  with its hook code, state field and tests (the README keeps a one-line tip for `"promptCacheTtl": "1h"`); the hard
  rule that two writing agents never touch the same files (the Slices guidance already keeps parallel slices on
  disjoint files). Engine-repo specifics leave the generic skills.
- Reason: the guide duplicated what the agent can explain; the cache notice has no effect once the TTL is set and is a
  pure add-on; the two-writers rule had no recorded reason and duplicated Slices.
- Source: [CHANGELOG](../CHANGELOG.md), 3.0.0
- Supersedes in part: 2026-10-30 Prompt-cache TTL notice; 2026-10-30 Hard rules only where they prevent real harm
  (the fourth rule); 2026-10-30 The engine points the user to the roadmap (the guide after `init`)

## 2026-10-30: Numbers have one source

- Decision: the engine's numbers (subagent budget, main-context points, reminder step, warning share, state age) are
  constants only in `plugins/heliotrop/hooks/common.js`; the tests import them. `session-start.js` fills the
  placeholders `{{context-budget}}`, `{{main-notice}}`, `{{main-hard}}` and `{{main-remind}}` in the orchestrator rules
  with the values in effect for the project. No other engine file states them. Notice prefixes drop the engine name
  (`Context budget:`, `Main context:`, `On-edit check failed for`).
- Reason: a number stated in several files drifts apart; the substitution keeps the rules and the hooks consistent
  with contract overrides.
- Source: [CHANGELOG](../CHANGELOG.md), 3.0.0

## 2026-10-30: CLAUDE.md block and a text-only engine boundary

- Decision: `init` manages a block between `<!-- engine:begin -->` and `<!-- engine:end -->` in the project's root
  `CLAUDE.md`: project and layout, language, conventions, always/never, and a fixed engine-boundary paragraph (the
  engine is tooling, not the project; its name stays out of the project's files; its own files are not edited;
  problems are reported to the user). `init` creates the file if missing and never touches text outside the markers.
  The boundary is a textual warning only; no hook blocks edits.
- Reason: Claude Code loads CLAUDE.md into the main session and into custom subagents, but not into the built-in
  Explore and Plan agents, so project facts every agent needs belong there. A blocking hook was not adopted.
- Source: user decision, 2026-10-30
- Supersedes in part: 2026-10-30 Init orients and asks (the pointer line in CLAUDE.md)

## 2026-10-30: Quality floor as a hard rule

- Decision: the orchestrator's hard rules hold a quality floor: a change to behaviour is verified by running something
  or reported as "not verified" with the reason; a larger change gets a review slice by an agent that did not write it;
  changed behaviour gets tests where a test setup exists (otherwise one proposal to the user); no check is weakened,
  skipped or rewritten to pass. Only the user lowers the floor, recorded with the reason in the contract `## Quality`;
  stricter bars need no approval. The implementer reports "not verified"; the verifier without defined checks reports
  `NO CHECKS`, never PASS.
- Reason: without a floor, quality depended on whatever the project notes happened to say, and an agent that cannot run
  a check could still report success.
- Source: [CHANGELOG](../CHANGELOG.md), 3.0.0
- Supersedes in part: 2026-10-30 Hard rules only where they prevent real harm (the set of hard rules)

## 2026-10-30: Guard by contract presence

- Decision: the existence of `.claude/contract.md` (nearest from the session directory upwards) is the initialisation
  marker. Without it every hook does nothing and prints nothing (no rules, notices, on-edit check or archive), and
  `end` and `handover` say the engine is not set up; `init` always works. The one exception is `.claude/project.md`
  without a contract: session-start emits a single line that the engine is inactive until `/heliotrop:init` migrates
  the notes.
- Reason: an engine that injects its rules into every project, set up or not, acts where nobody asked for it; the
  legacy line keeps 2.x projects from going silent without a trace.
- Source: [CHANGELOG](../CHANGELOG.md), 3.0.0
- Supersedes: 2026-10-30 The core loads in every session

## 2026-10-30: Contract with an engine-owned skeleton

- Decision: `.claude/contract.md` replaces the project notes `.claude/project.md`. The headings (Workflow, Quality,
  Checks, Documents, User decisions, Overrides, Notes) and their order belong to the engine, each with a one-line
  comment; the content belongs to the project and empty sections may stay empty. The hook keys `context-budget:`,
  `main-context:` and `on-edit:` keep their names and are read anywhere in the file. Default values are never written
  into a contract, so they do not freeze per project; Overrides holds only real deviations. The contract is injected
  at session start; subagents read it themselves. Major version 3.0.0, because 2.x projects need `/heliotrop:init`.
- Reason: free-form 2.x notes gave neither the project nor the agents a frame to rely on; the 1.x contract was too
  costly, and this skeleton is short and freezes no values.
- Source: [CHANGELOG](../CHANGELOG.md), 3.0.0
- Supersedes: 2026-10-30 Project notes replace the contract

## 2026-10-30: Hard rules only where they prevent real harm

- Decision: the core holds four hard rules: main-context points (150k: hand reading to subagents; 200k: no new agents,
  `handover`), the subagent budget (default 100k), the decisions reserved for the user, and no shared files between
  writing agents. Everything else is guidance, each item with its reason, which the orchestrator may adapt without
  logging.
- Reason: 1.x wrote procedure as rules, so sessions paid for ceremony instead of judgment; a rule that cannot be
  applied to an unusual case without its reason belongs in guidance.
- Source: [design/heliotrop-2.0.md](design/heliotrop-2.0.md), sections Hard rules and Guidance
- Superseded in part by: 2026-10-30 Quality floor as a hard rule (the set of hard rules); 2026-10-30 Removed in 3.0:
  guide, prompt-cache notice, two-writers rule (the fourth rule)

## 2026-10-30: Project notes replace the contract

- Decision: `.claude/project.md` is optional, free-form and short; `session-start.js` injects it after the core at
  session start. The hooks read the optional lines `context-budget:`, `main-context:` and `on-edit:` anywhere in the
  file, so a 1.x contract keeps working. Precedence: the user, then the project notes, then the engine. Replaces the
  contract as the project's interface to the engine.
- Reason: a required structure made every project pay for sections it did not use; notes of a few lines are cheap to
  inject and are known without a tool call.
- Source: [design/heliotrop-2.0.md](design/heliotrop-2.0.md), section Project notes and Resolved questions 1
- Supersedes in part: 2026-10-30 Light mode without a contract; 2026-10-21 Project specifics only in the contract
  (the place stays `.claude/project.md`, the required structure goes)
- Superseded by: 2026-10-30 Contract with an engine-owned skeleton

## 2026-10-30: Init orients and asks

- Decision: `init` surveys the project through one researcher slice, then asks only what the survey cannot show, each
  question with a recommendation; it writes short project notes and one pointer line in CLAUDE.md. It never imposes
  a document model, never restructures CLAUDE.md or existing documents without approval, and suggests a document only
  for a real gap (status lost between sessions, decisions that keep being re-discussed). A 1.x contract is offered a
  one-time rewrite as notes, keeping its content. Replaces the documentation audit.
- Reason: a fixed document set and an audit cost every project the same effort, whether or not it had the gap.
- Source: [design/heliotrop-2.0.md](design/heliotrop-2.0.md), section Init
- Superseded in part by: 2026-10-30 CLAUDE.md block and a text-only engine boundary (the pointer line); 2026-10-30
  Init proposes the standard document set (documents only for a real gap)

## 2026-10-30: Concepts removed in 2.0

- Decision: removed as engine concepts: session kinds, triage classification, the deviation log, Deferred, slice-size
  arithmetic and the `Size` field, code maps, review markers, the `plan` skill, light mode, the session file created
  at session start, and the 0.x migration path in `init`. A project may keep code maps or review markers in its notes.
  Focus on one topic is guidance, not classification.
- Reason: they were inferred behaviour or ceremony that duplicated other rules; the budget hook already enforces the
  ceiling that the size arithmetic estimated.
- Source: [design/heliotrop-2.0.md](design/heliotrop-2.0.md), section Removed concepts

## 2026-10-30: Handover note replaces session files

- Decision: only `handover` writes a note about a session (default `docs/sessions/YYYY-MM-DD-<topic>.md`, per the
  project notes); nothing is written at session start, and `end` gives a short report in the conversation. Replaces
  the session file as the engine's session record.
- Reason: a file created at the start and kept up to date through the session cost turns in every session, while
  only a session that ends by handing over needs a written record.
- Source: [design/heliotrop-2.0.md](design/heliotrop-2.0.md), sections Removed concepts and Skills

## 2026-10-30: The core loads in every session

- Decision: `core/orchestrator.md` is injected at the start of every session, with or without project notes; without
  notes the hooks run on defaults and the session suggests `/heliotrop:init`. There is no light mode.
- Reason: the core is short enough to load always, so a project without notes gets the same context points and
  budgets.
- Source: [design/heliotrop-2.0.md](design/heliotrop-2.0.md), sections Removed concepts and Resolved questions 4
- Supersedes: 2026-10-30 Light mode without a contract
- Superseded by: 2026-10-30 Guard by contract presence

## 2026-10-30: Unrelated side requests are handled at the end of the session

- Decision: in a session with a set focus, a side question, side task or decision unrelated to the focus is
  acknowledged in one line and goes to Deferred, worked off before `end`; at once only when it blocks the work or
  changes what it delivers, the user asks for it now, or it needs no reading. Narrows the 1.0 triage rule that answered
  short side questions at once.
- Reason: everything loaded mid-session is re-sent on every later turn, so unrelated work costs least at the end.
- Source: [sessions/2026-10-30-command-center.md](sessions/2026-10-30-command-center.md)
- Superseded in part by: 2026-10-30 Concepts removed in 2.0 (Deferred; side requests now fall under the focus guidance)

## 2026-10-30: The engine points the user to the roadmap

- Decision: `init` creates the roadmap when a project has none; the guide after `init` and the closing message of
  `end` and `handover` point to it in one line with a link.
- Reason: the roadmap is the user's command center; the user should know where to follow progress without being
  lectured.
- Source: [sessions/2026-10-30-command-center.md](sessions/2026-10-30-command-center.md)
- Superseded in part by: 2026-10-30 Removed in 3.0: guide, prompt-cache notice, two-writers rule (the guide)

## 2026-10-30: Engine versioning: minor by default, major only for a redesign

- Decision: patch for a fix that changes no rule; minor for every change to rules, skills, agents, hooks or the contract
  interface that a contract of an earlier version of the same major keeps working with (new keys have defaults, renamed
  keys stay readable); major only for a redesign of the engine, decided by the user. Rule in `.claude/project.md`
  `## Rules`; replaces the rule that made every new contract key a major version.
- Reason: additive contract changes do not break existing projects, and a major number should mark a redesign.
- Source: [sessions/2026-10-30-command-center.md](sessions/2026-10-30-command-center.md)
- Superseded in part by: 2026-10-30 Contract with an engine-owned skeleton (the rule is kept in the contract
  `## Notes`; the contract path)

## 2026-10-30: Roadmap as the user's command center

- Decision: the roadmap (`roadmap:`, default `docs/roadmap.md`) replaces the backlog as the project's only status
  document: where the project stands, what waits for the user, stages with ticked and open steps, later ideas, known
  problems. Finished steps are ticked, not deleted; a finished stage collapses to one line. A 1.0 contract's
  `backlog:` is read as `roadmap:`. Replaces the backlog part of "Standard document set".
- Reason: the user works from one status document, and a backlog that deletes finished items never shows the whole
  plan.
- Source: [design/heliotrop-1.1.md](design/heliotrop-1.1.md), section 1

## 2026-10-30: Language of user documents

- Decision: contract `user documents:` (default: the conversation language) sets the language of documents written
  for the user to work from, in 1.1 the roadmap; `documents:` covers all other documents. The rule lives only in the
  `write-doc` skill's `## Language`.
- Reason: the user reads the roadmap, not the technical documents, which stay in the project's document language.
- Source: [design/heliotrop-1.1.md](design/heliotrop-1.1.md), section 2

## 2026-10-30: Repository and folder named Heliotrop, packed plugin in build/

- Decision: the GitHub repository is `TheBlokOfficial/Heliotrop` (was `agent-stack`; the earlier repository of that
  name, the Witcher 3 mod, is now `Heliotrop-W3`) and the local folder is `D:\Projekty\Heliotrop`. `build.bat` (wrapper for
  `build.ps1`) packs `plugins/heliotrop/` into `build/heliotrop-<version>.zip`, committed with each release. Replaces the folder part of
  "Name Heliotrop, version 1.0.0".
- Reason: one name for the plugin, marketplace, repository and folder; a ready archive for installs without a
  marketplace.
- Source: user decision, 2026-10-30

## 2026-10-30: Metrics and the session doctor removed for now

- Decision: the session metrics script, the doctor agent and `diagnostics/` leave the repository; they stay in the git
  history and return later. The Stop hook keeps archiving transcripts to `~/.claude/heliotrop-archive/`.
- Reason: they are not adapted to the 1.0 names yet; the archive keeps the data they will need.
- Source: Heliotrop 1.0 implementation (CHANGELOG 1.0.0); return tracked in [roadmap.md](roadmap.md)

## 2026-10-30: The engine repository has its own contract

- Decision: rules for working on the engine live in `.claude/project.md`; the engine's rules live in
  `plugins/heliotrop/`. Hooks are tested on synthetic input (`tests/hooks/test.js`), never on a live session.
- Reason: the engine runs in place, so a change takes effect in every project from the next session.
- Source: [design/heliotrop-1.0.md](design/heliotrop-1.0.md), section 14
- Superseded in part by: 2026-10-30 Contract with an engine-owned skeleton (the file is now `.claude/contract.md`)

## 2026-10-30: Name Heliotrop, version 1.0.0

- Decision: plugin and marketplace `heliotrop`, directory `plugins/heliotrop/`, namespace `heliotrop:`, archive
  `~/.claude/heliotrop-archive/`, state `<tmp>/heliotrop-context-budget/`; every hook message starts with `Heliotrop`.
  The repository folder stays `agent-stack`.
- Reason: the redesign changes the contract interface (major version); messages with one prefix are recognisable in
  any transcript.
- Source: [design/heliotrop-1.0.md](design/heliotrop-1.0.md), section 1
- Superseded in part by: 2026-10-30 Repository and folder named Heliotrop, packed plugin in build/ (folder name)

## 2026-10-30: Session and slice are distinct terms

- Decision: a session is one conversation with the user and has a focus; a slice is one subagent's unit of work and
  nothing else.
- Reason: rules that used "slice" for the session were ambiguous about whose budget and scope they meant.
- Source: [design/heliotrop-1.0.md](design/heliotrop-1.0.md), section 2

## 2026-10-30: Soft session kinds

- Decision: six kinds (`build`, `design`, `talk`, `research`, `debug`, `review`) set the session file, the delegation
  and the end-report sections. The orchestrator infers the kind and never asks the user to choose; a shift is logged.
- Reason: one build-shaped procedure for every session made conversations and research pay for steps they do not need.
- Source: [design/heliotrop-1.0.md](design/heliotrop-1.0.md), section 3
- Superseded by: 2026-10-30 Concepts removed in 2.0

## 2026-10-30: Triage of messages during work

- Decision: each message is in focus, a side question or a new topic. A new topic gets its cost here and three
  options (backlog, new session via `handover`, switch focus); the user decides and the orchestrator never refuses.
- Reason: a new topic in a large session pays for the whole context on every further turn.
- Source: [design/heliotrop-1.0.md](design/heliotrop-1.0.md), section 4
- Superseded by: 2026-10-30 Concepts removed in 2.0 (classification; the focus guidance remains)

## 2026-10-30: Explaining consequences

- Decision: a consequence the user likely does not see (cost, risk, conflict with a recorded decision, a better
  alternative) is stated in 1-3 sentences with a recommendation; contract `guidance: explain | brief`, default
  `explain`. Brevity rules bind reports and progress messages, not explanations the user asks for.
- Reason: the earlier brevity rules suppressed explanations the user needed to decide.
- Source: [design/heliotrop-1.0.md](design/heliotrop-1.0.md), section 5

## 2026-10-30: Main-context points 150k / 200k

- Decision: the hook reports the main thread's context at the notice point (default 150k: reading moves to
  subagents) and the hard point (default 200k: no new agents, `handover`), then every further 50k; contract
  `main-context:`. Tokens = input + cache creation + cache read, for main and subagents.
- Reason: 200k is a cost and quality limit, not the model window; 1M-window models auto-compact only near ~967k.
- Source: [design/heliotrop-1.0.md](design/heliotrop-1.0.md), section 6

## 2026-10-30: Prompt-cache TTL notice

- Decision: when the main session writes the cache with a 5-minute TTL, one notice; the orchestrator offers
  `"promptCacheTtl": "1h"` in user settings and writes it only after approval. Subagents keep 5m.
- Reason: the orchestrator often waits on subagents longer than 5 minutes; one idle gap costs ~2.5x on 5m vs ~2.1x on
  1h, and a plugin cannot set the main session's TTL.
- Source: [design/heliotrop-1.0.md](design/heliotrop-1.0.md), section 7
- Superseded by: 2026-10-30 Removed in 3.0: guide, prompt-cache notice, two-writers rule

## 2026-10-30: Standard document set

- Decision: session journal, decision register (`docs/decisions.md`) and backlog (`docs/backlog.md`) by default; an
  existing ADR directory or roadmap replaces them. The start reads the contract, the backlog and the newest Next
  briefs only; `end` promotes lasting decisions and updates the backlog. Engine templates in
  `skills/write-doc/templates/`.
- Reason: decisions and open items scattered over session files had to be re-read to be found.
- Source: [design/heliotrop-1.0.md](design/heliotrop-1.0.md), section 8
- Superseded in part by: 2026-10-30 Roadmap as the user's command center (backlog)
- Superseded in part by: 2026-10-30 Init orients and asks (the default document set); 2026-10-30 Handover note
  replaces session files (the session journal)

## 2026-10-30: Light mode without a contract

- Decision: without `.claude/project.md` the engine injects triage, explaining and the main-context and cache
  sections, runs the budget and cache checks, writes no files and archives nothing.
- Reason: the cost controls help in every project; the full workflow needs a contract.
- Source: [design/heliotrop-1.0.md](design/heliotrop-1.0.md), section 9
- Superseded by: 2026-10-30 The core loads in every session

## 2026-10-30: Init audits existing documentation

- Decision: `init` audits the project's documents through researcher slices, maps them into `## Documents`, proposes
  fixes and restructures only after approval; it checks the cache TTL and ends with `guide`.
- Reason: a contract that does not say where existing documents are leaves every session to search for them.
- Source: [design/heliotrop-1.0.md](design/heliotrop-1.0.md), section 10
- Superseded by: 2026-10-30 Init orients and asks

## 2026-10-30: One brief format, one place per rule

- Decision: one brief field list (`Agent`, `Goal`, `Read`, `Size`, `Constraints`, `Done when`, `Return`) in the
  orchestrator rules, used by `plan` and the session file template. Budget rules live only in `## Budgets`. Code maps
  and `Read` lines prefer `path#symbol` over line ranges.
- Reason: copies of a rule drift apart; symbols survive edits that shift line numbers.
- Source: [design/heliotrop-1.0.md](design/heliotrop-1.0.md), sections 12-13
- Superseded in part by: 2026-10-30 Concepts removed in 2.0 (the field list with `Size`, `plan`, code maps)

## 2026-10-28: Budget notices let finished work verify

- Decision: past the slice budget, the build, tests and commit of finished work may still run; from +20% the agent
  stops. At the 80% warning the agent estimates what is left and returns `partial` at once when it needs more than
  ~6 tool calls. `Size` counts the named reading twice and keeps the expected peak at ~80k.
- Reason: a fresh agent pays more to orient than the few calls left; estimates of 80k have ended at 100k.
- Source: commit 2059f76 (0.8.0)
- Superseded in part by: 2026-10-30 Concepts removed in 2.0 (the `Size` field)

## 2026-10-27: Subagents are told their context size

- Decision: a PostToolUse hook measures each subagent's own transcript against the slice budget and tells it to wrap
  up and return `partial` past the budget.
- Reason: a subagent cannot see its own context size, and a slice's cost grows roughly with the square of its length.
- Source: commit 372ebfa (0.7.0)

## 2026-10-25: ~100k slice ceiling

- Decision: plan every slice for at most ~100k tokens of context, with a `Size` line in every brief; split when in
  doubt.
- Reason: a slice costs about ½ × turns × final context and long contexts lose quality, while a fresh agent starts at
  only ~10-15k.
- Source: commit 3983159 (0.6.0)
- Superseded in part by: 2026-10-30 Concepts removed in 2.0 (the `Size` line); the 100k default stays as the subagent
  budget in 2026-10-30 Hard rules only where they prevent real harm

## 2026-10-25: One item per slice

- Decision: one slice takes one item: one area of at most ~3 questions from the same sources for a researcher, one
  change, one document, one review area. Items are bundled only when they read the same files and stay under the
  ceiling.
- Reason: bundled items carry each other's reading through every turn.
- Source: commit 3983159 (0.6.0)

## 2026-10-25: Review sessions

- Decision: a contract may move code review and tests out of implementation sessions; the end report states the
  unreviewed range from the review marker.
- Reason: TODO (not recorded in the commit).
- Source: commit 3983159 (0.6.0)
- Superseded by: 2026-10-30 Concepts removed in 2.0 (review markers)

## 2026-10-23: Deferral replaces fix-in-passing

- Decision: checks, lookups, small fixes and document updates that come up mid-session go to the session file's
  Deferred list and are worked off before the end report; only what blocks the work or changes its result is done at
  once. Replaces the 0.2.0 rule that allowed fixes of up to ~10 lines outside the slice at any time.
- Reason: everything loaded mid-session is paid for again on every later turn.
- Source: commit 89e4d4d
- Superseded by: 2026-10-30 Concepts removed in 2.0 (Deferred)

## 2026-10-23: Review and fixes are separate slices

- Decision: review and fixes run as separate slices; one fix slice per branch takes all findings with `path:line`,
  under ~50k, on a cheaper model.
- Reason: merged review+fix slices cost 18-41% more than separate ones (doctor report on KamReimagined sessions
  17-25); a fix slice re-reads little, and the reviewer does not judge its own fixes.
- Source: commits 3322657 (0.5.0), 8379d73 (0.4.0)

## 2026-10-23: Next briefs in the end report

- Decision: the end report carries ready briefs for the next session's first slices; research notes are read by
  excerpt.
- Reason: orientation before the first dispatch cost ~5% of a session, and full reads of research notes were carried
  for the rest of the session.
- Source: commit 3322657 (0.5.0)

## 2026-10-21: Tests from the specification in a fresh context

- Decision: a test-writer writes tests from the specification after the implementation returns, alongside its review;
  failures that contradict the specification are reported as defects.
- Reason: tests written by the implementer tend to follow the code instead of the specification.
- Source: commit 8379d73 (0.4.0)

## 2026-10-21: Targeted reading and owned interpretation

- Decision: subagents read a whole file only up to ~200 lines, otherwise ranges or symbols; a large implementation
  whose code must first be located gets a code map first. The orchestrator turns the user's messages into requirements
  in its own words.
- Reason: everything an agent reads stays in its context and is re-sent on every turn; dictated messages carry
  transcription errors.
- Source: commit 9a02cf0 (0.3.0)
- Superseded in part by: 2026-10-30 Concepts removed in 2.0 (code maps)

## 2026-10-21: Rules are defaults

- Decision: the orchestrator rules are defaults; the orchestrator may deviate when a literal reading works against a
  correct, cheap result and logs the deviation. User decisions and the contract stay binding.
- Reason: following a rule literally can work against a correct, cheap result.
- Source: commit 9b183c2 (0.2.0)
- Superseded in part by: 2026-10-30 Hard rules only where they prevent real harm (guidance may be adapted without a
  deviation log)

## 2026-10-21: Project specifics only in the contract

- Decision: the engine is project-agnostic; paths, commands, documents and rules of a project live in its
  `.claude/project.md`.
- Reason: one engine serves every project.
- Source: commit 512548c (0.1.0)
- Superseded in part by: 2026-10-30 Project notes replace the contract (the contract's required structure)
