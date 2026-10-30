---
name: init
description: Set up Heliotrop in a project, orient in it, or update its project notes. Surveys what exists, asks only what the survey cannot show, writes short notes in .claude/project.md and can rewrite a Heliotrop 1.x contract as notes. Use when a project has no notes, when the user asks to set Heliotrop up, or to review or simplify the notes or a 1.x contract.
---

# Set up and orient

Orient in the project the way a new colleague would: look first, then talk. You plan and ask; the reading runs in
one `heliotrop:researcher` slice. Existing documents and agent configuration stay as they are unless the user approves
a change.

1. Survey: one `heliotrop:researcher` slice. Brief: what the project is; build, test and lint commands; CI;
   conventions (commits, branches, code rules); agent configuration (CLAUDE.md, AGENTS.md, `.claude/`), separating
   project knowledge from generic workflow; the languages of documents, code and commits; one line per document
   (path, purpose); signs of a 1.x Heliotrop contract (`.claude/project.md` with a `# Project contract` heading, a
   `## Budgets` section, or `guidance:` / `user documents:` / `existing:` lines).
2. Existing notes (`.claude/project.md` without those signs): never overwrite; offer a review against the survey.
3. Conversation: tell the user briefly what the survey found, then ask only what it cannot show, all questions in one
   message. Each has a recommendation and a one-line reason; "defaults OK" is a valid answer. Topics: tests (what
   needs them), review (which changes), commits and push (who, when), language (conversation, documents), how status
   is tracked (offer a roadmap from the `write-doc` templates only when nothing tracks it), anything Claude should
   always or never do.
4. Git check: is it a git repository, does it have a remote, is it GitHub with `gh auth status` ok. For each missing
   piece, one line on what it gives (history and undo; backup and sharing) and a question. Run `git init` or create
   the repository only after a yes.
5. Write the notes at `.claude/project.md` from `notes-template.md` (in this skill's directory): short, only what
   differs from the defaults or cannot be seen in the repository. Add one line `Project notes: .claude/project.md` to
   CLAUDE.md; never shorten CLAUDE.md without approval.
6. Documents: suggest one only for a real gap (status lost between sessions, decisions that keep being re-discussed).
   After approval a `heliotrop:doc-writer` slice creates it, one document per slice.
7. A 1.x contract: offer once to rewrite it as notes, keeping its content (pipeline, rules, user decisions,
   conventions, the override lines `context-budget:`, `main-context:`, `on-edit:`) and dropping the contract sections
   the notes do not need. Apply it only after approval. Existing documents stay untouched.
8. Finish by running the `heliotrop:guide` skill in its short form.
