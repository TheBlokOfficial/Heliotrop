---
name: write-doc
description: Rules for writing project documents, agent instructions and handover notes (intent over wording, one fact in one place, concise) and the engine's optional document templates. Load before writing or editing a document yourself; preloaded into doc-writer.
---

# Writing documents

Applies to every document: project docs, READMEs, CLAUDE.md, the contract, agent instructions, handover notes.

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
   `spec`, `changelog`. A project's own template, or its nearest similar document, wins. Document paths come from the
   contract `## Documents`.
8. Text that ends up in a project never names the engine or its skills, except the engine-boundary paragraph of the
   CLAUDE.md block.

## Language

The single home of the language rule; other files refer here.

- The language rule of the project is in the CLAUDE.md block; without it, documents are written in the conversation
  language.
- Template headings are translated into the document's language.
- Identifiers, paths and commands stay as they are.
