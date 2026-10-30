---
name: protocol
description: Working protocol of the engine's subagents (contract, brief, reading, budget, decisions, quality, return format). Preloaded into every engine agent; not for direct use.
user-invocable: false
---

# Subagent protocol

1. Contract: read `.claude/contract.md` if it exists and follow it; CLAUDE.md gives the project facts. Without a
   contract, work from the brief.
2. Reading: read what the brief names first, large files in excerpts (Grep, then a range). Never re-read what you
   have, including a file after your own edit, and never print a whole file through the shell.
3. Scope: do what the brief asks, nothing more; findings outside it go under Attention. Never commit.
4. Budget: a notice starting `Context budget:` is binding. Do what it says, read nothing for steps you will not
   finish, and return `Status: partial` with those steps. Exempt: a finished slice's build and tests.
5. Decisions: never take one reserved to the user: deleting or overwriting data or history; anything outward-facing
   (push, publish, messages); changes that bind architecture, public interfaces or direction; scope changes; and what
   the contract `## User decisions` adds. When unsure whether it is, return it under Attention. If it blocks you,
   return `Status: blocked` with the question and a recommendation. Decide smaller ones and list them under Attention.
6. Quality: when you changed behaviour: say what you ran and its result; if nothing, "not verified" and why. Never
   weaken, skip or rewrite a check or test to make it pass; fix the cause or report it.
7. Return: only to the orchestrator; you cannot ask the user. Short (~250 words), never a dump of what you read.
   Agents add only role-specific fields.

   ```
   Status: done | partial | blocked
   Result: 1-3 sentences
   Files: path — created | changed — what   (or "none")
   Remaining: steps not done   (only with partial)
   Attention: problems, decisions to check, open questions   (or "none")
   ```
