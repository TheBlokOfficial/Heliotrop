// PostToolUse (every tool): context notices, each level said once (orchestrator rules, ## Budgets).
// - Subagent: tells it when its context passes the slice budget (`context-budget:`, default 100k), so it wraps up and
//   returns `partial` instead of growing past it. Runs with or without a contract.
// - Main thread: notices at the `main-context:` points (default 150k / 200k), then every further 50k; and one notice
//   when the main session writes the prompt cache with a 5-minute TTL. Runs with or without a contract.
// Never fails the call: always exit 0.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_BUDGET = 100000;
const WARN_AT = 0.8; // share of the slice budget for the first subagent notice
const REMIND_EVERY = 0.2; // share of the slice budget between subagent reminders once it is passed
const DEFAULT_MAIN_NOTICE = 150000;
const DEFAULT_MAIN_HARD = 200000;
const MAIN_REMIND_STEP = 50000;
const TAIL_BYTES = [256 * 1024, 4 * 1024 * 1024]; // a larger tail only when the small one holds no usage entry
const STATE_DIR = path.join(os.tmpdir(), 'heliotrop-context-budget');

// `100000`, `100_000` or `100k` -> 100000; anything else -> NaN.
function parseTokens(s) {
  const m = String(s || '').trim().match(/^([0-9][0-9_]*)\s*(k)?$/i);
  if (!m) return NaN;
  const n = parseInt(m[1].replace(/_/g, ''), 10);
  return m[2] ? n * 1000 : n;
}

function readContract(projectDir) {
  try { return fs.readFileSync(path.join(projectDir, '.claude', 'project.md'), 'utf8'); } catch (e) { return ''; }
}

