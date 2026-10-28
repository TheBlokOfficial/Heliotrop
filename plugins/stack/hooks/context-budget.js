// PostToolUse (every tool): tell a subagent when its context passes the slice budget, so it wraps up and returns
// `partial` instead of growing past it. A slice's cost grows with the square of its context, and nothing else in the
// subagent sees its own size. Only subagents in projects with a stack contract. Never fails the call: always exit 0.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_BUDGET = 100000;
const WARN_AT = 0.8; // share of the budget for the first notice
const REMIND_EVERY = 0.2; // share of the budget between reminders once it is passed
const TAIL_BYTES = 256 * 1024;

// The contract may set `context-budget: <tokens>`; anything else falls back to the default.
function readBudget(projectDir) {
  const contract = path.join(projectDir, '.claude', 'project.md');
  if (!fs.existsSync(contract)) return 0;
  const m = fs.readFileSync(contract, 'utf8').match(/^context-budget:[ \t]*([0-9][0-9_ ]*)/m);
  const n = m ? parseInt(m[1].replace(/[_ ]/g, ''), 10) : NaN;
  return n > 0 ? n : DEFAULT_BUDGET;
}

function readTail(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const size = fs.fstatSync(fd).size;
    const len = Math.min(size, TAIL_BYTES);
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, size - len);
    return buf.toString('utf8');
  } finally {
    fs.closeSync(fd);
  }
}

// The subagent's own transcript: by agent_id when the client passes it, otherwise the recent subagent transcript
// that contains this tool call. Null for the main thread.
function findTranscript(input) {
  if (!input.transcript_path) return null;
  // Some clients may already pass the subagent's own transcript.
  if (/^agent-.*\.jsonl$/.test(path.basename(input.transcript_path))) {
    return fs.existsSync(input.transcript_path) ? input.transcript_path : null;
  }
  const id = input.session_id || path.basename(input.transcript_path, '.jsonl');
  const subDir = path.join(path.dirname(input.transcript_path), id, 'subagents');
  if (input.agent_id) {
    const f = path.join(subDir, `agent-${input.agent_id}.jsonl`);
    return fs.existsSync(f) ? f : null;
  }
  if (!input.tool_use_id || !fs.existsSync(subDir)) return null;
  const recent = Date.now() - 10 * 60 * 1000;
  for (const name of fs.readdirSync(subDir)) {
    if (!name.endsWith('.jsonl')) continue;
    const f = path.join(subDir, name);
    if (fs.statSync(f).mtimeMs < recent) continue;
    if (readTail(f).includes(input.tool_use_id)) return f;
  }
  return null;
}

// Context size as the model saw it on the last assistant turn.
function contextTokens(file) {
  const lines = readTail(file).split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i].includes('"usage"')) continue;
    let entry;
    try { entry = JSON.parse(lines[i]); } catch (e) { continue; }
    const u = entry && entry.type === 'assistant' && entry.message && entry.message.usage;
    if (!u) continue;
    return (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0) +
      (u.output_tokens || 0);
  }
  return 0;
}

// Highest notice already sent to this agent, so each level is said once.
function stateFile(transcript) {
  return path.join(os.tmpdir(), 'stack-context-budget', `${path.basename(transcript, '.jsonl')}.json`);
}

function run(input) {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const budget = readBudget(projectDir);
  if (!budget) return;
  const transcript = findTranscript(input);
  if (!transcript) return;
  const tokens = contextTokens(transcript);
  if (tokens < budget * WARN_AT) return;

  // Level 0 = warning; 1 = budget reached; 2, 3, ... = each further REMIND_EVERY share past it.
  const level = tokens < budget ? 0 : 1 + Math.floor((tokens - budget) / (budget * REMIND_EVERY));
  const sf = stateFile(transcript);
  let sent = -1;
  try { sent = JSON.parse(fs.readFileSync(sf, 'utf8')).level; } catch (e) { /* nothing sent yet */ }
  if (level <= sent) return;
  try {
    fs.mkdirSync(path.dirname(sf), { recursive: true });
    fs.writeFileSync(sf, JSON.stringify({ level }));
  } catch (e) { /* a repeated notice is harmless */ }

  const k = (n) => `${Math.round(n / 1000)}k`;
  // Level 1 lets a slice whose work is done run its build, tests and commit: cut there, a fresh agent pays more to
  // orient than the few calls left. From level 2 on there is no such exemption.
  const wrapUp = 'start no new step; finish or cleanly undo the edit in progress; save or commit what is done as the ' +
    'brief and contract allow (mark unverified work as such); then return `Status: partial` listing the remaining ' +
    'steps, so the orchestrator can hand them to a fresh agent.';
  const text = level === 0
    ? `stack context budget: your context is ~${k(tokens)} tokens of the ~${k(budget)} slice budget. Estimate the ` +
      'tool calls your remaining steps need. More than ~6 beyond the step in progress: finish that step, save or ' +
      'commit it as the brief and contract allow, and return `Status: partial` with the remaining steps now. ' +
      'Otherwise finish within the budget. Either way, read nothing for steps you will not finish here ' +
      '(protocol, Budget).'
    : level === 1
      ? `stack context budget: your context is ~${k(tokens)} tokens, past the ~${k(budget)} slice budget. If only ` +
        'the build, tests and commit of finished work remain, run them and return as usual; if they fail, do not ' +
        `start fixing: return \`Status: partial\` with the failure. Otherwise wrap up now: ${wrapUp}`
      : `stack context budget: your context is ~${k(tokens)} tokens, far past the ~${k(budget)} slice budget. Stop ` +
        `now: ${wrapUp}`;
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: text } }));
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  try { run(JSON.parse(raw.replace(/^﻿/, '') || '{}')); } catch (e) { /* never fail the call */ }
  process.exit(0);
});
process.stdin.on('error', () => process.exit(0));
