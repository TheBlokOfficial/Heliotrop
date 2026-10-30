---
name: handover
description: Hand work over to a fresh session. Writes the current state, Next briefs and roadmap updates so a new session continues without re-reading, and tells the user how to resume. Use at the main-context hard point (Heliotrop main context notice), when the user wants to continue in a new session, or when a new topic moves to its own session.
---

# Hand over

Two cases:

- A, move the work: this session's work continues in a new session (the main-context hard point, orchestrator rules
  "Main context", or the user's choice). Dispatch no new agents; wait for the running ones and take their results
  first.
- B, move a new topic: a topic raised during the work gets its own session (orchestrator rules, "Triage"); this
  session keeps its focus.

1. Read `.claude/project.md` unless it is already in your context: `Documents`, `Language`. No contract (light mode):
   write no files; first work off the Deferred list as in the `end` skill (step 2), then give the message of step 5 in
   chat, with enough detail (paths, next steps) for a new session to continue, mention `/heliotrop:init` once, and
   stop.
2. Case A, session file (create it from the `end` skill's `report-template.md` if missing; a `talk` session that took
   no lasting decision has none and gets none, its handover is the message of step 5 only), in the language that
   `write-doc` `## Language` sets for it:
   - Done: what is finished so far, each with its result and key files.
   - Open: what is unfinished and the point it reached.
   - Deferred: the items not yet worked off stay, side questions included (step 5).
   - State: branch, uncommitted changes, last check result.
   - Next sessions: the continuation as item 1 (topic, goal, files to read first).
   - Next briefs: one per remaining slice whose work is clear, as in the `end` skill (step 3).
   - Lasting decisions go to the decision register as in the `end` skill (step 4).
3. Case B: add the topic to Next sessions in the session file (topic, goal, files to read first) and, when its first
   slice is clear, a Next brief. Then continue the current focus.
4. Roadmap (contract `roadmap:`): case A, all of the `end` skill's step 5; case B, adds the topic as a step.
5. Message to the user, a few lines: done, what is left, how to resume: start a new session (a new conversation or
   `/clear`) and ask to continue the topic; it reads the contract, the roadmap and the session file's Next briefs.
   Answer the deferred side questions in it, or list the unanswered ones as still open (also in Next sessions).
   Give the session file's path, and add one line that the roadmap is updated, with its link and what changed there in
   a few words (no roadmap: omit the line).
