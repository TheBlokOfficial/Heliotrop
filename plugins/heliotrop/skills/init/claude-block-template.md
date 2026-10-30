<!-- engine:begin -->
## Project
<!-- What the project is, in a few lines; layout: where the main code and documents are. -->

## Language
<!-- Language of the conversation, of documents, of code and commits. -->

## Conventions
<!-- Commits, branches, code rules. -->

## Always / never
<!-- Rules for every agent in this project, each one checkable: condition, then action. -->

## Engine boundary
This project is orchestrated by an engine installed as a Claude Code plugin (heliotrop). The engine is tooling, not this project: never use its name in this project's files, titles or documents. Do not edit the engine's own files (its plugin directory): an agent working here has none of the engine's design notes or decisions, so such edits break it. Report the problem or proposal to the user instead. Workflow contract: `.claude/contract.md`.
<!-- engine:end -->
