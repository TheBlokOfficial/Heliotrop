# Changelog

<!-- Changes visible to users of the engine, newest version first. Versions before 1.0.0 (the `stack` plugin, 0.1.0 to
0.8.0) are described in the git log. -->

## 1.2.0 — 2026-10-30

### Changed

- The engine points the user to the roadmap: `init` creates it in a project that has none, the guide at the end of
  `init` closes with a link to it as the place to follow progress, and the closing message of `end` and `handover`
  says in one line that it was updated.
- Triage: in a session with a set focus, an unrelated side question, side task or decision is acknowledged in one
  line and handled at the end of the session (Deferred), where it costs least; done at once only when it blocks the
  work, the user asks for it now, or it needs no reading.

## 1.1.0 — 2026-10-30

Design: [docs/design/heliotrop-1.1.md](docs/design/heliotrop-1.1.md). A 1.0 contract keeps working unchanged.

### Added

- Roadmap (`roadmap:`, default `docs/roadmap.md`), the user's command center and the project's only status document:
  where the project stands, what waits for the user, stages with ticked and open steps, later ideas, known problems.
  Engine template `skills/write-doc/templates/roadmap.md`. `plan` adds multi-session stages; `end` and `handover` tick
  finished steps and rewrite the state; triage parks new topics under Later.
- Contract `## Language` line `user documents:` (default: the conversation language) for documents written for the
  user, in 1.1 the roadmap. The language rule lives only in `write-doc` `## Language`.
- `build.bat` (wrapper for `build.ps1`) packs the plugin into `build/heliotrop-<version>.zip` (plugin at the zip root); the zip for 1.0.0 is
  committed.

### Changed

- The roadmap replaces the backlog; the `backlog` template is removed. A 1.0 contract's `backlog:` is read as
  `roadmap:`, and its file is converted to the roadmap form on the next `end` or `handover`; `init` migration renames
  the key.
- `doc-writer` takes the document language from `write-doc` `## Language` (1.0 looked for a per-entry language that
  the contract never had).
- Repository renamed to `TheBlokOfficial/Heliotrop`; local folder `Heliotrop`.

## 1.0.0 — 2026-10-30

Redesign of the `stack` plugin (0.8.0) as Heliotrop. Design: [docs/design/heliotrop-1.0.md](docs/design/heliotrop-1.0.md).

### Added

- Session kinds `build`, `design`, `talk`, `research`, `debug`, `review`, inferred from the request; the kind sets
  whether a session file is opened, what is delegated and which end-report sections are written.
- Triage of user messages during work (in focus, side question, new topic with its cost and three options).
- Explaining: consequences the user likely does not see are stated with a recommendation; contract field
  `guidance: explain | brief`.
- Main-context notices for the orchestrator at 150k and 200k tokens (hard point: hand over), then every further 50k;
  contract field `main-context:`. Reset after a compaction.
- Prompt-cache notice when the main session writes the cache with a 5-minute TTL; `init` checks the TTL settings.
- Standard document set: session journal, decision register `docs/decisions.md`, backlog `docs/backlog.md`; `end`
  promotes lasting decisions and updates the backlog.
- Engine document templates in `skills/write-doc/templates/` (`decisions`, `backlog`, `architecture`, `spec`, `adr`,
  `changelog`, `research-note`), used with `template: engine`.
- Light mode without a contract: triage, explaining and the context and cache notices.
- Skills `handover` (state, Next briefs and backlog for a fresh session) and `guide` (how Heliotrop works in this
  project).
- Hook smoke test `tests/hooks/test.js`.

### Changed

- Name: plugin and marketplace `heliotrop`, directory `plugins/heliotrop/`, namespace `heliotrop:`; archive
  `~/.claude/heliotrop-archive/`; hook messages start with `Heliotrop`. Reinstall steps in the README.
- Terminology: a session is one conversation with the user; a slice is one subagent's unit of work only.
- Contract template: `## Documents` replaces `## Document types`; `context-budget:` and `main-context:` in one
  `## Budgets` section (values accept `k`); `guidance:` under `## Language`; `type:` removed.
- `init` audits the existing documentation through researcher slices, maps it into `## Documents` and offers to
  migrate 0.x contracts; it ends with the `guide` skill.
- Token count for every budget: input plus cache creation plus cache read (output dropped).
- The subagent budget check also runs without a contract (default 100k).
- One brief format (`Agent`, `Goal`, `Read`, `Size`, `Constraints`, `Done when`, `Return`) in the rules, `plan` and the
  session file template; the session file is created at the start from the template, whose path the SessionStart hook
  appends to the rules.
- Budget rules only in the orchestrator rules' `## Budgets`; code maps and `Read` lines prefer `path#symbol`.

### Removed

- The `"shell"` field in `hooks.json`.
- Session metrics script, session doctor agent and `diagnostics/` (for now; they stay in the git history). The
  transcript archive keeps collecting data for their return.
