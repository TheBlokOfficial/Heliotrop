---
name: init
description: Set up Heliotrop in a repository, migrate a project from the older stack engine (0.x), or review its contract. Detects old contracts, session reports and plugin installs, audits the documentation through researcher slices, runs a short setup Q&A with recommended answers, writes .claude/project.md with every document mapped, checks the prompt-cache TTL and explains how Heliotrop works. Use when a project has no contract or an old one, or the user asks to set Heliotrop up or review the contract.
---

# Set up a project

The contract is the project's start document: after this skill it says what every document is, where it lives, what
it is for, when it is updated and by whom. You plan, judge and ask; the reading runs in `heliotrop:researcher` slices.

1. Detect an older engine (cheap checks, no slice):
   - contract `.claude/project.md` with a `# stack` heading, a `type:` line, a `## Document types` section, or
     `context-budget:` outside `## Budgets`;
   - old plugin: Grep `stack@agent-stack` in `~/.claude/plugins/installed_plugins.json` and in `enabledPlugins` of
     `~/.claude/settings.json`;
   - session reports without a `kind:` line in the sessions directory (old contract `dir:`, default `docs/sessions/`):
     a sign only together with one of the two above.
   An old contract or plugin found: migrate (step 2). Only such reports: offer the migration and start it after the
   user's yes. An existing current contract: never overwrite it; offer a review (steps 3-8 against it).
2. Migration, prepared now and written in step 8:
   - Contract: drop `type:`; `## Document types` and the sessions `dir:` become `## Documents`; budget lines move to
     `## Budgets` with their values as they are (integers and `100k` both valid); add `main-context:` and `guidance:`
     with their defaults (step 6). Project, Pipeline, Verification, Definition of done, Rules, User decisions, Agents and Conventions
     stay unchanged unless a Q&A answer changes them.
   - Old session reports stay in place. From the newest one, Open and Next sessions go to the backlog and lasting
     decisions to the decision register (`end` skill, steps 4-5).
   - Old plugin still installed: tell the user to run `claude plugin uninstall stack@agent-stack`, since both engines'
     hooks otherwise run twice.
3. Survey: one `heliotrop:researcher` slice. Brief: the build, test, lint and format commands; CI configuration;
   conventions (commits, branches, code rules); existing agent configuration (CLAUDE.md, AGENTS.md, `.claude/agents`,
   `.claude/skills`, `.claude/settings*.json`, hooks), separating project knowledge from generic workflow; the
   languages of documents, code and commits; an inventory of every documentation file (path, size in lines) grouped
   by area: roadmap or status, ADRs or decisions, architecture, specs, changelog, session logs, READMEs, CLAUDE.md and
   agent instructions, other. Return the findings grouped by the sections of `contract-template.md` (in this skill's
   directory), plus the inventory.
4. Audit: one `heliotrop:researcher` slice per area that has documents, in parallel; never read the documents
   yourself. Each brief names the area's paths, passes the full inventory (for links and overlaps) and asks for:
   - per document, one line: `path — purpose — structure — when updated — by whom`, with the evidence for the last
     two (dates, changelog entries, authors named in the text), `TODO` where there is none;
   - problems, each with `path:line` and a proposed fix: duplicates, broken links, stale status (a status or date
     older than the work it describes), overlaps with documents of other areas.
   Fill dates left as `TODO` with one shell command printing each document's last commit date
   (`git log -1 --format=%as -- <path>`).
5. Map the audit into `## Documents`: an existing roadmap or status list becomes `backlog:`, an ADR directory
   `decisions:`, a session-log directory `sessions:`, otherwise the template's defaults; types written again go to
   `optional:` with their template (their own, or `engine`); every other document gets one `existing:` line. Check:
   each inventory path appears exactly once.
6. Set without asking: languages (conversation = the language the user writes in; documents and code = what the
   repository uses, else English), `guidance: explain`, `main-context: 150k / 200k`. Git check: is the project a git
   repository; has it a remote; is it GitHub, with `gh` installed and authenticated (`gh auth status`). For each
   missing piece, one line on what it gives (git: history and undo; a remote: backup and sharing) and the question
   whether to set it up; run `git init` or create the GitHub repository only after the user's yes.
   Setup Q&A: besides the git check, ask only the table's questions, and of those only what the survey cannot show;
   where the repo shows the answer (tests in CI, a commit style),
   state it as the proposal instead of a question. Options with the recommendation first and marked, plus one line
   of why (`guidance: explain`). The user may answer all at once ("defaults OK").

   | Question | Options | Goes to |
   |---|---|---|
   | Tests | standard: every behaviour change / critical only: core logic, data, security / thorough: also edge cases and error paths | Definition of done, Pipeline |
   | Review | every code change / changes over ~100 lines only / none | Pipeline |
   | Commits (no git: skip; no remote: no push step) | orchestrator after the user's approval / orchestrator when a slice is done / the user | Conventions `commits:`, User decisions |
   | Optional documents | architecture, spec, ADR, changelog (any) | Documents `optional:` |

7. In the same message, after the Q&A, as proposals the same "defaults OK" reply accepts, not as open questions: the
   Pipeline's stages, derived from the tests and review answers; `when updated` and `by whom` still `TODO`;
   documentation problems with their fixes; the agent configuration list (moves into the contract / covered by the
   engine, to be removed / stays); for a migration, the contract diff and the backlog and register entries from step 2.
8. After the user approves: write `.claude/project.md` from the template, or apply the approved diff; write the
   migrated backlog and register entries; reduce CLAUDE.md to a few facts about the project and the line
   `Project contract: .claude/project.md`. Delete, move, merge or rewrite documents and agent configuration only as
   approved; restructuring runs as `heliotrop:doc-writer` slices, one document per slice.
9. Prompt cache check (orchestrator rules, "Prompt cache"): with one shell command print the environment variables
   `FORCE_PROMPT_CACHING_5M`, `CLAUDE_CODE_PROMPT_CACHE_TTL` and `ENABLE_PROMPT_CACHING_1H`; Grep `~/.claude/settings.json`
   for those names and `promptCacheTtl`. Report each value found and whether the main session ends on a 1-hour TTL
   (`FORCE_PROMPT_CACHING_5M` set: no; `promptCacheTtl` or the variables set to 1h: yes; nothing set: it depends on
   the billing, as that section says). Not on 1h: offer to add `"promptCacheTtl": "1h"` to `~/.claude/settings.json`;
   write it only after the user approves.
10. Finish by running the `heliotrop:guide` skill.
