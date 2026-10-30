// PostToolUse(Edit|Write): run the project notes' optional `on-edit:` command for the edited file.
// No project notes, no `on-edit:` line, or a value of "none" means nothing to do.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const contract = path.join(projectDir, '.claude', 'project.md');
if (!fs.existsSync(contract)) process.exit(0);

const match = fs.readFileSync(contract, 'utf8').match(/^on-edit:[ \t]*(.*)$/m);
const template = match ? match[1].trim() : '';
if (!template || template === 'none' || template.startsWith('<')) process.exit(0);

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8').replace(/^﻿/, '') || '{}');
} catch {
  process.exit(0);
}
const file = input.tool_input && input.tool_input.file_path;
if (!file) process.exit(0);

const command = template.split('{file}').join(`"${file}"`);
const result = process.platform === 'win32'
  ? spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { cwd: projectDir, encoding: 'utf8' })
  : spawnSync('/bin/sh', ['-c', command], { cwd: projectDir, encoding: 'utf8' });

if (result.status === 0) process.exit(0);
const output = `${result.stdout || ''}${result.stderr || ''}${result.error ? result.error.message : ''}`.trim();
process.stderr.write(`Heliotrop on-edit check failed for ${file}:\n${output.slice(0, 4000)}\n`);
process.exit(2);
