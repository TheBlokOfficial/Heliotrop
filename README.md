# agent-stack

A Claude Code marketplace with one plugin, `stack`: a project-agnostic agent workflow engine. The engine holds the
workflow (orchestrator rules, subagents, skills, hooks). Everything that differs between projects lives in each
repository's contract, `.claude/project.md`. The engine never contains a project's paths, commands or document types.

## Layout

```
.claude-plugin/marketplace.json     marketplace "agent-stack"
plugins/stack/
  .claude-plugin/plugin.json
  core/orchestrator.md              orchestrator rules, injected at session start
  agents/                           researcher, implementer, reviewer, doc-writer, verifier
  skills/plan, end, init            orchestrator procedures (/stack:plan, /stack:end, /stack:init)
  skills/write-doc                  document rules, preloaded into doc-writer, loaded by the orchestrator
  skills/protocol                   subagent protocol, preloaded into every stack agent
  skills/init/contract-template.md  contract template
  skills/end/report-template.md     session report template
  hooks/                            SessionStart and PostToolUse hooks (Node.js)
```

## Behaviour

- **SessionStart hook.** In a project with `.claude/project.md` it injects `core/orchestrator.md`: the orchestrator
  as the session's manager, session scope, start and end reports, the three communication modes, the decision rule,
  the brief and return formats, and the slice-size rules. The rules are defaults the orchestrator may deviate from
  with a reason in the decision log; user decisions and the contract are not. Without a contract it injects one line
  saying that the workflow is off.
- **PostToolUse hook (Edit, Write).** Runs the contract's `on-edit:` command with `{file}` replaced by the edited path,
  using PowerShell on Windows and `/bin/sh` elsewhere. A failure is reported back to Claude. No `on-edit:` line, or
  `none`, means nothing runs. The full `check` is run by the verifier, not after every edit.
- **Session reports** go to the contract's sessions directory (default `docs/sessions/YYYY-MM-DD-topic.md`). The next
  session starts by reading the contract and the newest report.

| Agent | Model | Tools | Role |
|---|---|---|---|
| `stack:researcher` | haiku | Read, Grep, Glob, WebSearch, WebFetch, Write, Edit | search and heavy reading; writes research notes only |
| `stack:implementer` | sonnet | Read, Edit, Write, Grep, Glob, Bash, PowerShell | one scoped change plus its checks |
| `stack:reviewer` | opus | Read, Grep, Glob, Write, Bash, PowerShell | review of diffs and designs; writes only its report |
| `stack:doc-writer` | sonnet | Read, Write, Edit, Grep, Glob | documents per the contract's types and templates |
| `stack:verifier` | haiku | Read, Grep, Glob, Bash, PowerShell | runs checks or a checklist, reports the outcome |

`Bash` and `PowerShell` are both listed so the agents work on any platform; only the one that exists resolves.
A contract may override a model in its `Agents` section; the orchestrator passes the override on the call.

## Install

Requirements: Claude Code and Node.js on `PATH` (for the hooks).

```
claude plugin marketplace add D:\Projekty\agent-stack
claude plugin install stack@agent-stack --scope user
```

The marketplace is a local directory, so the plugin loads in place: edits take effect at the next session start or
after `/reload-plugins`, with no reinstall and no version bump. Bump `version` in `plugin.json` when a change alters
behaviour, and describe it in the commit message.

Onboard a project with `/stack:init`, which writes `.claude/project.md` from the template.

## Changing the engine

- Nothing project-specific: if a change needs a project's path, command, document type or rule, it belongs in that
  project's contract, and the engine gets at most a generic hook for it.
- The contract's headings are an interface read by the skills, agents and hooks. Renaming or removing one means
  updating the engine and every contract.
- Keep the pool small. Every agent and skill description costs context in every session.
