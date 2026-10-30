---
name: guide
description: Explain to the user in plain language how Heliotrop works in this project (roles, costs, context limits, documents, the user's part). Use when the user asks how Heliotrop works, what it costs or what to do, and at the end of init.
user-invocable: true
---

# Explain Heliotrop

Explain in the conversation language (the project notes' language, else the user's), for a reader new to AI agents:
plain words, no engine jargon. Use the notes' overrides for the numbers below. Run from `init`, keep to a few lines per
point; when the user asked about one point, answer only that.

1. Roles: Claude manages the work: it plans, decides and reports. Helpers read and write files, each starting with a fresh, small memory and returning a short result, so the conversation stays cheap and precise.
2. Costs: every turn sends the whole conversation again, so what has been read stays in the bill; starting a helper costs about 10-15k tokens, so tiny jobs are done directly. The prompt cache bills repeated text cheaper while it lasts (5 minutes or 1 hour).
3. Limits: at 150k tokens Claude hands the remaining reading to helpers; at 200k it stops, writes down what is done and what is left, and the work continues in a new conversation. A helper wraps up at 100k.
4. Documents: the project's own documents stay as they are; Claude writes a handover note only when work continues in another session.
5. Your part: say what you want and answer the decisions that are yours (direction, risky or outward-facing steps). Changing topic mid-work is costly because the current conversation is paid on every turn; Claude will say so and suggest parking the topic or starting a new session.
6. Commands: `/heliotrop:init` sets up or reviews the project notes, `/heliotrop:end` closes a session, `/heliotrop:handover` moves the work to a new session, `/heliotrop:guide` shows this again.
