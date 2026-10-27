# Project contract

<!-- Read by the stack engine at the start of every session and by every stack agent. Keep it short: facts and
pointers, not essays. Keep these headings; write the content in the project's language. Delete placeholder lines
that do not apply. -->

## Project

type: code | docs | mixed
<1-3 sentences: what the project is and where its main parts live>

## Language

- conversation: <language for talking to the user>
- documents: <language of project documents and session reports>
- code, commits: <language>

## Sessions

- dir: docs/sessions/
- start reading: <besides the newest session report, e.g. a section of a status document; or "none">
- end steps: <e.g. update the status document, commit; or "none">

## Document types

- <type>: <path pattern>, template: <path or "none">, when: <when it is created or updated>

## Pipeline

<stages in order, the agent for each stage, and the gates that cannot be skipped; when code review and tests run in
separate review sessions: what an implementation slice still checks and tests, and where the review marker is kept>

## Verification

check: <full verification command(s), including environment setup>
on-edit: <optional fast command the stack hook runs after every Edit/Write; {file} is the edited path; or "none">
checklist: <path to a checklist, when verification is not automatic; or "none">

## Definition of done

- <criteria every finished slice meets>

## Rules

<project rules every agent follows, or pointers to the files that hold them>

## User decisions

<project-specific decisions that always go to the user, and engine defaults this project hands to the orchestrator
(for example "push and merge need no question")>

## Agents

<optional: model overrides per agent or kind of slice (e.g. "researcher: sonnet", "implementer for fixes: sonnet"),
project agents and when to use them; or "none">

<optional line read by the context-budget hook; default ~100k tokens, omit to keep it:>
context-budget: <tokens>

## Conventions

- commits: <style>
- branches: <policy>
