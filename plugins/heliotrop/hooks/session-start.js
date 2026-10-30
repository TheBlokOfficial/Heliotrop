// SessionStart: inject the orchestrator rules, then the project notes (.claude/project.md) when they exist, otherwise
// one line suggesting /heliotrop:init. Also keeps the context-budget state: after a compaction the main-context
// notices start again, and state older than 7 days is deleted.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const STATE_DIR = path.join(os.tmpdir(), 'heliotrop-context-budget');
const STATE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const NO_NOTES = 'No project notes (.claude/project.md): suggest /heliotrop:init at most once, only when the work ' +
  'would benefit.';

function readInput() {
  try { return JSON.parse(fs.readFileSync(0, 'utf8').replace(/^﻿/, '') || '{}') || {}; } catch (e) { return {}; }
}

function cleanState(input) {
  let names = [];
  try { names = fs.readdirSync(STATE_DIR); } catch (e) { return; }
  const cutoff = Date.now() - STATE_MAX_AGE_MS;
  for (const name of names) {
    const f = path.join(STATE_DIR, name);
    try { if (fs.statSync(f).isFile() && fs.statSync(f).mtimeMs < cutoff) fs.unlinkSync(f); } catch (e) { /* skip */ }
  }
  // After a compaction the main context is small again: let every main-context level fire again.
  if (input.source !== 'compact') return;
  const id = input.session_id || (input.transcript_path ? path.basename(input.transcript_path, '.jsonl') : '');
  if (!id) return;
  const sf = path.join(STATE_DIR, `main-${id}.json`);
  let state;
  try { state = JSON.parse(fs.readFileSync(sf, 'utf8')) || {}; } catch (e) { return; }
  try { fs.writeFileSync(sf, JSON.stringify({ level: -1, cacheNotice: state.cacheNotice === true })); } catch (e) { /* */ }
}

function main() {
  const input = readInput();
  try { cleanState(input); } catch (e) { /* the notices still work */ }

  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  let rules = '';
  try { rules = fs.readFileSync(path.join(pluginRoot, 'core', 'orchestrator.md'), 'utf8'); } catch (e) { /* */ }
  let notes = null;
  try { notes = fs.readFileSync(path.join(projectDir, '.claude', 'project.md'), 'utf8').trim(); } catch (e) { /* */ }

  const context = notes === null
    ? `${rules.trimEnd()}\n\n${NO_NOTES}\n`
    : `${rules.trimEnd()}\n\n# Project notes (.claude/project.md)\n\n${notes}\n`;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context },
  }));
}

main();
