---
name: plan
description: Break a task into pipeline stages and delegatable slices with ready briefs, following the project contract. Use at the start of any task that needs more than one stage or subagent.
---

# Plan a task

1. Read `.claude/project.md` unless it is already in your context this session: Pipeline, Documents, Verification,
   Definition of done, User decisions, Agents. No contract (light mode): plan with the stages the task needs and the
   engine defaults, and mention `/heliotrop:init` at most once per session.
2. Stages: map the task onto the contract's pipeline and keep only the stages it needs. Skipping a gate the contract
   requires is a user decision.
3. User decisions: list the ones the task will need (the engine's rule plus the contract's `User decisions`). Ask them
   in one message before delegating work that depends on them.
4. Slices: cut each stage into slices with the slice-size rules (orchestrator rules, "Slice size"): one item per
   slice, estimate reading and tool calls, split only where slices read different files, merge slices that would read
   the same material, mark independent slices as parallel. Stages of different slices overlap too: the next
   implementation alongside the previous slice's review and tests, unless it needs their result.
5. Briefs: write one per slice with exactly the fields of the orchestrator rules' brief, in this order: `Agent`
   (`heliotrop:<agent>, model <model>`), `Goal`, `Read`, `Size`, `Constraints`, `Done when`, `Return`. `Read` names
   exact paths as `path#symbol`, or `path:start-end` where no symbol fits. When you do not know them, the first slice
   is a `heliotrop:researcher` slice that finds them, as a code map when the slice-size rules call for one.
6. Record the plan in the session's task list if the client has one, not as prose. The start report mentions it in
   one or two sentences.
