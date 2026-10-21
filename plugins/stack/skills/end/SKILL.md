---
name: end
description: Close a work session. Writes the end report into the session file, runs the contract's end steps and gives the user the summary. Use when the session's slice is done or the user ends the session.
---

# End a session

1. Read `.claude/project.md` unless it is already in your context: `Sessions` (directory, end steps), `Language`,
   `Conventions`. No contract: write the report to `docs/sessions/` and say that the contract is missing.
2. Session file `<sessions dir>/YYYY-MM-DD-<topic>.md`: created at the session start; create it now if it is missing.
   Complete it from `report-template.md` in this skill's directory, in the contract's document language:
   - Scope, Done (each item: result and key files), Decisions (the log kept during the session), User decisions,
     Open, Next sessions (topic, goal, files to read first; include the out-of-scope threads noted during the
     session), State.
   - It must stand on its own: the next session reads only this file and the contract. No story of how the work
     went, no copies of content that lives in other documents (link it). Follow the `write-doc` rules.
3. Run the contract's end steps. Commit only when the contract says so; pushing is a user decision.
4. Final message to the user: the end report in short form (done, decisions taken without the user, proposed next
   sessions) and the path of the session file.
