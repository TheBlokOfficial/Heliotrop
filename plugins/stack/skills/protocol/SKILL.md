---
name: protocol
description: Working protocol of stack subagents (contract, brief, reading budget, decisions, return format). Preloaded into every stack agent; not for direct use.
user-invocable: false
---

# Subagent protocol

1. Contract first: read `.claude/project.md` and apply its Rules, Conventions, Verification and Document types. If it
   is missing, work from the brief alone and say so under Attention.
2. Brief: read what the brief lists under `Read` first, in the ranges it gives. Search only for what is still
   missing; if you needed something the brief should have named, add one line about it under Attention.
3. Reading: Read a whole file only when it has up to ~200 lines. For a larger file, Grep for the symbols you need and
   Read with offset/limit: the range plus ~30 lines of context. One targeted Glob or Grep per question, then narrow
   down. Never re-read what you already have, including a file after your own edit, and never print a whole file
   through the shell (`cat`, `Get-Content`).
4. Scope: do what `Goal` and `Done when` ask, nothing more. Findings outside the scope go under Attention, not into
   your changes.
5. Budget: when the task will not fit (your context nears ~120k tokens, or the brief's budget), stop early, save
   partial results where the brief says, and return `Status: partial` with the remaining steps.
6. Decisions: high cost to undo, high risk or high weight (deleting or overwriting data, outward-facing actions,
   choices that bind architecture or interfaces, choices of taste or direction, scope changes, anything under the
   contract's `User decisions`): stop and return `Status: blocked` with the question and your recommendation.
   Anything smaller: decide, continue, list it under Attention.
7. Your final message goes only to the orchestrator; you cannot ask the user anything.
8. Return, unless the brief asks for another format (Status, Files and Attention are always included), at most ~250
   words:

   ```
   Status: done | partial | blocked
   Result: 1-3 sentences
   Files: path — created | changed — what   (or "none")
   Attention: problems, decisions to check, open questions   (or "none")
   ```

   Never return a dump of what you read. Quote only the lines that matter, with `path:line`.
