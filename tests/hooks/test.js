// Smoke test for the Heliotrop hooks on synthetic input: never touches a live session.
// Usage: node tests/hooks/test.js   (exit code 0 = all checks pass)
// Creates its fixtures in a fresh folder under os.tmpdir(), points TEMP/TMP there and deletes it at the end.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOKS = path.resolve(__dirname, '..', '..', 'plugins', 'heliotrop', 'hooks');
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'heliotrop-hooks-test-'));
const TMP = path.join(ROOT, 'tmp');
const STATE = path.join(TMP, 'heliotrop-context-budget');
const W = path.join(ROOT, 'work');
const lightDir = path.join(W, 'light');
const contractDir = path.join(W, 'withcontract');
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(lightDir, { recursive: true });
fs.mkdirSync(path.join(contractDir, '.claude'), { recursive: true });
fs.writeFileSync(path.join(contractDir, '.claude', 'project.md'), '# contract\ncontext-budget: 50k\nmain-context: 150k / 200k\n');

const env = Object.assign({}, process.env, { TEMP: TMP, TMP: TMP, TMPDIR: TMP });
delete env.CLAUDE_PROJECT_DIR;
delete env.CLAUDE_PLUGIN_ROOT;

function run(hook, input, extraEnv) {
  const r = spawnSync(process.execPath, [path.join(HOOKS, hook)], {
    input: JSON.stringify(input), env: Object.assign({}, env, extraEnv || {}), encoding: 'utf8',
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

function usage(tokens, cc) {
  const u = { input_tokens: 10, cache_creation_input_tokens: 0, cache_read_input_tokens: tokens - 10, output_tokens: 5000 };
  if (cc) u.cache_creation = cc;
  return u;
}
function entry(u, side) { return JSON.stringify({ type: 'assistant', isSidechain: !!side, message: { role: 'assistant', usage: u } }); }
function writeTranscript(f, lines) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, lines.join('\n') + '\n'); }

const results = [];
function check(name, cond, evidence) { results.push({ ok: !!cond, line: `${cond ? 'PASS' : 'FAIL'} ${name} :: ${evidence}` }); }
function parse(o) { try { return JSON.parse(o); } catch (e) { return null; } }
function ctx(j) { return (j && j.hookSpecificOutput && j.hookSpecificOutput.additionalContext) || ''; }
function lens(j) { return j ? `model=${ctx(j).length} user=${(j.systemMessage || '').length}` : ''; }
function readJson(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } }

