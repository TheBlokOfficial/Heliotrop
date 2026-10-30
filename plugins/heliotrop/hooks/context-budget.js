// PostToolUse (every tool): context notices, each level said once (orchestrator rules, Hard rules).
// Only in projects with a contract (.claude/contract.md); elsewhere silent.
// - Subagent: tells it when its context nears and passes the subagent budget (`context-budget:` in the contract),
//   so it wraps up and returns `partial` instead of growing past it.
// - Main thread: notices at the `main-context:` points of the contract, then every further reminder step.
// The numbers are in common.js. Never fails the call: always exit 0.
'use strict';
const fs = require('fs');
const path = require('path');
const c = require('./common');

const { STATE_DIR, WARN_AT, REMIND_EVERY, MAIN_REMIND_STEP } = c;
const k = c.formatK;
const TAIL_BYTES = [256 * 1024, 4 * 1024 * 1024]; // a larger tail only when the small one holds no usage entry

function readTail(file, bytes) {
  const fd = fs.openSync(file, 'r');
  try {
    const size = fs.fstatSync(fd).size;
    const len = Math.min(size, bytes);
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, size - len);
    return { text: buf.toString('utf8'), whole: len === size };
  } finally {
    fs.closeSync(fd);
  }
}

// Usage of the last assistant turn, i.e. the context as the model saw it. The main thread skips sidechain entries.
function lastUsage(file, skipSidechain) {
  for (const bytes of TAIL_BYTES) {
    const tail = readTail(file, bytes);
    const lines = tail.text.split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      if (!lines[i].includes('"usage"')) continue;
      let entry;
      try { entry = JSON.parse(lines[i]); } catch (e) { continue; }
      if (!entry || entry.type !== 'assistant' || !entry.message || !entry.message.usage) continue;
      if (skipSidechain && entry.isSidechain === true) continue;
      return entry.message.usage;
    }
    if (tail.whole) break;
  }
  return null;
}

function tokensOf(u) {
  return u ? (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0) : 0;
}

function isAgentTranscript(p) {
  return /^agent-.*\.jsonl$/.test(path.basename(p || ''));
}

// The subagent's own transcript: the one passed, or the one named by agent_id. Null when not found.
function subagentTranscript(input) {
  if (!input.transcript_path) return null;
  if (isAgentTranscript(input.transcript_path)) {
    return fs.existsSync(input.transcript_path) ? input.transcript_path : null;
  }
  const id = input.session_id || path.basename(input.transcript_path, '.jsonl');
  const f = path.join(path.dirname(input.transcript_path), id, 'subagents', `agent-${input.agent_id}.jsonl`);
  return fs.existsSync(f) ? f : null;
}

function readState(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) || {}; } catch (e) { return {}; }
}

function writeState(file, state) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(state));
  } catch (e) { /* a repeated notice is harmless */ }
}

function emit(model, user) {
  const out = { hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: model } };
  if (user) out.systemMessage = user;
  process.stdout.write(JSON.stringify(out));
}

function runSubagent(input, contract) {
  const transcript = subagentTranscript(input);
  if (!transcript) return;
  const budget = c.readBudget(contract);
  const tokens = tokensOf(lastUsage(transcript, false));
  if (tokens < budget * WARN_AT) return;

  // Level 0 = warning; 1 = budget reached; 2, 3, ... = each further REMIND_EVERY share past it.
  const level = tokens < budget ? 0 : 1 + Math.floor((tokens - budget) / (budget * REMIND_EVERY));
  const sf = path.join(STATE_DIR, `${path.basename(transcript, '.jsonl')}.json`);
  const state = readState(sf);
  const sent = typeof state.level === 'number' ? state.level : -1;
  if (level <= sent) return;
  writeState(sf, { level });

  // Level 1 lets a slice whose work is done run its build and tests; from level 2 on there is no exemption.
  const text = level === 0
    ? `Context budget: ~${k(tokens)} tokens of the ~${k(budget)} slice budget. Plan to finish within the ` +
      'budget; if much remains, finish the current step and return `Status: partial` with the remaining steps ' +
      '(protocol).'
    : level === 1
      ? `Context budget: ~${k(tokens)} tokens, past the ~${k(budget)} slice budget. Wrap up: finish or undo ` +
        'the edit in progress, save what is done, return `Status: partial` with the remaining steps; only the ' +
        'build and tests of finished work may still run; if only these remained and they pass, return as ' +
        'usual (protocol).'
      : `Context budget: ~${k(tokens)} tokens, far past the ~${k(budget)} slice budget. Stop now and ` +
        'return `Status: partial` (protocol).';
  emit(text, null);
}

function runMain(input, contract) {
  if (!input.transcript_path || !fs.existsSync(input.transcript_path)) return;
  const usage = lastUsage(input.transcript_path, true);
  if (!usage) return;
  const tokens = tokensOf(usage);
  const { notice, hard } = c.readMainPoints(contract);
  const id = input.session_id || path.basename(input.transcript_path, '.jsonl');
  const sf = path.join(STATE_DIR, `main-${id}.json`);
  const state = readState(sf);
  const sent = typeof state.level === 'number' ? state.level : -1;
  const model = [];
  const user = [];

  // Level 0 = notice point; 1 = hard point; 2, 3, ... = each further MAIN_REMIND_STEP past the hard point.
  const level = tokens < notice ? -1 : tokens < hard ? 0 : 1 + Math.floor((tokens - hard) / MAIN_REMIND_STEP);
  if (level > sent) {
    if (level === 0) {
      model.push(`Main context: ~${k(tokens)} tokens, notice point reached. Plan the landing: finish the items in ` +
        'progress, start no large new topic, prepare a handover if the rest will not fit (orchestrator rules, ' +
        'Hard rules).');
      user.push(`Main context: ~${k(tokens)} tokens. The context is large; planning the landing.`);
    } else if (level === 1 || sent < 1) { // a jump past the hard point still gets the hand-over procedure
      model.push(`Main context: ~${k(tokens)} tokens, hard point (~${k(hard)}) reached. Dispatch no new ` +
        'agents, collect running ones, run the heliotrop:handover skill, tell the user what is done, what is left ' +
        'and how to continue, and ask what next (orchestrator rules, Hard rules).');
      user.push(`Main context: ~${k(tokens)} tokens, limit (~${k(hard)}) reached; handing over.`);
    } else {
      model.push(`Main context: ~${k(tokens)} tokens, past the ~${k(hard)} hard point. Hand over now if ` +
        'not done (orchestrator rules, Hard rules).');
      user.push(`Main context: ~${k(tokens)} tokens, past the ~${k(hard)} limit.`);
    }
  }

  if (!model.length) return;
  writeState(sf, { level: Math.max(level, sent) });
  emit(model.join('\n'), user.join(' '));
}

function run(input) {
  const projectDir = c.findProjectDir(c.startDir(input));
  if (!projectDir) return;
  const contract = c.readContract(projectDir);
  if (input.agent_id || isAgentTranscript(input.transcript_path)) runSubagent(input, contract);
  else runMain(input, contract);
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  try { run(JSON.parse(raw.replace(/^﻿/, '') || '{}')); } catch (e) { /* never fail the call */ }
  process.exit(0);
});
process.stdin.on('error', () => process.exit(0));
