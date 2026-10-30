// Shared by all hooks: the engine's numbers (the only place that states them), finding the project, reading the
// contract (.claude/contract.md) and its hook keys. Nothing here writes or prints.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

// Defaults; a contract overrides the first three with `context-budget:` and `main-context:`.
const DEFAULT_BUDGET = 100000; // subagent budget
const DEFAULT_MAIN_NOTICE = 150000; // main context: notice point
const DEFAULT_MAIN_HARD = 200000; // main context: hard point
const MAIN_REMIND_STEP = 50000; // main context: reminder every further step past the hard point
const WARN_AT = 0.8; // share of the subagent budget for the first subagent notice
const REMIND_EVERY = 0.2; // share of the subagent budget between subagent reminders once it is passed
const STATE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const STATE_DIR = path.join(os.tmpdir(), 'heliotrop-context-budget');

const CONTRACT = path.join('.claude', 'contract.md');
const LEGACY_NOTES = path.join('.claude', 'project.md');

function readInput() {
  try { return JSON.parse(fs.readFileSync(0, 'utf8').replace(/^﻿/, '') || '{}') || {}; } catch (e) { return {}; }
}

// Where to start looking for the project: the same source in every hook.
function startDir(input) {
  return process.env.CLAUDE_PROJECT_DIR || (input && input.cwd) || process.cwd();
}

// Nearest directory, from `cwd` upwards, that holds `rel`; null when none does.
function findUp(cwd, rel) {
  let dir = path.resolve(cwd || process.cwd());
  for (;;) {
    if (fs.existsSync(path.join(dir, rel))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

// The project dir: nearest directory from `cwd` upwards with `.claude/contract.md`; null when there is none.
function findProjectDir(cwd) {
  return findUp(cwd, CONTRACT);
}

// A directory with earlier-version project notes (`.claude/project.md`) and no contract; null otherwise.
function findLegacyDir(cwd) {
  return findProjectDir(cwd) ? null : findUp(cwd, LEGACY_NOTES);
}

function readContract(projectDir) {
  try { return fs.readFileSync(path.join(projectDir, CONTRACT), 'utf8'); } catch (e) { return ''; }
}

// `100000`, `100_000` or `100k` -> 100000; anything else -> NaN.
function parseTokens(s) {
  const m = String(s || '').trim().match(/^([0-9][0-9_]*)\s*(k)?$/i);
  if (!m) return NaN;
  const n = parseInt(m[1].replace(/_/g, ''), 10);
  return m[2] ? n * 1000 : n;
}

// `context-budget: <tokens>`; no contract text or no valid value gives the default.
function readBudget(contract) {
  const m = String(contract || '').match(/^context-budget:[ \t]*([^\r\n#]*)/m);
  const n = m ? parseTokens(m[1]) : NaN;
  return n > 0 ? n : DEFAULT_BUDGET;
}

// `main-context: <notice> / <hard>`; no contract text or no valid pair gives the defaults.
function readMainPoints(contract) {
  const m = String(contract || '').match(/^main-context:[ \t]*([^\r\n/#]*)\/([^\r\n#]*)/m);
  const notice = m ? parseTokens(m[1]) : NaN;
  const hard = m ? parseTokens(m[2]) : NaN;
  if (notice > 0 && hard >= notice) return { notice, hard };
  return { notice: DEFAULT_MAIN_NOTICE, hard: DEFAULT_MAIN_HARD };
}

// `on-edit: <command> {file}`; '' when absent, `none` or an unfilled `<...>` placeholder.
function readOnEdit(contract) {
  const m = String(contract || '').match(/^on-edit:[ \t]*(.*)$/m);
  const template = m ? m[1].trim() : '';
  return !template || template === 'none' || template.startsWith('<') ? '' : template;
}

// 150000 -> `150k`
function formatK(n) {
  return `${Math.round(n / 1000)}k`;
}

module.exports = {
  DEFAULT_BUDGET, DEFAULT_MAIN_NOTICE, DEFAULT_MAIN_HARD, MAIN_REMIND_STEP, WARN_AT, REMIND_EVERY, STATE_MAX_AGE_MS,
  STATE_DIR, CONTRACT, LEGACY_NOTES,
  readInput, startDir, findProjectDir, findLegacyDir, readContract, parseTokens, readBudget, readMainPoints,
  readOnEdit, formatK,
};
