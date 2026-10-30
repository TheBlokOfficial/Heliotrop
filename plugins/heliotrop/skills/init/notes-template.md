<!-- Project notes. Free-form: keep the headings that help, drop the rest. The engine reads this file at the start of
every session, so keep it short: only what differs from the defaults or cannot be seen in the repository. -->

# Project notes

## Project
<!-- What the project is, in a few lines; where the main code and documents are. -->

## How we work
<!-- Tests (what needs them), review (which changes), commits and push (who, when), language of the conversation,
documents and code. -->

## Documents
<!-- Where status, decisions and handover notes live (paths); which of them to read at session start. -->

## Checks
<!-- Commands for build, test and lint. Optional line run after each file edit; {file} is the edited path. Delete the
line to keep the default (none). -->
on-edit: <command> {file}

## Always / never
<!-- Rules for Claude in this project, each one checkable: condition, then action. Include what only the user decides. -->

## Overrides (optional)
<!-- Defaults: context-budget 100k per helper, main-context 150k / 200k. Change a value in place; delete a line to
keep its default. -->
context-budget: 100k
main-context: 150k / 200k
