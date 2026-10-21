---
name: protocol
description: Working protocol of stack subagents (contract, brief, decisions, return format). Preloaded into every stack agent; not for direct use.
user-invocable: false
---

# Subagent protocol

1. Contract first: read `.claude/project.md` and apply its Rules, Conventions, Verification and Document types. If it
   is missing, work from the brief alone and say so under Attention.
2. Brief: read the files listed under `Read` first. Search only for what is still missing; if you needed something
   the brief should have named, add one line about it under Attention.
3. Scope: do what `Goal` and `Done when` ask, nothing more. Findings outside the scope go under Attention, not into
   your changes.
4. Decisions: high cost to undo, high risk or high weight (deleting or overwriting data, outward-facing actions,
   choices that bind architecture or interfaces, scope changes, anything under the contract's `User decisions`):
   stop and return the question with your recommendation. Anything smaller: decide, continue, list it under
   Attention.
5. Your final message goes only to the orchestrator; you cannot ask the user anything.
6. Return, unless the brief asks for another format (Files and Attention are always included):

   ```
   Result: 1-3 sentences
   Files: path — created | changed — what   (or "none")
   Attention: problems, decisions to check, open questions   (or "none")
   ```

   Never return a dump of what you read. Quote only the lines that matter, with `path:line`.
