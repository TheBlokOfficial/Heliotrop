# 2026-10-30: Command center (Heliotrop 1.1)

kind: build

## Scope

Heliotrop 1.1: the roadmap replaces the backlog as the project's only status document and the user's command center;
documents written for the user get their own language (contract `user documents:`); the engine repository's
versioning rule reserves the major number for a redesign. Out of scope: hooks, light mode, restoring metrics.

## Done

- Spec: [design/heliotrop-1.1.md](../design/heliotrop-1.1.md).
- Engine, two implementer slices with disjoint files: roadmap template (replaces `backlog`), `write-doc`
  `## Language`, orchestrator, `doc-writer`, session file template; `init`, contract template, `end`, `handover`,
  `guide`, `plan`.
- Review (8 findings: 1.0 projects' own roadmaps kept by file form, light mode in `plan`, Waiting for you holds only
  pending items, Known problems filled, handover refers to `end` step 5, language rule references, guide placeholder,
  wrapping), all fixed in one fix slice.
- Repository: [roadmap.md](../roadmap.md) (Polish, from the backlog), contract `roadmap:` and `user documents:`,
  versioning rule, [decisions.md](../decisions.md), README, CHANGELOG and `plugin.json` 1.1.0, build zip.
- Checks: `node tests/hooks/test.js` passes.
- 1.2.0, one implementer slice: `init` creates the roadmap in a project without one; the guide after `init` and the
  closing message of `end` and `handover` point to it; triage defers unrelated side requests to the end of the
  session. Decisions in [decisions.md](../decisions.md).

## Decisions

- `kind: talk → build` — the engine map and readiness check led straight into the change.
- Lasting decisions of this session are in [decisions.md](../decisions.md): versioning, roadmap as command center,
  language of user documents.
- The roadmap template is built from the engine's own rules, with no project used as a model — the engine stays
  project-agnostic.
- Only the roadmap is a user document in 1.1; other documents keep `documents:` — one file is what the user works from.
- A 1.0 contract's `backlog:` is read as `roadmap:`, and its file is converted on the next `end` or `handover` — this
  keeps the change a minor version.
- `plan` writes multi-session stages into the roadmap — otherwise the roadmap would show only leftovers, not the plan.
- The 1.0 session file's links to `backlog.md` now point to `roadmap.md` — the file was renamed.
- The orchestrator rules keep the title "Heliotrop 1.0" — it names the major generation; the version is in
  `plugin.json`, and the hook test matches the title.

## User decisions

- Version 1.1.0 for this change; 2.0 is reserved for a large redesign.
- Roadmap replaces the backlog; user documents in the user's language, technical documents stay in English.
- Build, commit and push at the end of the session without a separate sign-off.
- 1.2.0: the engine encourages the user, subtly, to follow progress in the roadmap; unrelated side requests in a
  focused session are handled at its end.

## Open

- The installed plugin is still `stack@agent-stack`: 1.1 behaviour is not observed until the reinstall.

## Next sessions

1. **Rollout**: reinstall the plugin, migrate a real project with `/heliotrop:init` and observe its first sessions,
   including the first roadmap updates by `end`. Start reading: [roadmap.md](../roadmap.md).

## State

- branch: main; uncommitted changes: no (released as 1.1.0 and 1.2.0, pushed); checks: hook smoke test passes
