# Heliotrop 1.0: design specification

Redesign of the `stack` plugin (0.8.0) as Heliotrop 1.0. The decisions below are settled; this document turns them into
checkable requirements for the implementers (H, R, S, N) and the reviewer.

Conventions:

- `<engine>` = `plugins/heliotrop/` (group N renamed it from `plugins/stack/`, where H, R and S worked).
- "Orchestrator rules" = `<engine>/core/orchestrator.md`. Section names below are exact headings; other files refer to
  them by these names.

## 1. Identity

Requirements:

1. Plugin name `heliotrop`, marketplace name `heliotrop`, directory `plugins/heliotrop/`, version `1.0.0`.
2. Every skill and agent reference in engine text uses the `heliotrop:` namespace (`/heliotrop:init`,
   `heliotrop:researcher`, ...); no `stack:` or `/stack:` remains in `<engine>`.
3. First line of the orchestrator rules: `# Heliotrop 1.0: orchestrator rules`. It is the rules' version marker.
4. Archive directory `~/.claude/heliotrop-archive`; temp state directory `<os.tmpdir()>/heliotrop-context-budget`.
5. Every hook message starts with `Heliotrop` (e.g. `Heliotrop context budget:`, `Heliotrop main context:`,
   `Heliotrop cache:`, `Heliotrop on-edit check failed for`).
6. `session_metrics.ps1` and `doctor.md` recognise the old and the new names (section 14). Deferred: metrics and the
   doctor were removed for now; see `docs/backlog.md`.
7. The repository folder `agent-stack` keeps its name.

Files: all of `<engine>`, `.claude-plugin/marketplace.json`, `<engine>/.claude-plugin/plugin.json`.

## 2. Terminology

Requirements:

1. "Session" = one conversation with the user; it has a focus (its topic). "Slice" = one subagent's unit of work, and
   nothing else.
2. No engine text uses "slice" for the session. Known places: orchestrator rules "Session" (lines 16-38 today),
   "Communicating with the user" (line 47), "Decisions" (line 68); `skills/end/SKILL.md` description and step 2;
   `skills/end/report-template.md` Deferred and Next briefs comments. Replace with "session", "focus" or "the work".

Files: `core/orchestrator.md`, `skills/end/SKILL.md`, `skills/end/report-template.md`, `README.md`.

## 3. Session kinds

Requirements:

1. Orchestrator rules `### Session kinds` (under `## Session`) defines six kinds as a table with columns kind, session
   file, delegation, end-report sections: `build`, `design`, `talk` (questions, explanation), `research`, `debug`,
   `review`.
2. The orchestrator infers the kind from the request without asking. It never asks the user to choose or open a kind
   and names the kind only when that changes something for the user (cost, new topic).
3. Session file: opened for every kind except `talk`; a `talk` session opens one when it takes its first lasting
   decision.
4. Delegation: `build`, `research`, `review` delegate the work; `design` and `talk` converse directly and delegate
   reading per `## Budgets`; `debug` delegates reading and reproduction, keeps the hypothesis.
5. The session file's first line after the title is `kind: <kind>`. A shift is appended to Decisions as
   `kind: <old> → <new> — <reason>`.
6. The previous report's Next briefs are dispatched only when the session continues that build work; otherwise the
   start report mentions them in one line.
7. A one-off question or lookup keeps the direct-answer rule: no report, no session file.
8. `skills/end/SKILL.md` contains the per-kind table of report sections; sections that do not apply are omitted.
   Minimum: `talk` = Scope, Decisions, User decisions, Open; `design`/`research` add Done, Next sessions; `build`,
   `debug`, `review` use all sections; State only when files changed.

Files: `core/orchestrator.md`, `skills/end/SKILL.md`, `skills/end/report-template.md`.

## 4. Triage of user messages

Requirements:

1. Orchestrator rules `## Triage` classifies every user message during work: in focus → proceed; quick side question
   → short answer, then return to the work; new topic → 1-2 sentences saying it is a new topic and what it costs here
   (current context size: the figure of the last `Heliotrop main context` notice, otherwise an estimate), then three
   options: park it in the backlog, start a new session (via `handover`), switch the focus here.
2. The user decides; the orchestrator carries out the choice. It never refuses.
3. Switching focus here is recorded in the session file's Decisions.

Files: `core/orchestrator.md`.

