// SessionStart: inject the orchestrator rules (with the numbers in effect for the project) and the project contract
// (.claude/contract.md). No contract: silent, except one line when earlier-version project notes
// (.claude/project.md) are found. Also keeps the context-budget state: after a compaction the main-context notices
// start again, and state older than STATE_MAX_AGE_MS is deleted.
'use strict';
const fs = require('fs');
const path = require('path');
const c = require('./common');

const LEGACY_LINE = 'Project notes from an earlier engine version found (.claude/project.md); the engine is inactive ' +
  'until they are migrated with /heliotrop:init.';

function cleanState(input) {
  let names = [];
  try { names = fs.readdirSync(c.STATE_DIR); } catch (e) { return; }
  const cutoff = Date.now() - c.STATE_MAX_AGE_MS;
  for (const name of names) {
    const f = path.join(c.STATE_DIR, name);
    try { if (fs.statSync(f).isFile() && fs.statSync(f).mtimeMs < cutoff) fs.unlinkSync(f); } catch (e) { /* skip */ }
  }
  // After a compaction the main context is small again: let every main-context level fire again.
  if (input.source !== 'compact') return;
  const id = input.session_id || (input.transcript_path ? path.basename(input.transcript_path, '.jsonl') : '');
  if (!id) return;
  const sf = path.join(c.STATE_DIR, `main-${id}.json`);
  if (!fs.existsSync(sf)) return;
  try { fs.writeFileSync(sf, JSON.stringify({ level: -1 })); } catch (e) { /* */ }
}

function emit(context) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context },
  }));
}

function main() {
  const input = c.readInput();
  try { cleanState(input); } catch (e) { /* the notices still work */ }

  const cwd = c.startDir(input);
  const projectDir = c.findProjectDir(cwd);
  if (!projectDir) {
    if (c.findLegacyDir(cwd)) emit(LEGACY_LINE);
    return;
  }

  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
  let rules = '';
  try { rules = fs.readFileSync(path.join(pluginRoot, 'core', 'orchestrator.md'), 'utf8'); } catch (e) { /* */ }
  const contract = c.readContract(projectDir);
  const points = c.readMainPoints(contract);
  const values = {
    'context-budget': c.formatK(c.readBudget(contract)),
    'main-notice': c.formatK(points.notice),
    'main-hard': c.formatK(points.hard),
    'main-remind': c.formatK(c.MAIN_REMIND_STEP),
  };
  for (const key of Object.keys(values)) rules = rules.split(`{{${key}}}`).join(values[key]);

  emit(`${rules.trimEnd()}\n\n# Project contract (.claude/contract.md)\n\n${contract.trim()}\n`);
}

main();
