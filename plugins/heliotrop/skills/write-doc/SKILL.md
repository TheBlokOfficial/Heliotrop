---
name: write-doc
description: Rules for writing project documents, agent instructions and handover notes (intent over wording, one fact in one place, concise) and the engine's optional document templates. Load before writing or editing a document yourself; preloaded into doc-writer.
---

# Writing documents

Applies to every document: project docs, READMEs, CLAUDE.md, project notes, agent instructions, handover notes.

1. Intent over wording. The user's words are intent, not text to record. Write the rule or fact that follows from them
   in your own words: no quotes, no story of the conversation. The text never names the user or the conversation as
   its source ("the user wants", "as agreed").
2. One fact in one place. Link instead of copying; changing a rule means editing its one place, and the new rule
   replaces the old one.
3. Be concrete: say what to do and when. Use a number only where it matters.
4. Concise: short lists and tables over prose, no filler.
5. No invented facts: use only the sources you were given and mark gaps as `TODO`.
6. An existing document keeps its format.
7. Templates are optional suggestions in `templates/` of this skill: `roadmap`, `decisions`, `handover-note`, `adr`,
   `spec`, `changelog`. A project's own template, or its nearest similar document, wins.

## Language

The single home of the language rule; other files refer here.

- The status document for the user (the roadmap) is written in the conversation language unless the project notes say
  otherwise.
- Every other document is written in the document language of the project notes, else in the repository's language.
- Template headings are translated into the document's language.
- Identifiers, paths and commands stay as they are.