## 5. Explaining

Requirements:

1. Orchestrator rules `## Explaining`: when a request carries a consequence the user likely does not see (cost, risk,
   conflict with a recorded decision, a clearly better alternative), state it in 1-3 sentences with a recommendation,
   then do what the user chooses.
2. Contract field `guidance: explain | brief`, default `explain`. `explain` also clarifies terms and gives the reason
   briefly; `brief` states consequences only.
3. "Communicating with the user" is rewritten so that brevity rules apply to reports and progress messages, and
   explanations the user asks for are allowed in chat. "Analyses and comparisons go into documents" applies to material
   meant to be kept. The conflict with "Interpreting the user is your job" is gone.

Files: `core/orchestrator.md`, `skills/init/contract-template.md`.

## 6. Main-session context budget

Requirements:

1. `context-budget.js` handles the main thread: a PostToolUse call is a main-thread call when the input has no
   `agent_id` and `transcript_path` is not an `agent-*.jsonl` file. The subagent search by `tool_use_id` is removed.
2. Main tokens = last `type: "assistant"` entry with `message.usage` in `transcript_path`, skipping entries with
   `isSidechain: true`.
3. Token formula for main and subagents: `input_tokens + cache_creation_input_tokens + cache_read_input_tokens`
   (`output_tokens` dropped).
4. Contract field `main-context: <notice> / <hard>`, default `150k / 200k`. `main-context:` and `context-budget:`
   accept an integer or an integer with `k` (×1000); `context-budget: 100k` = 100000.
5. Levels, each fired once per session: level 0 at ≥ notice; level 1 at ≥ hard; level 2+ every further 50000 tokens
   (`MAIN_REMIND_STEP = 50000`). Output: `hookSpecificOutput.additionalContext` (model) plus top-level `systemMessage`
   (user, one line). Each text ≤ 300 characters. Content:
   - level 0, model: `Heliotrop main context: ~Nk tokens.` Hand remaining reading to subagents; record decisions in
     the session file now (orchestrator rules, Main context). User: context is large; reading moves to subagents.
   - level 1, model: hard point reached; dispatch no new agents, collect running agents' results, run `handover`,
     report done / left / how to continue and ask what next. User: limit reached, handing over.
   - level 2+, model and user: short reminder with the token count.
6. State file `<tmp>/heliotrop-context-budget/main-<session_id>.json` = `{ "level": n, "cacheNotice": bool }`.
   Subagent state stays per agent transcript (`<agent transcript basename>.json`).
7. `session-start.js` reads its stdin JSON; when `source` is `compact` it resets `level` to -1 in the main state file
   (keeps `cacheNotice`). On every SessionStart it deletes files in the state directory older than 7 days.
8. The main-thread check and the subagent check run with or without a contract; without one the subagent check uses
   the default budget (100k). Subagent thresholds stay (80% warning, budget, every further 20%).
9. Orchestrator rules `### Main context` (under `## Budgets`) states the two points, the hard-point procedure of item 5
   and that 200k is a cost and quality limit, not the model window (1M-window models auto-compact near ~967k).

Files: `hooks/context-budget.js`, `hooks/session-start.js`, `core/orchestrator.md`, `skills/init/contract-template.md`.

## 7. Prompt cache TTL

Requirements:

1. `context-budget.js` reads the main thread's last assistant `usage.cache_creation`. When
   `ephemeral_5m_input_tokens > 0` and `ephemeral_1h_input_tokens` is 0 or absent, and `cacheNotice` is false, it sends
   one model notice and one `systemMessage` (≤ 300 characters each, prefix `Heliotrop cache:`): the main session writes
   the cache with a 5-minute TTL; `"promptCacheTtl": "1h"` in `~/.claude/settings.json` is cheaper for an orchestrator
   that waits on subagents. Then sets `cacheNotice: true`. Runs with or without a contract.
2. Orchestrator rules `### Prompt cache` (under `## Budgets`): the orchestrator waits on subagents longer than 5
   minutes; 1h writes cost 2x vs 1.25x, reads are equal; one idle gap over 5 minutes costs ~2.5x on 5m vs ~2.1x on 1h.
   A plugin cannot set the main-session TTL; subscriptions within plan usage get 1h, API key, overage, Bedrock and
   Vertex get 5m. On the notice the orchestrator explains this once and offers to add the setting to user settings;
   it writes it only after the user approves. Subagents keep 5m.
