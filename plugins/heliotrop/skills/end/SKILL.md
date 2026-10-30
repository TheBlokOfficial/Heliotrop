---
name: end
description: Close a work session. Works off small leftover items, updates the project's status document and decision register if it keeps them, runs the project's end steps and gives a short report. Use when the session's work is done or the user ends the session.
---

# End a session

The contract (`.claude/contract.md`) is already in context. If the project has no contract, say the engine is not set
up in this project and stop. Where the contract names a path, a format or a step, follow it; where it is silent, use
the defaults below.

1. Leftovers: do the small items noted during the session (a fix that needs no user decision and touches no file an
   agent is writing, a document update) and answer the deferred side questions. What remains goes to the report and,
   if the project keeps a status document, into it.
2. Status document (the contract `## Documents` names it; skip it if the project keeps none): record what this
   session finished and what is next. It follows `write-doc/templates/roadmap.md` and is pruned at every update:
   finished items leave (one line under Done at most, detail to the changelog, decision register or handover note), as
   does anything that does not belong there; "Where we are" is rewritten; the document stays short. Exception: the
   contract `## Documents` marks it as kept in its own format; then keep that format.
3. Decision register (skip it if the project keeps none): add each lasting decision, meaning one that binds later work
   (architecture, interfaces, conventions, direction), with date, decision and reason, in the register's format. An
   ADR directory: one record per decision.
4. End steps: run the ones the contract `## Workflow` names. Commit only as `## Workflow` says and only after the
   user approves; pushing is the user's decision.
5. Report, short: done; decisions taken without the user; open; suggested next. When the status document changed, add
   its link and what changed in a few words.

`end` writes no session file.
