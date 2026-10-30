---
name: init
description: Set up the engine in a project, orient in it, or update its setup. Surveys what exists, asks only what the survey cannot show, writes the workflow contract (.claude/contract.md) and a marked block in the root CLAUDE.md, and migrates 2.x project notes and 1.x contracts. Use when a project has no contract, when the user asks to set the engine up, or to review or update the contract.
---

# Set up and orient

Orient in the project the way a new colleague would: look first, then talk. You plan and ask; the reading runs in
one `heliotrop:researcher` slice. Existing documents and agent configuration stay as they are unless the user approves
a change. Nothing is written until the user approves the whole draft (step 5).

1. Survey: one `heliotrop:researcher` slice. Brief: what the project is; build, test and lint commands; CI;
   conventions (commits, branches, code rules); agent configuration (CLAUDE.md, AGENTS.md, `.claude/`), separating
   project knowledge from generic workflow; the languages of documents, code and commits; one line per document
   (path, purpose); earlier setups: `.claude/project.md` (2.x notes), or a 1.x contract (`.claude/project.md` with
   key lines such as `context-budget:`, a `## Pipeline` or `## Definition of done` heading); an existing
   `.claude/contract.md` and `engine:begin` block.
2. Conversation: tell the user briefly what the survey found, then ask only what it cannot show, all questions in one
   message. Each has a recommendation and a one-line reason; "defaults OK" is a valid answer. Topics: the quality floor
   (below); tests, review and commits beyond the floor (who, when, push); language (conversation, documents, code);
   what the user decides beyond the engine's list; anything agents should always or never do.
3. Quality floor: state it in one sentence (changes are verified by running something, larger ones reviewed by
   another agent, changed behaviour tested, no check weakened) and ask whether any part should be lowered here.
   Record only an approved deviation, with its reason, under `## Quality`; the floor itself is never written.
4. Git check: is it a git repository, does it have a remote, is it GitHub with `gh auth status` ok. For each missing
   piece, one line on what it gives (history and undo; backup and sharing) and a question. Run `git init` or create
   the repository only after a yes.
5. Draft: three parts, shown together.
   - `.claude/contract.md` from `contract-template.md` (in this skill's directory): keep headings, order and
     comments as they are. Fill only what is not a default or cannot be seen in the repository; never write default
     values; `## Overrides` only for real deviations.
   - Root `CLAUDE.md` from `claude-block-template.md`: create the file if missing; write or update only between
     `<!-- engine:begin -->` and `<!-- engine:end -->`; never touch text outside the markers; leave out facts the rest
     of CLAUDE.md already states. The boundary paragraph stays word for word.
   - Documents: the standard set `docs/roadmap.md` (status, from `write-doc/templates/roadmap.md`) and
     `docs/sessions/` (handover notes, filled later by the handover skill from `write-doc/templates/handover-note.md`).
     Where the project already has an equivalent (a status document, a notes folder), map it instead of creating a
     duplicate, and say so. Compare it with the `write-doc` template for that document; if it differs, propose
     restructuring and list concretely what changes (sections added, renamed, moved; content that leaves and where
     it goes). If declined, it keeps its format and `## Documents` marks it "own format". A decision register stays
     optional: map it if the project keeps one, create it later when the work needs it. The resulting paths go into
     `## Documents` (status, handover notes, decisions if any).
6. Migration: the content of `.claude/project.md` (2.x notes or 1.x contract) goes into the draft: project facts,
   language, conventions and always/never rules into the block; workflow, checks, documents, user decisions and
   overrides (`context-budget:`, `main-context:`, `on-edit:`) into the contract; drop 1.x sections the contract does
   not have; drop default values.
7. A project that already has a contract: review it and the block against the survey and propose changes; never
   overwrite without approval.
8. Write after the user approves the draft: the contract in one pass, the block, and each missing or
   approved-for-restructuring document (a `heliotrop:doc-writer` slice per document). Then propose removing
   `.claude/project.md` if it existed; delete it only after approval.
9. Finish with a short plain summary: what was set up, what the user's part is (approve decisions and commits, keep
   the contract current), and when it acts: the hooks read the contract on every call, so they act at once; the
   orchestrator rules and the contract are injected into the context from the next session.