3. `init` checks `FORCE_PROMPT_CACHING_5M`, `CLAUDE_CODE_PROMPT_CACHE_TTL`, `ENABLE_PROMPT_CACHING_1H` and
   `promptCacheTtl` in `~/.claude/settings.json`, reports each value found and whether the main session ends on 1h,
   and offers the setting per item 2.

Files: `hooks/context-budget.js`, `core/orchestrator.md`, `skills/init/SKILL.md`.

## 8. Documents

Requirements:

1. Orchestrator rules `## Documents` defines the standard set the engine maintains:
   - session journal `docs/sessions/YYYY-MM-DD-<topic>.md`;
   - decision register, default `docs/decisions.md`: one entry per lasting decision with date, decision, reason,
     source session; an existing ADR directory replaces it;
   - backlog, default `docs/backlog.md`: open items and next steps; an existing roadmap replaces it.
2. Start reading: the contract, the backlog, the newest report's Next briefs; nothing else until the focus is clear.
3. `end` promotes lasting decisions from the session file to the register and updates the backlog (adds open and
   deferred items, removes done ones).
4. Contract template section `## Documents` (replaces `## Document types`): lines `sessions:`, `decisions:`,
   `backlog:`, `research:`, `reviews:`, `code-maps:` (each `<path>, committed | temporary`), `optional:` (enabled
   optional types with path) and `existing:` (one line per document: path — purpose — when updated — by whom).
   `## Sessions` keeps `start reading:` and `end steps:`; `dir:` moves to `sessions:`.
5. Engine templates in `skills/write-doc/templates/`: `decisions.md`, `backlog.md`, `architecture.md`, `spec.md`,
   `adr.md`, `changelog.md`, `research-note.md`. `write-doc` states that a contract entry `template: engine` means
   `templates/<type>.md` in that skill's directory.
6. Every engine reference to "Document types" is updated to `Documents` (protocol rule 1, `write-doc` rule 1, `plan`
   step 1, `researcher.md` rule 5, `doc-writer.md` description and rule 1, `reviewer.md` report path → `reviews:`).

Files: `core/orchestrator.md`, `skills/init/contract-template.md`, `skills/end/SKILL.md`, `skills/write-doc/SKILL.md`,
`skills/write-doc/templates/*.md` (new), `skills/protocol/SKILL.md`, `skills/plan/SKILL.md`, `agents/researcher.md`,
`agents/doc-writer.md`, `agents/reviewer.md`.

## 9. Light mode without a contract

Requirements:

1. Without `.claude/project.md`, `session-start.js` injects the header `# Heliotrop 1.0: light mode`, one paragraph
   (no contract, no session files; suggest `/heliotrop:init` at most once per session, when the work would benefit),
   then the orchestrator rules' sections `## Triage`, `## Explaining`, `### Main context`, `### Prompt cache`,
   extracted from `core/orchestrator.md` (each from its heading to the next heading of the same or higher level).
2. Those four sections are written to stand without a contract (contract values "or the default").
3. The main-context, subagent-budget (default budget) and cache checks run (sections 6, 7); the archive hook does not.
4. `end` and `handover` without a contract write no files: they give the summary in chat and mention
   `/heliotrop:init` once.

Files: `hooks/session-start.js`, `core/orchestrator.md`, `skills/end/SKILL.md`, `skills/handover/SKILL.md`.

## 10. Init

Requirements:

1. Existing contract: no overwrite; offer review. A 0.x contract (has `type:`, `## Document types`, or
   `context-budget:` outside `## Budgets`) gets an offer to migrate.
2. Audit all existing documentation through `researcher` slices (one area per slice): roadmap, ADRs, architecture,
   specs, changelog, session logs, READMEs, CLAUDE.md. Per document: path, purpose, structure; across documents:
   duplicates, broken links, stale status, overlaps.
3. Map the result into `## Documents` so the contract states what is where, what it is for, when it is updated and by
   whom. An existing roadmap becomes `backlog:`.
