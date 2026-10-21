---
name: init
description: Onboard a repository to the stack. Creates the project contract .claude/project.md from the template and reduces CLAUDE.md to a pointer. Use when a project has no contract or the user asks to set the stack up in a project.
---

# Create a project contract

1. `.claude/project.md` already exists: do not overwrite it; offer to review or update it instead.
2. Survey the repository through a `researcher` slice. Brief: find the build, test, lint and format commands; the
   documentation layout, document types and their templates; status or roadmap documents; conventions (commits,
   branches, code rules); existing agent configuration (CLAUDE.md, AGENTS.md, `.claude/agents`, `.claude/skills`,
   `.claude/settings*.json`, hooks), separating project knowledge from generic workflow. Return the findings grouped
   by the sections of `contract-template.md` (in this skill's directory).
3. Fill the template. Items that need judgment (pipeline, definition of done, user decisions) and anything the survey
   could not settle go to the user in one message, each with a proposal.
4. Existing agent configuration: list what moves into the contract, what the engine already covers (to be removed)
   and what stays project-specific. Show the list and wait for approval before deleting or moving anything.
5. Write `.claude/project.md`. Reduce the project's CLAUDE.md to a few facts about the project and the line
   `Project contract: .claude/project.md`.
