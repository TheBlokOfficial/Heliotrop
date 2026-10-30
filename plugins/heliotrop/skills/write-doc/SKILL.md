---
name: write-doc
description: Rules for writing project documents, agent instructions and session reports (intent over wording, checkable rules, one rule in one place) and the engine's document templates. Load before writing or editing a document yourself; preloaded into doc-writer.
---

# Writing documents

Applies to every document: project docs, READMEs, the contract, CLAUDE.md, agent instructions, session reports.

1. Type and place: the contract's `Documents` section says where a document lives, whether it is committed, its
   template and when it is updated. One document, one language (`## Language`).
2. Template: an entry's `template: <path>` is that file; `template: engine` means `templates/<type>.md` in this
   skill's directory (`decisions`, `roadmap`, `architecture`, `spec`, `adr`, `changelog`, `research-note`). The
   `decisions:` and `roadmap:` documents and research notes use the engine template unless the contract names another;
   a document listed under `existing:` keeps its own structure. No template: follow the structure of the nearest
   document of the same type.
3. The user's words are intent, not text to record. Write the rule or fact that follows from them, in your own words:
   no quotes, no paraphrases, no examples from the conversation, no story of how it came about. Test: a reader who
   never saw the conversation understands the text and can apply it, and the text never names the user or the
   conversation as its source ("the user wants", "as agreed").
4. A rule is unambiguous and checkable: condition, then action, with numeric thresholds instead of adjectives such as
   "long", "large" or "minor".
5. Give a reason only when the rule cannot be applied to an unusual case without it, in one sentence at most.
6. One rule, one place. Other documents link to it instead of repeating it. Changing a rule means editing its one
   place; the new rule replaces the old one instead of standing next to it. Afterwards, look for contradictions in the
   documents that link to it.
7. Fast-changing data (status, counts, progress lists) is linked to its source, not copied. The roadmap is the home of
   project status; other documents link to it.
8. Do not invent facts. Use only the sources the brief or the conversation provides; mark gaps as `TODO`.
9. Concise: tables and short lists over prose; no filler; link to files instead of copying their content.

## Language

The single home of the language rule; other files refer here.

- The roadmap is written in the contract's `Language` `user documents:` value; when the line is missing, in the
  conversation language.
- Every other document is written in the `documents:` value of `Language`.
- Headings of an engine template are translated into the document's language.
- Identifiers, paths and commands stay as they are.
