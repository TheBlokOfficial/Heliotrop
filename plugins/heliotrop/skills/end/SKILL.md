---
name: end
description: Close a work session. Completes the session file for the session's kind, promotes lasting decisions to the decision register, updates the roadmap, runs the contract's end steps and gives the user the summary. Use when the session's work is done or the user ends the session.
---

# End a session

1. Read `.claude/project.md` unless it is already in your context: `Sessions` (end steps), `Documents`, `Language`,
   `Conventions`. No contract (light mode): write no files; work off the Deferred list (step 2; the rest goes
   to the summary's proposed next sessions), then give the summary of step 7 in chat, with the sections of step 3 for
   the session's kind, mention `/heliotrop:init` once, and stop.
2. Deferred list: do the small items (a fix of up to ~10 lines that needs no user decision and touches no file an
   agent is writing, a document update) and answer the deferred side questions, for the closing message (step 7).
   The rest goes to Next sessions and to the roadmap (step 5).
3. Session file `<sessions>/YYYY-MM-DD-<topic>.md` (contract `Documents`, `sessions:`): created at the session start;
   create it now from `report-template.md` in this skill's directory if it is missing. A `talk` session that took no
   lasting decision has none and gets none. Complete it with the sections of the session's kind (its `kind:` line),
   omit the others, in the language that `write-doc` `## Language` sets for it:

   | Kind | Sections |
   |---|---|
   | `talk` | Scope, Decisions, User decisions, Open |
   | `design`, `research` | Scope, Done, Decisions, User decisions, Open, Next sessions |
   | `build`, `debug`, `review` | Scope, Done, Decisions, User decisions, Open, Next sessions, Next briefs, State |

   - State only when files changed in this session. Next briefs also in a `design` or `research` session when the
     next session's first slices are clear.
   - Done: each item with its result and key files. Next sessions: topic, goal, files to read first; include the
     out-of-scope threads and the leftover deferred items.
   - Next briefs: ready briefs for the first one or two slices of the next session, with the fields of the orchestrator
     rules' brief (`Agent`, `Goal`, `Read`, `Size`, `Constraints`, `Done when`, `Return`), `Agent` as
     `heliotrop:<agent>, model <model>`, and `Read` as `path#symbol`, or `path:start-end` where no symbol fits, from
     what this session learned. Skip them when the next session's work is not yet clear.
   - It stands on its own: the next session reads only this file, the contract and the roadmap. No story of how the
     work went, no copies of content that lives in other documents (link it). Follow the `write-doc` rules.
4. Decision register (contract `decisions:`): add each lasting decision from Decisions and User decisions, meaning one
   that binds later sessions (architecture, interfaces, conventions, direction, a rule), with date, decision, reason
   and this session file as source. Missing register: create it from the `write-doc` template `decisions.md`. An ADR
   directory: one record per decision, in that directory's format.
5. Roadmap (contract `roadmap:`; language per `write-doc` `## Language`):
   - Tick the steps this session finished (`- [x]`) with the date and a link to the session file; never delete a step.
   - Add the leftover deferred items and the Next sessions topics as steps of the stage they belong to, or of Later.
     The session file's Open items that are problems go to Known problems.
   - Waiting for you holds only what still waits on the user: the session's open questions and the Open items that
     only the user can act on, not its User decisions (already made). Remove the lines now done or settled.
   - Rewrite Where we are. Collapse a finished stage to its heading line.
   - Missing roadmap: create it from the `write-doc` template `roadmap.md`. A file with the 1.0 backlog sections
     (Next / Later / Problems): convert it to the roadmap form in this update (Problems to Known problems). Any other
     format is kept.
6. Run the contract's end steps. Commit only when the contract says so; pushing is a user decision.
7. Final message to the user: the summary in short form (done, decisions taken without the user, proposed next
   sessions), the answers to the deferred side questions (step 2), the path of the session file and one line that the
   roadmap is updated, with its link and what changed there in a few words (no roadmap: omit the line).
