# Backlog

<!-- Open items and next steps. Read at the start of every session. The `end` and `handover` skills add open and
deferred items and remove done ones; a done item is deleted, not ticked (its record is the session file). One line per
item; details live in the linked document. -->

## Next

- Plugin name check: confirm that no other Claude Code plugin is already named `heliotrop`.
- Restore session metrics and the session doctor: bring back the metrics script and the doctor agent from the git
  history (removed in 1.0.0), adapted to the Heliotrop names, reading transcripts from `~/.claude/heliotrop-archive/`
  (and `~/.claude/stack-archive/` for 0.x sessions). [CHANGELOG.md](../CHANGELOG.md)

## Later

- Start background: measure what makes up the ~57k tokens a session carries before its first message.
- `briefSizeReadK` metric: the reading a brief names, in k tokens, per agent (needs the restored metrics).
- Read-only roles: decide whether researcher, reviewer and verifier get their own budget thresholds.