// `context-budget: <tokens>`; no contract or no valid value gives the default.
function readBudget(contract) {
  const m = contract.match(/^context-budget:[ \t]*([^\r\n#]*)/m);
  const n = m ? parseTokens(m[1]) : NaN;
  return n > 0 ? n : DEFAULT_BUDGET;
}

// `main-context: <notice> / <hard>`; no contract or no valid pair gives the defaults.
function readMainPoints(contract) {
  const m = contract.match(/^main-context:[ \t]*([^\r\n/#]*)\/([^\r\n#]*)/m);
  const notice = m ? parseTokens(m[1]) : NaN;
  const hard = m ? parseTokens(m[2]) : NaN;
  if (notice > 0 && hard >= notice) return { notice, hard };
  return { notice: DEFAULT_MAIN_NOTICE, hard: DEFAULT_MAIN_HARD };
}

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

const k = (n) => `${Math.round(n / 1000)}k`;

function emit(model, user) {
  const out = { hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: model } };
  if (user) out.systemMessage = user;
  process.stdout.write(JSON.stringify(out));
}

function runSubagent(input, contract) {
  const transcript = subagentTranscript(input);
  if (!transcript) return;
  const budget = readBudget(contract);
  const tokens = tokensOf(lastUsage(transcript, false));
  if (tokens < budget * WARN_AT) return;

  // Level 0 = warning; 1 = budget reached; 2, 3, ... = each further REMIND_EVERY share past it.
  const level = tokens < budget ? 0 : 1 + Math.floor((tokens - budget) / (budget * REMIND_EVERY));
  const sf = path.join(STATE_DIR, `${path.basename(transcript, '.jsonl')}.json`);
  const state = readState(sf);
  const sent = typeof state.level === 'number' ? state.level : -1;
  if (level <= sent) return;
  writeState(sf, { level });

  // Level 1 lets a slice whose work is done run its build, tests and commit: cut there, a fresh agent pays more to
  // orient than the few calls left. From level 2 on there is no such exemption.
  const wrapUp = 'start no new step; finish or cleanly undo the edit in progress; save or commit what is done as the ' +
    'brief and contract allow (mark unverified work as such); then return `Status: partial` listing the remaining ' +
    'steps, so the orchestrator can hand them to a fresh agent.';
  const text = level === 0
    ? `Heliotrop context budget: your context is ~${k(tokens)} tokens of the ~${k(budget)} slice budget. Estimate the ` +
      'tool calls your remaining steps need. More than ~6 beyond the step in progress: finish that step, save or ' +
      'commit it as the brief and contract allow, and return `Status: partial` with the remaining steps now. ' +
      'Otherwise finish within the budget. Either way, read nothing for steps you will not finish here ' +
      '(protocol, Budget).'
    : level === 1
      ? `Heliotrop context budget: your context is ~${k(tokens)} tokens, past the ~${k(budget)} slice budget. If only ` +
        'the build, tests and commit of finished work remain, run them and return as usual; if they fail, do not ' +
        `start fixing: return \`Status: partial\` with the failure. Otherwise wrap up now: ${wrapUp}`
      : `Heliotrop context budget: your context is ~${k(tokens)} tokens, far past the ~${k(budget)} slice budget. ` +
        `Stop now: ${wrapUp}`;
  emit(text, null);
}

function runMain(input, contract) {
  if (!input.transcript_path || !fs.existsSync(input.transcript_path)) return;
  const usage = lastUsage(input.transcript_path, true);
  if (!usage) return;
  const tokens = tokensOf(usage);
  const { notice, hard } = readMainPoints(contract);
  const id = input.session_id || path.basename(input.transcript_path, '.jsonl');
  const sf = path.join(STATE_DIR, `main-${id}.json`);
  const state = readState(sf);
  const sent = typeof state.level === 'number' ? state.level : -1;
  const cacheNotice = state.cacheNotice === true;
  const model = [];
  const user = [];

  // Level 0 = notice point; 1 = hard point; 2, 3, ... = each further MAIN_REMIND_STEP past the hard point.
  const level = tokens < notice ? -1 : tokens < hard ? 0 : 1 + Math.floor((tokens - hard) / MAIN_REMIND_STEP);
  if (level > sent) {
    const where = contract ? 'in the session file' : 'in your reply to the user';
    if (level === 0) {
      model.push(`Heliotrop main context: ~${k(tokens)} tokens. Hand remaining reading to subagents; record ` +
        `decisions ${where} now (orchestrator rules, Main context).`);
      user.push(`Heliotrop main context: ~${k(tokens)} tokens. The context is large; reading moves to subagents.`);
    } else if (level === 1 || sent < 1) { // a jump past the hard point still gets the hand-over procedure
      model.push(`Heliotrop main context: ~${k(tokens)} tokens, hard point (~${k(hard)}) reached. Dispatch no new ` +
        "agents, collect running agents' results, run the heliotrop:handover skill, report done / left / how to " +
        'continue and ask the user what next (orchestrator rules, Main context).');
      user.push(`Heliotrop main context: ~${k(tokens)} tokens, limit (~${k(hard)}) reached; handing over.`);
    } else {
      model.push(`Heliotrop main context: ~${k(tokens)} tokens, past the ~${k(hard)} hard point. Hand over now if ` +
        'not done (orchestrator rules, Main context).');
      user.push(`Heliotrop main context: ~${k(tokens)} tokens, past the ~${k(hard)} limit.`);
    }
  }

  const cc = usage.cache_creation || {};
  const cache5m = (cc.ephemeral_5m_input_tokens || 0) > 0 && !((cc.ephemeral_1h_input_tokens || 0) > 0);
  const sendCache = cache5m && !cacheNotice;
  if (sendCache) {
    model.push('Heliotrop cache: the main session writes the prompt cache with a 5-minute TTL. "promptCacheTtl": ' +
      '"1h" in ~/.claude/settings.json is cheaper for an orchestrator that waits on subagents. Explain this once ' +
      'and offer to add it; write it only after the user approves (orchestrator rules, Prompt cache).');
    user.push('Heliotrop cache: this session caches with a 5-minute TTL; "promptCacheTtl": "1h" in ' +
      '~/.claude/settings.json is cheaper when waiting on subagents.');
  }

  if (!model.length) return;
  writeState(sf, { level: Math.max(level, sent), cacheNotice: cacheNotice || sendCache });
  emit(model.join('\n'), user.join(' '));
}

function run(input) {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const contract = readContract(projectDir);
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
