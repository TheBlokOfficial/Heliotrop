// SessionStart: inject the orchestrator rules when the project has a Heliotrop contract, otherwise the light core
// (orchestrator rules, ## Triage, ## Explaining, ### Main context, ### Prompt cache). Also keeps the context-budget
// state: after a compaction the main-context notices start again, and state older than 7 days is deleted.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const STATE_DIR = path.join(os.tmpdir(), 'heliotrop-context-budget');
const STATE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const LIGHT_SECTIONS = ['## Triage', '## Explaining', '### Main context', '### Prompt cache'];

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

// One section of a Markdown text: from its heading line to the next heading of the same or a higher level.
function extractSection(lines, heading) {
  const depth = heading.match(/^#+/)[0].length;
  let start = -1;
  let fence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (fence) continue;
    const h = line.match(/^(#{1,6})\s/);
    if (start < 0) {
      if (line.trim() === heading) start = i;
    } else if (h && h[1].length <= depth) {
      return lines.slice(start, i).join('\n').trim();
    }
  }
  return start < 0 ? '' : lines.slice(start).join('\n').trim();
}

function lightCore(rules) {
  const version = (rules.match(/^# Heliotrop ([\d.]+): orchestrator rules/) || [])[1] || '1.0';
  const lines = rules.split(/\r?\n/);
  const sections = LIGHT_SECTIONS.map((h) => extractSection(lines, h)).filter(Boolean);
  return [
    `# Heliotrop ${version}: light mode`,
    'This project has no Heliotrop contract (.claude/project.md): there are no session files, and the defaults ' +
      'stand wherever the sections below name a contract value. Work with the user directly under these sections. ' +
      'Suggest /heliotrop:init at most once per session, and only when the work would benefit from it.',
    ...sections,
  ].join('\n\n');
}

function main() {
  const input = readInput();
  try { cleanState(input); } catch (e) { /* the notices still work */ }

  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  let rules = '';
  try { rules = fs.readFileSync(path.join(pluginRoot, 'core', 'orchestrator.md'), 'utf8'); } catch (e) { /* */ }

  const context = fs.existsSync(path.join(projectDir, '.claude', 'project.md'))
    ? `${rules.trimEnd()}\n\nSession file template: ${path.resolve(pluginRoot, 'skills', 'end', 'report-template.md')}\n`
    : lightCore(rules);

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context },
  }));
}

main();
