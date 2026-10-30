# <YYYY-MM-DD>: <topic>

kind: <build | design | talk | research | debug | review>

<!-- Session file. Created at the session start with the title, `kind:`, Scope, an empty Decisions and an empty
Deferred; the other sections are added by `handover` or `end`, only those the session kind uses (`end` skill). Written
in the language set by `write-doc` `## Language`; translate the headings. The next session reads only this file, the
contract and the roadmap, so it must stand on its own. Link to other documents instead of copying them. -->

## Scope

<the session's focus; what is explicitly out of scope>

## Done

- <task>: <result>; <key files>

## Decisions

<!-- Appended during the session: decisions taken without the user (`decision — reason`), deviations
(`deviation: rule — reason`), focus switches and kind shifts (`kind: <old> → <new> — <reason>`). -->

- <decision> — <reason>

## Deferred

<!-- Appended during the session: what came up and was not needed for the work at that point. Worked off before the
end report; what is left goes to Next sessions and the roadmap. Remove the section once it is empty. -->

- <item>

## User decisions

- <decision the user made in this session>

## Open

- <unfinished items, known problems, failing checks; or "none">

## Next sessions

1. **<topic>**: <goal>. Start reading: <files>.

## Next briefs

<!-- Ready briefs for the first one or two slices of the next session, in the brief format of the orchestrator rules;
omit the section when the next session's work is not yet clear. -->

### <slice>

```
Agent: heliotrop:<agent>, model <model>
Goal: <what and why>
Read: <path#symbol or path:start-end, ...>
Size: <items, reading ≈ Nk, expected peak ≈ Nk>
Constraints: <limits, decisions already made>
Done when: <checkable criteria>
Return: <format and size; default: the protocol format>
```

## State

<!-- Only when files changed in this session. -->

- branch: <branch>; uncommitted changes: <yes/no, what>; checks: <last result>
- unreviewed: <review marker>..<HEAD>, <N> changed lines (only when the contract has review sessions)