4. Report problems with proposed fixes; restructure only after the user approves.
5. Run the cache TTL check (section 7, item 3).
6. End with a short explanation of how Heliotrop works by running the `guide` skill.
7. Migration from the 0.x `stack` engine. Detected by: a contract with a `# stack` heading, `type:`,
   `## Document types` or budget fields outside `## Budgets`; session reports without `kind:`; `stack@agent-stack`
   in `~/.claude/plugins/installed_plugins.json` or `enabledPlugins` of `~/.claude/settings.json`. Contract mapping:
   `type:` dropped, Document types and sessions `dir:` → `## Documents`, budget fields → `## Budgets` with their values
   kept (`100k` valid); Rules, Pipeline, User decisions, Definition of done unchanged. Old session reports stay; the
   newest one's Open and Next sessions go to the backlog, its lasting decisions to the register. An installed old
   plugin: tell the user to uninstall it (hooks would run twice). The contract diff is shown and written only after
   approval.
8. Set without asking: languages (conversation = the user's language; documents and code = what the repository uses,
   else English), `guidance: explain` (the contract notes it can be changed), `main-context: 150k / 200k`; autonomy
   stays as the orchestrator rules define it.
9. Git check before the Q&A: git repository, remote, GitHub with `gh` installed and authenticated. Each missing piece:
   one line on what it gives (history, undo, backup, sharing) and a question; `git init` or a GitHub repository only
   after the user's yes.
10. Setup Q&A on fresh init and migration, in one message, each question with concrete options, the recommendation
    first; one reply ("defaults OK") accepts all; questions the repository answers become proposals; one line of why
    per question. Questions → contract sections: tests (standard / critical only / thorough) → Definition of done,
    Pipeline; review (every code change / changes over ~100 lines only / none) → Pipeline; commits (orchestrator after
    approval / orchestrator when a slice is done / user; skipped without git, no push step without a remote) →
    Conventions `commits:`, User decisions; optional documents (architecture, spec, ADR, changelog) → Documents
    `optional:`. No new orchestrator rule.

Files: `skills/init/SKILL.md`.

## 11. New skills

Requirements:

1. `skills/handover/SKILL.md` (`name: handover`): writes the current state into the session file (Done so far, Open,
   Deferred, State), Next briefs for the remaining work, updates the backlog, and ends with a message: done / left /
   how to resume. Used at the main-context hard point and when a new topic moves to a new session (the topic goes to
   the backlog and Next sessions).
2. `skills/guide/SKILL.md` (`name: guide`, user-invocable): explains session kinds, delegation, costs, the context
   points, documents; uses the contract's actual values when present; length and detail follow `guidance:`.

Files: `skills/handover/SKILL.md`, `skills/guide/SKILL.md` (both new).

## 12. Plan and brief format

Requirements:

1. One brief field list, in this order: `Agent`, `Goal`, `Read`, `Size`, `Constraints`, `Done when`, `Return`. Defined
   in orchestrator rules `### Brief: orchestrator to subagent`; `plan` step 5 and the report template's Next briefs
   block use exactly this list (the template gains `Return`).
2. `Agent:` format: `heliotrop:<agent>, model <model>`.

Files: `core/orchestrator.md`, `skills/plan/SKILL.md`, `skills/end/report-template.md`.

## 13. Cleanups

Requirements:

1. Budget rules live only in orchestrator rules `## Budgets` (`### Slice size`, `### Main context`, `### Prompt
   cache`). Protocol rule 5 states only the subagent's action (stop early, return `partial`, follow the notice) and no
   thresholds; README and hook comments refer to `## Budgets`.
2. Contract template: `type:` removed from `## Project`; `context-budget:` (default `100k`) and `main-context:`
   (default `150k / 200k`) in one `## Budgets` section; `guidance:` line in `## Language`.
3. Code maps: one line per location, `path#symbol — role — what changes there`, line ranges (`path:start-end`) only
   where no symbol fits. Same priority in the brief's `Read` line.
4. `hooks.json`: no `"shell"` field on any hook.
5. The session file is created at the start from the report template with Scope, `kind:`, empty Decisions and empty
   Deferred; `session-start.js` appends `Session file template: <absolute path of skills/end/report-template.md>` to
   the injected rules. Deferred is described in both the start (orchestrator rules) and `end`.

Files: `core/orchestrator.md`, `skills/protocol/SKILL.md`, `skills/init/contract-template.md`, `hooks/hooks.json`,
`hooks/session-start.js`, `skills/end/SKILL.md`.

## 14. Engine repo governance and rename

Requirements:

