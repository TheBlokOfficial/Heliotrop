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
const bareDir = path.join(W, 'nonotes');
const notesDir = path.join(W, 'withnotes');
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(bareDir, { recursive: true });
fs.mkdirSync(path.join(notesDir, '.claude'), { recursive: true });
fs.writeFileSync(path.join(notesDir, '.claude', 'project.md'), '# Notes\nWe ship on Fridays.\ncontext-budget: 50k\nmain-context: 150k / 200k\n');

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
  const base = { session_id: SID, transcript_path: main, cwd: bareDir, hook_event_name: 'PostToolUse', tool_name: 'Read' };
  const one = { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 500 };
  let r; let j; let c;

  // Main thread below 150k: a sidechain entry with 300k must be skipped.
  writeTranscript(main, [entry(usage(140000, one)), entry(usage(300000, one), true)]);
  r = run('context-budget.js', base);
  check('main <150k no output (sidechain 300k skipped)', r.out === '' && r.code === 0, `out='${r.out}' code=${r.code}`);

  writeTranscript(main, [entry(usage(150000, one))]);
  r = run('context-budget.js', base); j = parse(r.out);
  check('main 150k notice', j && /^Heliotrop main context: ~150k/.test(ctx(j)) && /write down open decisions/.test(ctx(j)) &&
    /\(orchestrator rules, Hard rules\)/.test(ctx(j)) && !/session file/.test(ctx(j)) && /^Heliotrop main context/.test(j.systemMessage),
    `${j && j.systemMessage} [${lens(j)}]`);
  check('main notice texts <= 300 chars', j && ctx(j).length <= 300 && (j.systemMessage || '').length <= 300, lens(j));
  r = run('context-budget.js', base);
  check('main 150k not repeated', r.out === '', `out='${r.out}'`);

  writeTranscript(main, [entry(usage(200000, one))]);
  r = run('context-budget.js', base); j = parse(r.out);
  check('main 200k hard point', j && /hard point/.test(ctx(j)) && /heliotrop:handover/.test(ctx(j)) && /ask what next/.test(ctx(j)) &&
    /\(orchestrator rules, Hard rules\)/.test(ctx(j)) && /handing over/.test(j.systemMessage), `${j && j.systemMessage} [${lens(j)}]`);

  writeTranscript(main, [entry(usage(250000, one))]);
  r = run('context-budget.js', base); j = parse(r.out);
  check('main 250k reminder', j && /past the ~200k hard point/.test(ctx(j)), `${j && j.systemMessage} [${lens(j)}]`);
  r = run('context-budget.js', base);
  check('main 250k not repeated', r.out === '', `out='${r.out}'`);

  // A compaction resets the level and keeps cacheNotice.
  fs.writeFileSync(path.join(STATE, `main-${SID}.json`), JSON.stringify({ level: 2, cacheNotice: true }));
  run('session-start.js', { session_id: SID, source: 'compact', cwd: bareDir, hook_event_name: 'SessionStart' });
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

  // Subagent with agent_id and no project notes: default 100k budget.
  const agentF = path.join(W, 'proj', SID, 'subagents', 'agent-abc.jsonl');
  writeTranscript(agentF, [entry(usage(85000), true)]);
  const sub = Object.assign({}, base, { agent_id: 'abc', agent_type: 'heliotrop:researcher' });
  r = run('context-budget.js', sub); j = parse(r.out);
  check('subagent no notes 85k warning (default 100k)',
    j && /^Heliotrop context budget: ~85k tokens of the ~100k/.test(ctx(j)) && /Plan to finish within the budget/.test(ctx(j)) &&
    /`Status: partial` with the rest \(protocol\)\.$/.test(ctx(j)) && !j.systemMessage, ctx(j).slice(0, 90));
  r = run('context-budget.js', sub);
  check('subagent warning once', r.out === '', `out='${r.out}'`);
  writeTranscript(agentF, [entry(usage(101000), true)]);
  r = run('context-budget.js', sub); j = parse(r.out);
  check('subagent 101k budget reached', j && /^Heliotrop context budget: ~101k tokens, past the ~100k slice budget\. Wrap up:/.test(ctx(j)) &&
    /only the build, tests and commit of finished work may still run; if only these remained and they pass, return as usual \(protocol\)\.$/.test(ctx(j)), ctx(j).slice(0, 90));
  writeTranscript(agentF, [entry(usage(125000), true)]);
  r = run('context-budget.js', sub); j = parse(r.out);
  check('subagent 125k far past, stop', j && /far past the ~100k slice budget\. Stop now and return `Status: partial` \(protocol\)\.$/.test(ctx(j)), ctx(j).slice(0, 90));
  // Subagent in a project whose notes set a 50k budget.
  const agentG = path.join(W, 'proj', SID, 'subagents', 'agent-def.jsonl');
  writeTranscript(agentG, [entry(usage(45000), true)]);
  r = run('context-budget.js', Object.assign({}, sub, { agent_id: 'def', cwd: notesDir })); j = parse(r.out);
  check('subagent notes 50k budget', j && /~45k tokens of the ~50k/.test(ctx(j)), ctx(j).slice(0, 90));
  // Overrides in the notes are matched at line start only: an indented line does not count.
  const indentDir = path.join(W, 'indented');
  fs.mkdirSync(path.join(indentDir, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(indentDir, '.claude', 'project.md'), '# Notes\n  context-budget: 50k\n  main-context: 10k / 20k\n');
  const agentH = path.join(W, 'proj', SID, 'subagents', 'agent-ghi.jsonl');
  writeTranscript(agentH, [entry(usage(45000), true)]);
  r = run('context-budget.js', Object.assign({}, sub, { agent_id: 'ghi', cwd: indentDir }));
  check('override not at line start ignored (subagent default 100k)', r.out === '', `out='${r.out}'`);
  // main-context override from the notes: 30k / 40k.
  const mainDir = path.join(W, 'mainpoints');
  fs.mkdirSync(path.join(mainDir, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(mainDir, '.claude', 'project.md'), '# Notes\nmain-context: 30k / 40k\n');
  const SID4 = 'sess4';
  const main4 = path.join(W, 'proj', `${SID4}.jsonl`);
  writeTranscript(main4, [entry(usage(35000, one))]);
  r = run('context-budget.js', Object.assign({}, base, { session_id: SID4, transcript_path: main4, cwd: mainDir })); j = parse(r.out);
  check('main-context override 30k notice', j && /^Heliotrop main context: ~35k/.test(ctx(j)), `${j && j.systemMessage}`);
  // Subagent calls leave the main state alone.
  const st2 = readJson(path.join(STATE, `main-${SID}.json`));
  check('subagent call leaves main state', st2 && st2.level === 0, JSON.stringify(st2));

  // SessionStart: the core always, then the project notes or the init line, with a fake plugin root.
  const fakeRoot = path.join(W, 'plugin');
  fs.mkdirSync(path.join(fakeRoot, 'core'), { recursive: true });
  fs.writeFileSync(path.join(fakeRoot, 'core', 'orchestrator.md'), [
    '# Heliotrop 2.0: orchestrator rules', '', 'Intro.', '', '## Hard rules', 'H body', '', '## Guidance', 'G body', ''].join('\n'));
  const initLine = 'No project notes (.claude/project.md): suggest /heliotrop:init at most once, only when the work would benefit.';
  r = run('session-start.js', { session_id: 'x', source: 'startup', cwd: bareDir }, { CLAUDE_PLUGIN_ROOT: fakeRoot });
  c = ctx(parse(r.out));
  check('no notes: full core, init line last, no light mode', c.startsWith('# Heliotrop 2.0: orchestrator rules') && /## Guidance\nG body/.test(c) &&
    c.trimEnd().endsWith(initLine) && !/light mode|Project notes \(|Session file template/.test(c), JSON.stringify(c.slice(-140)));
  r = run('session-start.js', { session_id: 'x', source: 'startup', cwd: notesDir }, { CLAUDE_PLUGIN_ROOT: fakeRoot });
  c = ctx(parse(r.out));
  check('notes: core, then the notes under their heading, no init line', c.startsWith('# Heliotrop 2.0: orchestrator rules') &&
    /G body\n\n# Project notes \(\.claude\/project\.md\)\n\n# Notes\nWe ship on Fridays\./.test(c) && c.trimEnd().endsWith('main-context: 150k / 200k') &&
    !/No project notes|light mode|Session file template/.test(c), JSON.stringify(c.slice(-160)));

  // The real orchestrator rules, without CLAUDE_PLUGIN_ROOT (resolved from the hook's own path).
  const realRules = fs.readFileSync(path.join(HOOKS, '..', 'core', 'orchestrator.md'), 'utf8').trimEnd();
  r = run('session-start.js', { session_id: 'x', source: 'startup', cwd: bareDir });
  c = ctx(parse(r.out));
  check('real orchestrator.md without notes', r.code === 0 && c.startsWith(realRules) && c.trimEnd().endsWith(initLine) && !/light mode/.test(c),
    `len=${c.length} tail=${JSON.stringify(c.slice(-60))}`);
  r = run('session-start.js', { session_id: 'x', source: 'startup', cwd: notesDir });
  c = ctx(parse(r.out));
  check('real orchestrator.md with notes', r.code === 0 && c.startsWith(realRules) && c.includes('\n\n# Project notes (.claude/project.md)\n\n# Notes\nWe ship on Fridays.') &&
    !/light mode|Session file template/.test(c), JSON.stringify(c.slice(-100)));

  // State files older than 7 days are deleted on SessionStart.
  const old = path.join(STATE, 'agent-old.json');
  fs.writeFileSync(old, '{"level":1}');
  const t = (Date.now() - 8 * 24 * 3600 * 1000) / 1000;
  fs.utimesSync(old, t, t);
  run('session-start.js', { session_id: 'x', source: 'startup', cwd: bareDir });
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
