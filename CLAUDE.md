<!-- engine:begin -->
## Project
A Claude Code plugin: a project-agnostic orchestrator workflow. Layout:

- `plugins/heliotrop/`: the engine (orchestrator rules, skills, agents, hooks, templates).
- `tests/hooks/`: hook smoke test on synthetic input.
- `docs/`, `README.md`, `CHANGELOG.md`: documents, listed in `.claude/contract.md` `## Documents`.

## Language
Conversation: Polish. The roadmap: Polish. Other documents: English. Code and commits: English.

## Conventions
- Commits: Conventional Commits, `<type>(heliotrop): <summary> (<version>)` when the version changes.
- Branch: `main`.

## Always / never
- When a change includes a move or rename, do it last, after the edits inside the moved files.
- After a change, check that no old name or stale reference remains in the files it touched.

## Engine boundary
This project is orchestrated by an engine installed as a Claude Code plugin (heliotrop). The engine is tooling, not this project: never use its name in this project's files, titles or documents. Do not edit the engine's own files (its plugin directory): an agent working here has none of the engine's design notes or decisions, so such edits break it. Report the problem or proposal to the user instead. Workflow contract: `.claude/contract.md`.

This repository is the engine's source, so editing `plugins/heliotrop/` and using the engine's name here is the normal work.
<!-- engine:end -->
