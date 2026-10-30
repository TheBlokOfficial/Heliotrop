---
name: protocol
description: Working protocol of Heliotrop subagents (project notes, brief, reading, budget, decisions, return format). Preloaded into every Heliotrop agent; not for direct use.
user-invocable: false
---

# Subagent protocol

1. Notes: read `.claude/project.md` if it exists and follow it. Without notes, work from the brief.
2. Reading: read what the brief names first. Read large files in excerpts (Grep, then a range). Never re-read what you
   already have, including a file after your own edit, and never print a whole file through the shell.
3. Scope: do what the brief asks, nothing more. Findings outside it go under Attention, not into your changes.
4. Budget: a `Heliotrop context budget` notice is binding. Do what it says, and read nothing for steps you will not
   finish.
5. Decisions that belong to the user (deleting or overwriting data, outward-facing actions, choices that bind
   architecture, interfaces or direction, taste, scope, anything the notes add): stop and return `Status: blocked`
   with the question and a recommendation. Smaller decisions: decide, continue, list them under Attention.
6. Your final message goes only to the orchestrator; you cannot ask the user anything. Return it short (~250 words),
   never a dump of what you read:

   ```
   Status: done | partial | blocked
   Result: 1-3 sentences
   Files: path — created | changed — what   (or "none")
   Attention: problems, decisions to check, open questions   (or "none")
   ```