function tests() {
  const SID = 'sess1';
  const main = path.join(W, 'proj', `${SID}.jsonl`);
  const base = { session_id: SID, transcript_path: main, cwd: lightDir, hook_event_name: 'PostToolUse', tool_name: 'Read' };
  const one = { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 500 };
  let r; let j; let c;

  // Main thread below 150k: a sidechain entry with 300k must be skipped.
  writeTranscript(main, [entry(usage(140000, one)), entry(usage(300000, one), true)]);
  r = run('context-budget.js', base);
  check('main <150k no output (sidechain 300k skipped)', r.out === '' && r.code === 0, `out='${r.out}' code=${r.code}`);

  writeTranscript(main, [entry(usage(150000, one))]);
  r = run('context-budget.js', base); j = parse(r.out);
  check('main 150k notice', j && /^Heliotrop main context: ~150k/.test(ctx(j)) && /^Heliotrop main context/.test(j.systemMessage),
    `${j && j.systemMessage} [${lens(j)}]`);
  check('main notice texts <= 300 chars', j && ctx(j).length <= 300 && (j.systemMessage || '').length <= 300, lens(j));
  r = run('context-budget.js', base);
  check('main 150k not repeated', r.out === '', `out='${r.out}'`);

  writeTranscript(main, [entry(usage(200000, one))]);
  r = run('context-budget.js', base); j = parse(r.out);
  check('main 200k hard point', j && /hard point/.test(ctx(j)) && /handing over/.test(j.systemMessage), `${j && j.systemMessage} [${lens(j)}]`);

  writeTranscript(main, [entry(usage(250000, one))]);
  r = run('context-budget.js', base); j = parse(r.out);
  check('main 250k reminder', j && /past the ~200k hard point/.test(ctx(j)), `${j && j.systemMessage} [${lens(j)}]`);
  r = run('context-budget.js', base);
  check('main 250k not repeated', r.out === '', `out='${r.out}'`);

  // A compaction resets the level and keeps cacheNotice.
  fs.writeFileSync(path.join(STATE, `main-${SID}.json`), JSON.stringify({ level: 2, cacheNotice: true }));
  run('session-start.js', { session_id: SID, source: 'compact', cwd: lightDir, hook_event_name: 'SessionStart' });
  const st = readJson(path.join(STATE, `main-${SID}.json`));
  check('compact resets level', st && st.level === -1 && st.cacheNotice === true, JSON.stringify(st));
  writeTranscript(main, [entry(usage(160000, one))]);
  r = run('context-budget.js', base); j = parse(r.out);
  check('after compact 160k notice again', j && /~160k/.test(j.systemMessage), `${j && j.systemMessage}`);

  // Prompt cache: 5m writes get one notice, 1h writes none.
  const SID2 = 'sess2';
  const main2 = path.join(W, 'proj', `${SID2}.jsonl`);
  const base2 = Object.assign({}, base, { session_id: SID2, transcript_path: main2 });
  writeTranscript(main2, [entry(usage(20000, { ephemeral_5m_input_tokens: 3000, ephemeral_1h_input_tokens: 0 }))]);
  r = run('context-budget.js', base2); j = parse(r.out);
  check('5m cache notice', j && /^Heliotrop cache:/.test(ctx(j)) && /^Heliotrop cache:/.test(j.systemMessage), `${j && j.systemMessage} [${lens(j)}]`);
  check('cache notice texts <= 300 chars', j && ctx(j).length <= 300 && (j.systemMessage || '').length <= 300, lens(j));
  r = run('context-budget.js', base2);
  check('5m cache notice once', r.out === '', `out='${r.out}'`);
  const SID3 = 'sess3';
  const main3 = path.join(W, 'proj', `${SID3}.jsonl`);
  writeTranscript(main3, [entry(usage(20000, { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 3000 }))]);
  r = run('context-budget.js', Object.assign({}, base, { session_id: SID3, transcript_path: main3 }));
  check('1h cache no notice', r.out === '', `out='${r.out}'`);

  // Subagent with agent_id and no contract: default 100k budget.
  const agentF = path.join(W, 'proj', SID, 'subagents', 'agent-abc.jsonl');
  writeTranscript(agentF, [entry(usage(85000), true)]);
  const sub = Object.assign({}, base, { agent_id: 'abc', agent_type: 'heliotrop:researcher' });
  r = run('context-budget.js', sub); j = parse(r.out);
  check('subagent no contract 85k warning (default 100k)',
    j && /^Heliotrop context budget: .*~85k tokens of the ~100k/.test(ctx(j)) && /\(protocol, Budget\)/.test(ctx(j)) && !j.systemMessage,
    ctx(j).slice(0, 90));
  r = run('context-budget.js', sub);
  check('subagent warning once', r.out === '', `out='${r.out}'`);
  writeTranscript(agentF, [entry(usage(101000), true)]);
  r = run('context-budget.js', sub); j = parse(r.out);
  check('subagent 101k budget reached', j && /^Heliotrop context budget: .*past the ~100k slice budget/.test(ctx(j)), ctx(j).slice(0, 90));
  // Subagent in a project whose contract sets a 50k budget.
  const agentG = path.join(W, 'proj', SID, 'subagents', 'agent-def.jsonl');
  writeTranscript(agentG, [entry(usage(45000), true)]);
  r = run('context-budget.js', Object.assign({}, sub, { agent_id: 'def', cwd: contractDir })); j = parse(r.out);
  check('subagent contract 50k budget', j && /~45k tokens of the ~50k/.test(ctx(j)), ctx(j).slice(0, 90));
  // Subagent calls leave the main state alone.
  const st2 = readJson(path.join(STATE, `main-${SID}.json`));
  check('subagent call leaves main state', st2 && st2.level === 0, JSON.stringify(st2));

  // SessionStart: light mode vs contract, with a fake plugin root holding the four light sections.
  const fakeRoot = path.join(W, 'plugin');
  fs.mkdirSync(path.join(fakeRoot, 'core'), { recursive: true });
  fs.writeFileSync(path.join(fakeRoot, 'core', 'orchestrator.md'), [
    '# Heliotrop 1.0: orchestrator rules', '', 'Intro.', '', '## Session', 'S body', '', '## Triage', 'T body', '```', '# not a heading', '```', 'T tail',
    '', '## Explaining', 'E body', '', '## Budgets', 'B intro', '', '### Slice size', 'SS body', '', '### Main context', 'MC body', '#### detail', 'MC detail',
    '', '### Prompt cache', 'PC body', '', '## Integration', 'I body', ''].join('\n'));
  r = run('session-start.js', { session_id: 'x', source: 'startup', cwd: lightDir }, { CLAUDE_PLUGIN_ROOT: fakeRoot });
  c = ctx(parse(r.out));
  check('light mode injects light core', c.startsWith('# Heliotrop 1.0: light mode') && /## Triage\nT body\n```\n# not a heading\n```\nT tail/.test(c) &&
    /## Explaining\nE body/.test(c) && /### Main context\nMC body\n#### detail\nMC detail/.test(c) && /### Prompt cache\nPC body/.test(c) &&
    !/S body|SS body|I body|B intro|Session file template/.test(c), JSON.stringify(c).slice(0, 160));
  r = run('session-start.js', { session_id: 'x', source: 'startup', cwd: contractDir }, { CLAUDE_PLUGIN_ROOT: fakeRoot });
  c = ctx(parse(r.out));
  const tpl = `Session file template: ${path.join(fakeRoot, 'skills', 'end', 'report-template.md')}`;
  check('contract injects full rules, template path last', c.startsWith('# Heliotrop 1.0: orchestrator rules') && /I body/.test(c) &&
    c.trimEnd().endsWith(tpl), JSON.stringify(c.slice(-120)));

  // The real orchestrator rules, without CLAUDE_PLUGIN_ROOT (resolved from the hook's own path).
  r = run('session-start.js', { session_id: 'x', source: 'startup', cwd: lightDir });
  c = ctx(parse(r.out));
  const sections = c.match(/^#{2,3} .*/gm) || [];
  check('real orchestrator.md light mode', r.code === 0 && c.startsWith('# Heliotrop') &&
    ['## Triage', '## Explaining', '### Main context', '### Prompt cache'].every((h) => sections.includes(h)), `len=${c.length} sections=${sections.join(' | ')}`);
  r = run('session-start.js', { session_id: 'x', source: 'startup', cwd: contractDir });
  c = ctx(parse(r.out));
  const realTpl = path.join(HOOKS, '..', 'skills', 'end', 'report-template.md');
  check('real orchestrator.md with contract', r.code === 0 && /^# Heliotrop [\d.]+: orchestrator rules/.test(c) &&
    c.trimEnd().endsWith(`Session file template: ${realTpl}`) && fs.existsSync(realTpl), JSON.stringify(c.slice(-100)));

  // State files older than 7 days are deleted on SessionStart.
  const old = path.join(STATE, 'agent-old.json');
  fs.writeFileSync(old, '{"level":1}');
  const t = (Date.now() - 8 * 24 * 3600 * 1000) / 1000;
  fs.utimesSync(old, t, t);
  run('session-start.js', { session_id: 'x', source: 'startup', cwd: lightDir });
  check('state older than 7 days deleted', !fs.existsSync(old) && fs.existsSync(path.join(STATE, `main-${SID}.json`)), fs.readdirSync(STATE).join(','));

  // Every hook parses.
  for (const f of fs.readdirSync(HOOKS).filter((n) => n.endsWith('.js'))) {
    const s = spawnSync(process.execPath, ['--check', path.join(HOOKS, f)], { encoding: 'utf8' });
    check(`node --check ${f}`, s.status === 0, (s.stderr || '').trim().split('\n')[0] || 'ok');
  }
}

let crashed = null;
try { tests(); } catch (e) { crashed = e; }
try { fs.rmSync(ROOT, { recursive: true, force: true }); } catch (e) { /* leave it */ }

console.log(results.map((x) => x.line).join('\n'));
const failed = results.filter((x) => !x.ok).length;
if (crashed) console.log(`ERROR ${crashed.stack || crashed}`);
console.log(`${results.length - failed}/${results.length} passed`);
process.exit(failed || crashed ? 1 : 0);
