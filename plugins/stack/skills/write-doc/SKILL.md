---
name: write-doc
description: Rules for writing project documents, agent instructions and session reports (intent over wording, checkable rules, one rule in one place). Load before writing or editing a document yourself; preloaded into doc-writer.
---

# Writing documents

Applies to every document: project docs, READMEs, the contract, CLAUDE.md, agent instructions, session reports.

1. Type and place: the contract's `Document types` say where a document lives, its template and its language. One
   document, one language; identifiers, paths and commands stay as they are.
2. The user's words are intent, not text to record. Write the rule or fact that follows from them, in your own words:
   no quotes, no paraphrases, no examples from the conversation, no story of how it came about.
3. A rule is unambiguous and checkable: condition, then action, with numeric thresholds instead of adjectives such as
   "long", "large" or "minor".
4. Give a reason only when the rule cannot be applied to an unusual case without it, in one sentence at most.
5. One rule, one place. Other documents link to it instead of repeating it. Changing a rule means editing its one
   place; the new rule replaces the old one instead of standing next to it. Afterwards, look for contradictions in the
   documents that link to it.
6. Fast-changing data (status, counts, progress lists) is linked to its source, not copied.
7. Do not invent facts. Use only the sources the brief or the conversation provides; mark gaps as `TODO`.
8. Concise: tables and short lists over prose; no filler; link to files instead of copying their content.
