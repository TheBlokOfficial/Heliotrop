// PostToolUse(Edit|Write): run the contract's optional `on-edit:` command for the edited file.
// No contract, no `on-edit:` line, or a value of "none" means nothing to do.
'use strict';
const { spawnSync } = require('child_process');
const c = require('./common');

const input = c.readInput();
const projectDir = c.findProjectDir(c.startDir(input));
if (!projectDir) process.exit(0);

const template = c.readOnEdit(c.readContract(projectDir));
if (!template) process.exit(0);

const file = input.tool_input && input.tool_input.file_path;
if (!file) process.exit(0);

const command = template.split('{file}').join(`"${file}"`);
const result = process.platform === 'win32'
  ? spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { cwd: projectDir, encoding: 'utf8' })
  : spawnSync('/bin/sh', ['-c', command], { cwd: projectDir, encoding: 'utf8' });

if (result.status === 0) process.exit(0);
const output = `${result.stdout || ''}${result.stderr || ''}${result.error ? result.error.message : ''}`.trim();
process.stderr.write(`On-edit check failed for ${file}:\n${output.slice(0, 4000)}\n`);
process.exit(2);
