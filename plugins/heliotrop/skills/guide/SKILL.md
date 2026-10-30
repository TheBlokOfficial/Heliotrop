---
name: guide
description: Explain to the user in plain language how Heliotrop works in this project (session kinds, delegation to subagents, costs, context limits, documents), using the contract's actual values. Use when the user asks how Heliotrop works, what it costs or what to do, and at the end of init.
user-invocable: true
---

# Explain Heliotrop

Explain the points below to the user, in the contract's conversation language, for a reader new to AI agents: plain
words, no engine jargon, each term explained the first time. Values in `<>` come from `.claude/project.md`; without
a contract use the defaults shown and say that `/heliotrop:init` sets the project up. Length follows the contract's
`guidance:`: `explain` (default) at most ~25 lines; `brief` at most ~10 lines, one line per point. Skip points the
user did not ask about when they asked about one.

1. Roles: Claude manages the work here: it plans, decides and reports. Reading and writing files go to helpers
   (subagents), each starting with a fresh, small memory and returning a short result. This keeps the conversation
   small, so it stays cheaper and more precise.
2. Session kinds: the user just says what they want; Claude recognises the kind and never asks to choose one. `build`
   changes files, `design` works out a solution together, `talk` answers questions, `research` finds facts, `debug`
   finds the cause of a fault, `review` checks finished work.
3. Costs: every turn sends the whole conversation again, so each file read stays in the bill until the session ends.
   A helper costs ~10-15k tokens to start, so very small jobs are done directly.
4. Context limits: at <main-context notice, default 150k> tokens Claude says so and moves the remaining reading to
   helpers; at <hard point, default 200k> it hands over: it writes down what is done and what is left, and the work
   continues in a new conversation. Each helper stops and reports at <context-budget, default 100k>.
5. Prompt cache: repeated conversation text is billed cheaper while cached; the cache lasts 5 minutes or 1 hour.
   Claude often waits for helpers longer than 5 minutes, so the 1-hour setting usually costs less; Claude offers to
   switch it on and changes settings only with the user's approval.
6. Documents: the roadmap, <roadmap> (`roadmap:`, or a 1.0 `backlog:`; default docs/roadmap.md), is the user's main
   file: where the project stands, what is done, what comes next and what waits for the user's decision. Each session
   has a journal in <sessions>; lasting decisions go to <decisions>. A new session starts from the contract, the
   roadmap and the last session's next steps.
7. The user's part: say what you want; answer the questions Claude asks (only decisions that are yours: direction,
   risky or outward-facing steps); an unrelated side question waits until the end of the session unless you ask for it
   now; a new topic during the work gets three options: park it in the roadmap's Later
   section, start it in a new session, or switch to it here. Commands: `/heliotrop:end` closes a session,
   `/heliotrop:handover` moves the work to a new one, `/heliotrop:guide` shows this again.

Run at the end of `init`, close with one sentence: the roadmap (a link to <roadmap>) is the place to follow progress,
and Claude updates it at the end of every session.
