# Decisions

<!-- Decision register: one entry per lasting decision (one that binds later sessions), newest first. The `end` and
`handover` skills add entries from the session file's Decisions and User decisions. A changed decision gets a new entry
that names the one it replaces; the old entry gets `Superseded by: <date> <title>`. Entries before 2026-10-30 were
reconstructed from commit messages; their source is the commit. -->

## 2026-10-30: Engine versioning: minor by default, major only for a redesign

- Decision: patch for a fix that changes no rule; minor for every change to rules, skills, agents, hooks or the contract
  interface that a contract of an earlier version of the same major keeps working with (new keys have defaults, renamed
  keys stay readable); major only for a redesign of the engine, decided by the user. Rule in `.claude/project.md`
  `## Rules`; replaces the rule that made every new contract key a major version.
- Reason: additive contract changes do not break existing projects, and a major number should mark a redesign.
- Source: [sessions/2026-10-30-command-center.md](sessions/2026-10-30-command-center.md)

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

## 2026-10-30: Triage of messages during work

- Decision: each message is in focus, a side question or a new topic. A new topic gets its cost here and three
  options (backlog, new session via `handover`, switch focus); the user decides and the orchestrator never refuses.
- Reason: a new topic in a large session pays for the whole context on every further turn.
- Source: [design/heliotrop-1.0.md](design/heliotrop-1.0.md), section 4

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

## 2026-10-30: Standard document set

- Decision: session journal, decision register (`docs/decisions.md`) and backlog (`docs/backlog.md`) by default; an
  existing ADR directory or roadmap replaces them. The start reads the contract, the backlog and the newest Next
  briefs only; `end` promotes lasting decisions and updates the backlog. Engine templates in
  `skills/write-doc/templates/`.
- Reason: decisions and open items scattered over session files had to be re-read to be found.
- Source: [design/heliotrop-1.0.md](design/heliotrop-1.0.md), section 8
- Superseded in part by: 2026-10-30 Roadmap as the user's command center (backlog)

## 2026-10-30: Light mode without a contract

- Decision: without `.claude/project.md` the engine injects triage, explaining and the main-context and cache
  sections, runs the budget and cache checks, writes no files and archives nothing.
- Reason: the cost controls help in every project; the full workflow needs a contract.
- Source: [design/heliotrop-1.0.md](design/heliotrop-1.0.md), section 9

## 2026-10-30: Init audits existing documentation

- Decision: `init` audits the project's documents through researcher slices, maps them into `## Documents`, proposes
  fixes and restructures only after approval; it checks the cache TTL and ends with `guide`.
- Reason: a contract that does not say where existing documents are leaves every session to search for them.
- Source: [design/heliotrop-1.0.md](design/heliotrop-1.0.md), section 10

## 2026-10-30: One brief format, one place per rule

- Decision: one brief field list (`Agent`, `Goal`, `Read`, `Size`, `Constraints`, `Done when`, `Return`) in the
  orchestrator rules, used by `plan` and the session file template. Budget rules live only in `## Budgets`. Code maps
  and `Read` lines prefer `path#symbol` over line ranges.
- Reason: copies of a rule drift apart; symbols survive edits that shift line numbers.
- Source: [design/heliotrop-1.0.md](design/heliotrop-1.0.md), sections 12-13

## 2026-10-28: Budget notices let finished work verify

- Decision: past the slice budget, the build, tests and commit of finished work may still run; from +20% the agent
  stops. At the 80% warning the agent estimates what is left and returns `partial` at once when it needs more than
  ~6 tool calls. `Size` counts the named reading twice and keeps the expected peak at ~80k.
- Reason: a fresh agent pays more to orient than the few calls left; estimates of 80k have ended at 100k.
- Source: commit 2059f76 (0.8.0)

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

## 2026-10-23: Deferral replaces fix-in-passing

- Decision: checks, lookups, small fixes and document updates that come up mid-session go to the session file's
  Deferred list and are worked off before the end report; only what blocks the work or changes its result is done at
  once. Replaces the 0.2.0 rule that allowed fixes of up to ~10 lines outside the slice at any time.
- Reason: everything loaded mid-session is paid for again on every later turn.
- Source: commit 89e4d4d

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

## 2026-10-21: Rules are defaults

- Decision: the orchestrator rules are defaults; the orchestrator may deviate when a literal reading works against a
  correct, cheap result and logs the deviation. User decisions and the contract stay binding.
- Reason: following a rule literally can work against a correct, cheap result.
- Source: commit 9b183c2 (0.2.0)

## 2026-10-21: Project specifics only in the contract

- Decision: the engine is project-agnostic; paths, commands, documents and rules of a project live in its
  `.claude/project.md`.
- Reason: one engine serves every project.
- Source: commit 512548c (0.1.0)
