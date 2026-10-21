# diagnostics

Measurements of the stack engine in real sessions of the projects that use it, and the doctor's reports. Written by
[`tools/session-metrics/session_metrics.ps1`](../tools/session-metrics/session_metrics.ps1) (`-Record`) and the
[doctor agent](../.claude/agents/doctor.md); engine changes are decided from the reports, not made by the doctor.

| File | Content |
|---|---|
| `sessions.csv` | one row per session, appended; rows are never rewritten except to fill `kind` and `itemsDone`, and to add empty values when new columns are appended to the header |
| `agents.csv` | one row per agent (main session and every subagent) of each recorded session |
| `reports/YYYY-MM-DD-<topic>.md` | one doctor report per run |

## sessions.csv

| Column | Meaning |
|---|---|
| `project`, `session` | project folder name, session id |
| `date` | date of the session's first entry |
| `engine` | stack version (from the history of `plugin.json`) when the orchestrator rules were injected; `off` when they were not |
| `kind`, `itemsDone` | `code`, `docs`, `research` or `mixed`, and roadmap items closed; filled by the doctor, empty when unknown |
| `totalInputK` | input tokens of all calls of all agents, cache reads included, in thousands |
| `weightedInputK` | the same weighted by price: cache reads ×0.1, cache writes ×1.25; model price differences are not included |
| `wallMin` | minutes from the main session's first to last entry |
| `mainModel`, `mainPeakK`, `mainCalls`, `mainInputK` | main session: model, largest single-call context, API calls, input |
| `agents`, `agentsPeakOver150k` | subagents, and those whose largest context exceeded 150k |
| `agentsPartial`, `agentsBlocked`, `agentsNoStatus` | subagents by return status; no status means no `Status:` line in the return |
| `bigReads` | whole-file Reads over 200 lines in all agents (the contract excluded) |
| `commits`, `fixCommits`, `linesChanged` | commits on any branch of the project during the session, those with a `fix` type, and inserted plus deleted lines |
| `mainMsgs`, `mainMsgChars`, `mainMsgMedian`, `mainMsgMax` | text messages of the main session (one per API response with text): count, total, median and largest length in characters |
| `mainMsgsLong` | those over 500 characters, the final message excluded |
| `mainMsgsWhileAgents` | those sent while at least one subagent was running (between its first and last entry) |
| `maxConcurrent`, `concurrentMin2` | most subagents running at once, and minutes with two or more running |
| `mainWaitMin` | minutes of main-session gaps over 60 s while a subagent ran, the gaps that end with the user's own prompt excluded |

The columns from `mainMsgs` on were added later: rows recorded before that have them empty, except `a4c6a201`
(re-measured while its transcript still existed).

## agents.csv

Per agent: `calls`, `peakK`, `inputK`, `weightedK`, `outputK`, `minutes`; `briefChars` (first prompt length),
`briefPaths` (distinct paths in it), `briefRanges` (`path:line` or `path#symbol` in it); `searches` (Grep and Glob) and
`searchesBeforeEdit`; `bigReads`; `status`; `tools` (call counts). Later columns, empty in older rows:

| Column | Meaning |
|---|---|
| `startedAt`, `endedAt` | ISO timestamps of the agent's first and last entry |
| `firstEditCall`, `firstEditK`, `wKBeforeEdit` | the API call that made the first Edit/Write, the context at it (K), and the weightedK spent before it; empty when the agent never edited |
| `testCalls`, `testWK` | calls that write tests (Edit/Write on a path with `/tests/` or named `*_test.*`, `*.test.*`) or run them (`ctest`, `*_tests.exe`, `npm test`, `pytest`, ... or a command whose output is a test report), and their weightedK; a model call's cost is shared among the tools it called |
| `testRunsRed` | test runs whose output shows failures |
| `role` | `fix` when a subagent (reviewers, verifiers and researchers excepted) has a brief that mentions review findings (`finding`, `review fix`, `fixes from review`, `poprawk`); else empty |

## Transcript archive

Claude Code may delete transcripts (the desktop app removed 22 of 23 of one project's). The plugin's `Stop` hook
(`plugins/stack/hooks/archive-transcript.js`) copies the main transcript, `subagents/*.jsonl` and their `.meta.json` of
a project that has a contract (`.claude/project.md`) to `%USERPROFILE%\.claude\stack-archive\<project folder as under
.claude\projects>\`, in the same layout, after each turn and only when size or mtime changed. The script reads a
transcript from the archive when the original is missing; the original wins when both exist. Sessions from before the
hook, or from projects without a contract, are not archived.

## Known limits

- A resumed or forked session repeats its parent's history: such a row shows the parent's calls with `wallMin` near 0.
- `commits` count every commit in the time window, including those of parallel sessions in the same project.
- Rows recorded on 2026-10-21 for KamReimagined carry `kind` and `itemsDone` from that project's former process log.
