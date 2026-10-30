---
name: handover
description: Hand work over to a fresh session. Does everything `end` does, writes a handover note with the state and next steps, and tells the user how to resume. Use at the main-context hard point, when the user wants to continue in a new session, or when a new topic moves to its own session.
---

# Hand over

If the project has no contract (`.claude/contract.md`), say the engine is not set up in this project and stop.

Two uses:

- The work continues in a new session (the main-context hard point, or the user's choice). Dispatch no new agents;
  collect the running ones and take their results first.
- A new topic moves to its own session. Note it for the next session (in the handover note, or the status document if
  the project keeps one) and keep the current focus.

1. Do everything the `end` skill does (leftovers, status document with its roadmap pruning, decision register, end
   steps).
2. Write the handover note from `write-doc/templates/handover-note.md` at `docs/sessions/YYYY-MM-DD-<topic>.md`, or
   where the contract `## Documents` says (language: `write-doc` `## Language`). Skip it only when nothing is left to
   continue. It stands on its own and links to content instead of copying it.
3. Tell the user, in a few lines: what is done, what is left, and how to resume. Start a new conversation (or
   `/clear`) and ask to continue the topic; the new session reads the contract, the status document and the
   handover note's next steps. Give the note's path, and answer the deferred side questions or list the unanswered
   ones as open. When the status document changed, add its link and what changed.
