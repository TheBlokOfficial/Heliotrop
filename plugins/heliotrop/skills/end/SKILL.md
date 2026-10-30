---
name: end
description: Close a work session. Works off small leftover items, updates the project's status document and decision register if it keeps them, runs the project's end steps and gives a short report. Use when the session's work is done or the user ends the session.
---

# End a session

The project notes (`.claude/project.md`) are already in context. Where they name a path, a format or a step, follow
them; where they are silent, use the defaults below.

1. Leftovers: do the small items noted during the session (a fix that needs no user decision and touches no file an
   agent is writing, a document update) and answer the deferred side questions. What remains goes to the report and,
   if the project keeps a status document, into it.
2. Status document (the roadmap or whatever the notes name; skip it if the project keeps none): record what this
   session finished and what is next, in the document's own format. For the engine roadmap
   (`write-doc/templates/roadmap.md`): tick finished steps with the date and a link, never delete a step; add new
   steps; remove what no longer waits on the user; rewrite "Where we are".
3. Decision register (skip it if the project keeps none): add each lasting decision, meaning one that binds later work
   (architecture, interfaces, conventions, direction), with date, decision and reason, in the register's format. An
   ADR directory: one record per decision.
4. End steps: run the ones the notes name. Commit only if the notes say so; pushing is the user's decision.
5. Report, short: done; decisions taken without the user; open; suggested next. When the status document changed, add
   its link and what changed in a few words.

`end` writes no session file. A project without notes gets the report in chat only, with one mention of
`/heliotrop:init`.