1. `git mv plugins/stack plugins/heliotrop`; `plugin.json`: `name` `heliotrop`, `version` `1.0.0`; `marketplace.json`:
   `name` `heliotrop`, plugin `heliotrop`, source `./plugins/heliotrop`.
2. `session_metrics.ps1`: injection detected by regex `# (stack|Heliotrop [\d.]+): orchestrator rules`; light header
   `# Heliotrop [\d.]+: light mode` gives version `light`; transcripts read from `~/.claude/heliotrop-archive` and
   `~/.claude/stack-archive`; engine version history from both `plugins/stack/` and `plugins/heliotrop/`
   `plugin.json` paths. Deferred: metrics and the doctor were removed for now; see `docs/backlog.md`.
3. `doctor.md`: names Heliotrop; both archive directories; engine paths under `plugins/heliotrop/`; fills `kind` from
   the session file's `kind:` line. Deferred: metrics and the doctor were removed for now; see `docs/backlog.md`.
4. `.claude/project.md` for this repo, from the new template: the user decides direction and approves releases; Claude
   proposes changes with evidence; evidence = observations from real sessions (`diagnostics/`); change cycle = problem
   → evidence → change → version bump → measurement with the doctor on the next real sessions; engine rules live in
   `plugins/heliotrop/`, rules for working on the engine in this contract. Deferred (`diagnostics/` as the evidence
   source, measurement with the doctor): metrics and the doctor were removed for now; see `docs/backlog.md`.
5. `docs/decisions.md` from the `decisions.md` template: the 1.0 decisions (sections 1-13) and the rationale found
   in `git log` messages (at least: review and fix kept separate; ~100k slice ceiling; one item per slice).
6. `docs/backlog.md` from the `backlog.md` template, open items: measure the composition of the ~57k start
   background; a `briefSizeReadK` metric; separate budget thresholds for read-only roles.
7. `CHANGELOG.md` with a `1.0.0` entry (Added, Changed, Removed).
8. `README.md` rewritten for Heliotrop, with reinstall steps: `claude plugin uninstall stack@agent-stack`,
   `claude plugin marketplace remove agent-stack`, `claude plugin marketplace add <repo path>`,
   `claude plugin install heliotrop@heliotrop --scope user`; the `"shell": "powershell"` note removed.
9. `diagnostics/README.md`: only name and path references updated. Deferred: metrics and the doctor were removed for
   now; see `docs/backlog.md`.

Files: listed in section 15, group N.

## 15. Implementation split

| Group | Files |
|---|---|
| H, hooks | `<engine>/hooks/context-budget.js`, `hooks/session-start.js`, `hooks/archive-transcript.js`, `hooks/post-edit.js`, `hooks/hooks.json` |
| R, rules | `<engine>/core/orchestrator.md`, `agents/researcher.md`, `agents/implementer.md`, `agents/test-writer.md`, `agents/reviewer.md`, `agents/doc-writer.md`, `agents/verifier.md`, `skills/protocol/SKILL.md` |
| S, skills | `<engine>/skills/init/SKILL.md`, `skills/init/contract-template.md`, `skills/plan/SKILL.md`, `skills/end/SKILL.md`, `skills/end/report-template.md`, `skills/write-doc/SKILL.md`, `skills/write-doc/templates/*.md` (new), `skills/handover/SKILL.md` (new), `skills/guide/SKILL.md` (new) |
| N, rename and repo (last) | directory move to `plugins/heliotrop/`, `plugins/heliotrop/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`, `CHANGELOG.md` (new), `docs/decisions.md` (new), `docs/backlog.md` (new), `.claude/project.md` (new); deferred (metrics and the doctor were removed for now; see `docs/backlog.md`): `.claude/agents/doctor.md`, `tools/session-metrics/session_metrics.ps1`, `diagnostics/README.md` |

Interfaces between groups:

- H depends on R's headings `## Triage`, `## Explaining`, `### Main context`, `### Prompt cache` (light-mode
  extraction) and on S's `skills/end/report-template.md` path.
- R and S refer to the notice prefixes in section 1, item 5, and to the contract fields `guidance:`,
  `main-context:`, `context-budget:` and the `## Documents` lines.
- N starts after H, R and S are merged, and checks with `git grep -n "stack:"` and `git grep -n "stack-archive"` that
  only the compatibility lines of item 14.2-14.3 (deferred) and history files remain.
