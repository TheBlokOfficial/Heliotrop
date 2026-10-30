# Project contract

<!-- Read by the Heliotrop engine at the start of every session and by every heliotrop agent. Keep it short: facts and
pointers, not essays. Keep these headings and the `key:` lines (hooks read them); write the content in the `documents:`
language of this contract's `## Language` section. Delete placeholder lines that do not apply. -->

## Project

<1-3 sentences: what the project is and where its main parts live>

## Language

- conversation: <language for talking to the user>
- user documents: <language of documents written for the user to work from: the roadmap; default: see `write-doc`
  `## Language`>
- documents: <language of every other document: session reports, decisions, architecture, specs, research notes>
- code, commits: <language>
- guidance: explain  <!-- explain (default): consequences, terms and short reasons; change to brief for consequences
  only -->


## Sessions

- start reading: <besides the contract, the roadmap and the newest session file's Next briefs, e.g. a section of a
  status document; or "none">
- end steps: <e.g. commit; or "none">

## Documents

<!-- What lives where (orchestrator rules, "Documents"). Standard lines: `<path>, committed | temporary`. An existing
ADR directory replaces the decision register; an existing roadmap or status list becomes `roadmap:`; both keep
their own format. -->

- sessions: docs/sessions/, committed
- decisions: docs/decisions.md, committed
- roadmap: docs/roadmap.md, committed
- research: docs/research/, <committed | temporary>
- reviews: docs/reviews/, <committed | temporary>
- code-maps: docs/code-maps/, temporary
- optional: <type>: <path pattern>, template: engine | <path> | none, when: <created or updated when>
  <!-- engine types: architecture, spec, adr, changelog (write-doc skill, templates/) -->
- existing:
  - <path> — <purpose> — <when updated> — <by whom: user | orchestrator | doc-writer | ...>

## Pipeline

<stages in order, the agent for each stage, and the gates that cannot be skipped; when code review and tests run in
separate review sessions: what an implementation slice still checks and tests, and where the review marker is kept>

## Verification

check: <full verification command(s), including environment setup>
on-edit: <optional fast command the Heliotrop hook runs after every Edit/Write; {file} is the edited path; or "none">
checklist: <path to a checklist, when verification is not automatic; or "none">

## Definition of done

- <criteria every finished slice meets>

## Rules

<project rules every agent follows, or pointers to the files that hold them>

## User decisions

<project-specific decisions that always go to the user, and engine defaults this project hands to the orchestrator
(for example "push and merge need no question")>

## Budgets

<!-- Read by the context-budget hook; values in tokens, `k` = ×1000 (orchestrator rules, "Budgets"). Defaults shown;
delete a line to keep its default. -->

context-budget: 100k
main-context: 150k / 200k

## Agents

<optional: model overrides per agent or kind of slice (e.g. "researcher: sonnet", "implementer for fixes: sonnet"),
project agents and when to use them; or "none">

## Conventions

- commits: <style>; committed by: <orchestrator after the user's approval | orchestrator when a slice is done | the
  user>
- branches: <policy>
