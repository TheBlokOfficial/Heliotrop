// Smoke test for the engine hooks on synthetic input: never touches a live session.
// Usage: node tests/hooks/test.js   (exit code 0 = all checks pass)
// Creates its fixtures in a fresh folder under os.tmpdir(), points TEMP/TMP (and the home folder) there and deletes it
// at the end. The numbers come from hooks/common.js, the single source; only deliberate overrides are written here.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOKS = path.resolve(__dirname, '..', '..', 'plugins', 'heliotrop', 'hooks');
const REPO = path.resolve(__dirname, '..', '..');
const common = require(path.join(HOOKS, 'common.js'));
const {
  DEFAULT_BUDGET, DEFAULT_MAIN_NOTICE, DEFAULT_MAIN_HARD, MAIN_REMIND_STEP, WARN_AT, REMIND_EVERY, formatK: K,
} = common;

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'heliotrop-hooks-test-'));
const TMP = path.join(ROOT, 'tmp');
const HOME = path.join(ROOT, 'home');
const STATE = path.join(TMP, 'heliotrop-context-budget');
const W = path.join(ROOT, 'work');
const bareDir = path.join(W, 'nocontract'); // no contract, no notes
const legacyDir = path.join(W, 'legacy'); // 2.x notes only
const plainDir = path.join(W, 'plain'); // contract without overrides: the defaults apply
const notesDir = path.join(W, 'withcontract'); // contract with overrides
const deepDir = path.join(notesDir, 'src', 'deep'); // subdirectory of a project
const editDir = path.join(W, 'edit'); // contract with an on-edit check
const CONTRACT_TEXT = '# Project contract\nWe ship on Fridays.\ncontext-budget: 50k\nmain-context: 120k / 180k\n';

function writeContract(dir, text, name) {
  fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.claude', name || 'contract.md'), text);
}
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(HOME, { recursive: true });
fs.mkdirSync(bareDir, { recursive: true });
fs.mkdirSync(deepDir, { recursive: true });
writeContract(legacyDir, '# Project notes\ncontext-budget: 50k\non-edit: exit 1\n', 'project.md');
writeContract(plainDir, '# Project contract\n');
writeContract(notesDir, CONTRACT_TEXT);
writeContract(editDir, '# Project contract\non-edit: echo {file}; exit 1\n');

const env = Object.assign({}, process.env, { TEMP: TMP, TMP, TMPDIR: TMP, HOME, USERPROFILE: HOME });
delete env.CLAUDE_PROJECT_DIR;
delete env.CLAUDE_PLUGIN_ROOT;

function run(hook, input, extraEnv) {
  const r = spawnSync(process.execPath, [path.join(HOOKS, hook)], {
    input: JSON.stringify(input), env: Object.assign({}, env, extraEnv || {}), encoding: 'utf8',
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

function usage(tokens) {
  return { input_tokens: 10, cache_creation_input_tokens: 0, cache_read_input_tokens: tokens - 10, output_tokens: 5000 };
}
function entry(u, side) { return JSON.stringify({ type: 'assistant', isSidechain: !!side, message: { role: 'assistant', usage: u } }); }
function writeTranscript(f, lines) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, lines.join('\n') + '\n'); }

const results = [];
function check(name, cond, evidence) { results.push({ ok: !!cond, line: `${cond ? 'PASS' : 'FAIL'} ${name} :: ${evidence}` }); }
function parse(o) { try { return JSON.parse(o); } catch (e) { return null; } }
function ctx(j) { return (j && j.hookSpecificOutput && j.hookSpecificOutput.additionalContext) || ''; }
function lens(j) { return j ? `model=${ctx(j).length} user=${(j.systemMessage || '').length}` : ''; }
function readJson(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } }
const silent = (r) => r.out === '' && r.err === '' && r.code === 0;

function tests() {
  const SID = 'sess1';
  const main = path.join(W, 'proj', `${SID}.jsonl`);
  const base = { session_id: SID, transcript_path: main, cwd: plainDir, hook_event_name: 'PostToolUse', tool_name: 'Read' };
  let r; let j; let c;

  // Guard: without a contract no hook does anything, whatever the input.
  const noC = Object.assign({}, base, { cwd: bareDir });
  writeTranscript(main, [entry(usage(DEFAULT_MAIN_HARD + MAIN_REMIND_STEP))]);
  r = run('context-budget.js', noC);
  check('no contract: context-budget main silent even past the hard point', silent(r), `out='${r.out}' err='${r.err}'`);
  const agentN = path.join(W, 'proj', SID, 'subagents', 'agent-nc.jsonl');
  writeTranscript(agentN, [entry(usage(DEFAULT_BUDGET * 2), true)]);
  r = run('context-budget.js', Object.assign({}, noC, { agent_id: 'nc' }));
  check('no contract: context-budget subagent silent even far past the budget', silent(r), `out='${r.out}' err='${r.err}'`);
  check('no contract: no state written', !fs.existsSync(STATE) || fs.readdirSync(STATE).length === 0, fs.existsSync(STATE) ? fs.readdirSync(STATE).join(',') : 'no state dir');
  r = run('session-start.js', { session_id: 'x', source: 'startup', cwd: bareDir });
  check('no contract: session-start silent (no rules, no init suggestion)', silent(r), `out='${r.out}' err='${r.err}'`);
  r = run('post-edit.js', { cwd: bareDir, tool_name: 'Write', tool_input: { file_path: path.join(bareDir, 'a.txt') } });
  check('no contract: post-edit silent', silent(r), `out='${r.out}' err='${r.err}' code=${r.code}`);
  r = run('archive-transcript.js', { session_id: SID, transcript_path: main, cwd: bareDir });
  check('no contract: archive silent and copies nothing', silent(r) && !fs.existsSync(path.join(HOME, '.claude', 'heliotrop-archive')),
    `out='${r.out}' err='${r.err}'`);

  // Legacy 2.x notes without a contract: session-start gives one line, the other hooks stay silent.
  const legacyLine = 'Project notes from an earlier engine version found (.claude/project.md); the engine is inactive until ' +
    'they are migrated with /heliotrop:init.';
  r = run('session-start.js', { session_id: 'x', source: 'startup', cwd: legacyDir });
  j = parse(r.out);
  check('legacy project.md: session-start injects exactly the legacy line', j && ctx(j) === legacyLine && r.code === 0, JSON.stringify(ctx(j)));
  r = run('session-start.js', { session_id: 'x', source: 'startup', cwd: path.join(legacyDir, 'sub') });
  check('legacy project.md from a missing subdirectory still resolves upward', ctx(parse(r.out)) === legacyLine, JSON.stringify(ctx(parse(r.out))));
  r = run('context-budget.js', Object.assign({}, noC, { cwd: legacyDir }));
  check('legacy project.md: context-budget silent', silent(r), `out='${r.out}'`);
  r = run('post-edit.js', { cwd: legacyDir, tool_name: 'Write', tool_input: { file_path: path.join(legacyDir, 'a.txt') } });
  check('legacy project.md: post-edit silent (its on-edit is not run)', silent(r), `out='${r.out}' err='${r.err}' code=${r.code}`);
  r = run('archive-transcript.js', { session_id: SID, transcript_path: main, cwd: legacyDir });
  check('legacy project.md: archive silent and copies nothing', silent(r) && !fs.existsSync(path.join(HOME, '.claude', 'heliotrop-archive')), `out='${r.out}'`);

  // Finding the project: nearest directory upwards with .claude/contract.md.
  check('findProjectDir: from a subdirectory', common.findProjectDir(deepDir) === path.resolve(notesDir), String(common.findProjectDir(deepDir)));
  check('findProjectDir: none gives null', common.findProjectDir(bareDir) === null, String(common.findProjectDir(bareDir)));
  check('findProjectDir: a contract-less project.md is not a contract', common.findProjectDir(legacyDir) === null, String(common.findProjectDir(legacyDir)));

  // Main thread below the notice point: a sidechain entry far above must be skipped.
  writeTranscript(main, [entry(usage(DEFAULT_MAIN_NOTICE - 10000)), entry(usage(DEFAULT_MAIN_HARD + 100000), true)]);
  r = run('context-budget.js', base);
  check('main below the notice point: no output (sidechain skipped)', r.out === '' && r.code === 0, `out='${r.out}' code=${r.code}`);

  writeTranscript(main, [entry(usage(DEFAULT_MAIN_NOTICE))]);
  r = run('context-budget.js', base); j = parse(r.out);
  check('main notice point', j && ctx(j).startsWith(`Main context: ~${K(DEFAULT_MAIN_NOTICE)}`) && /Plan the landing/.test(ctx(j)) &&
    /\(orchestrator rules, Hard rules\)/.test(ctx(j)) && !/Heliotrop/.test(ctx(j)) && j.systemMessage.startsWith('Main context: '),
    `${j && j.systemMessage} [${lens(j)}]`);
  check('main notice texts <= 300 chars', j && ctx(j).length <= 300 && (j.systemMessage || '').length <= 300, lens(j));
  r = run('context-budget.js', base);
  check('main notice point not repeated', r.out === '', `out='${r.out}'`);

  writeTranscript(main, [entry(usage(DEFAULT_MAIN_HARD))]);
  r = run('context-budget.js', base); j = parse(r.out);
  check('main hard point', j && /^Main context: /.test(ctx(j)) && /hard point/.test(ctx(j)) && /heliotrop:handover/.test(ctx(j)) &&
    /ask what next/.test(ctx(j)) && /\(orchestrator rules, Hard rules\)/.test(ctx(j)) && /handing over/.test(j.systemMessage),
    `${j && j.systemMessage} [${lens(j)}]`);

  // Reminder step: one reminder per further MAIN_REMIND_STEP past the hard point.
  const remind1 = DEFAULT_MAIN_HARD + MAIN_REMIND_STEP;
  writeTranscript(main, [entry(usage(remind1))]);
  r = run('context-budget.js', base); j = parse(r.out);
  check('main first reminder one step past the hard point', j && ctx(j).startsWith(`Main context: ~${K(remind1)}`) &&
    new RegExp(`past the ~${K(DEFAULT_MAIN_HARD)} hard point`).test(ctx(j)), `${j && j.systemMessage} [${lens(j)}]`);
  r = run('context-budget.js', base);
  check('main first reminder not repeated', r.out === '', `out='${r.out}'`);
  writeTranscript(main, [entry(usage(remind1 + MAIN_REMIND_STEP - 1000))]);
  r = run('context-budget.js', base);
  check('main no reminder within the same step', r.out === '', `out='${r.out}'`);
  const remind2 = remind1 + MAIN_REMIND_STEP;
  writeTranscript(main, [entry(usage(remind2))]);
  r = run('context-budget.js', base); j = parse(r.out);
  check('main next reminder after a further step', j && ctx(j).startsWith(`Main context: ~${K(remind2)}`) && /hard point/.test(ctx(j)),
    `${j && j.systemMessage}`);

  // A compaction resets the level.
  fs.writeFileSync(path.join(STATE, `main-${SID}.json`), JSON.stringify({ level: 2 }));
  run('session-start.js', { session_id: SID, source: 'compact', cwd: plainDir, hook_event_name: 'SessionStart' });
  const st = readJson(path.join(STATE, `main-${SID}.json`));
  check('compact resets level, no cache field', st && st.level === -1 && !('cacheNotice' in st), JSON.stringify(st));
  const afterCompact = DEFAULT_MAIN_NOTICE + 10000;
  writeTranscript(main, [entry(usage(afterCompact))]);
  r = run('context-budget.js', base); j = parse(r.out);
  check('after compact the notice point fires again', j && new RegExp(`~${K(afterCompact)}`).test(j.systemMessage), `${j && j.systemMessage}`);

  // No prompt-cache notice any more: a 5-minute cache write at small context is silent.
  const SID2 = 'sess2';
  const main2 = path.join(W, 'proj', `${SID2}.jsonl`);
  const u5 = usage(20000);
  u5.cache_creation = { ephemeral_5m_input_tokens: 3000, ephemeral_1h_input_tokens: 0 };
  writeTranscript(main2, [entry(u5)]);
  r = run('context-budget.js', Object.assign({}, base, { session_id: SID2, transcript_path: main2 }));
  check('5-minute cache write: no notice', r.out === '', `out='${r.out}'`);

  // Subagent in a project without overrides: default budget.
  const agentF = path.join(W, 'proj', SID, 'subagents', 'agent-abc.jsonl');
  const warnTokens = Math.round(DEFAULT_BUDGET * (WARN_AT + 0.05));
  writeTranscript(agentF, [entry(usage(warnTokens), true)]);
  const sub = Object.assign({}, base, { agent_id: 'abc', agent_type: 'heliotrop:researcher' });
  r = run('context-budget.js', sub); j = parse(r.out);
  const lvl0 = ctx(j);
  check('subagent warning at the default budget',
    j && lvl0.startsWith(`Context budget: ~${K(warnTokens)} tokens of the ~${K(DEFAULT_BUDGET)}`) && /Plan to finish within the budget/.test(lvl0) &&
    /`Status: partial` with the remaining steps \(protocol\)\.$/.test(lvl0) && !/Heliotrop/.test(lvl0) && !j.systemMessage, lvl0.slice(0, 90));
  r = run('context-budget.js', sub);
  check('subagent warning once', r.out === '', `out='${r.out}'`);
  const pastTokens = DEFAULT_BUDGET + 1000;
  writeTranscript(agentF, [entry(usage(pastTokens), true)]);
  r = run('context-budget.js', sub); j = parse(r.out);
  const lvl1 = ctx(j);
  check('subagent budget reached', j && lvl1.startsWith(`Context budget: ~${K(pastTokens)} tokens, past the ~${K(DEFAULT_BUDGET)} slice budget. Wrap up:`) &&
    /`Status: partial` with the remaining steps; only the build and tests of finished work may still run; if only these remained and they pass, return as usual \(protocol\)\.$/.test(lvl1) &&
    !/commit/.test(lvl1), lvl1.slice(0, 90));
  check('subagent level 0 and 1 use the same wording for the rest', /with the remaining steps/.test(lvl0) && /with the remaining steps/.test(lvl1), 'both say "with the remaining steps"');
  const farTokens = Math.round(DEFAULT_BUDGET * (1 + 2 * REMIND_EVERY + 0.05));
  writeTranscript(agentF, [entry(usage(farTokens), true)]);
  r = run('context-budget.js', sub); j = parse(r.out);
  check('subagent far past the budget: stop', j && ctx(j).startsWith('Context budget: ') &&
    new RegExp(`far past the ~${K(DEFAULT_BUDGET)} slice budget\\. Stop now and return \`Status: partial\` \\(protocol\\)\\.$`).test(ctx(j)), ctx(j).slice(0, 90));
  // Subagent in a project whose contract overrides the budget (50k).
  const agentG = path.join(W, 'proj', SID, 'subagents', 'agent-def.jsonl');
  writeTranscript(agentG, [entry(usage(45000), true)]);
  r = run('context-budget.js', Object.assign({}, sub, { agent_id: 'def', cwd: notesDir })); j = parse(r.out);
  check('subagent with a contract override of the budget', j && /~45k tokens of the ~50k/.test(ctx(j)), ctx(j).slice(0, 90));
  // The same from a subdirectory of the project.
  const agentS = path.join(W, 'proj', SID, 'subagents', 'agent-sub.jsonl');
  writeTranscript(agentS, [entry(usage(45000), true)]);
  r = run('context-budget.js', Object.assign({}, sub, { agent_id: 'sub', cwd: deepDir })); j = parse(r.out);
  check('contract found from a subdirectory cwd (context-budget)', j && /~45k tokens of the ~50k/.test(ctx(j)), ctx(j).slice(0, 90));
  // Overrides are matched at line start only: an indented line does not count.
  const indentDir = path.join(W, 'indented');
  writeContract(indentDir, '# Project contract\n  context-budget: 50k\n  main-context: 10k / 20k\n');
  const agentH = path.join(W, 'proj', SID, 'subagents', 'agent-ghi.jsonl');
  writeTranscript(agentH, [entry(usage(45000), true)]);
  r = run('context-budget.js', Object.assign({}, sub, { agent_id: 'ghi', cwd: indentDir }));
  check('override not at line start ignored (default budget)', r.out === '', `out='${r.out}'`);
  // main-context override from the contract: 30k / 40k.
  const mainDir = path.join(W, 'mainpoints');
  writeContract(mainDir, '# Project contract\nmain-context: 30k / 40k\n');
  const SID4 = 'sess4';
  const main4 = path.join(W, 'proj', `${SID4}.jsonl`);
  writeTranscript(main4, [entry(usage(35000))]);
  r = run('context-budget.js', Object.assign({}, base, { session_id: SID4, transcript_path: main4, cwd: mainDir })); j = parse(r.out);
  check('main-context override: notice at its first point', j && /^Main context: ~35k/.test(ctx(j)), `${j && j.systemMessage}`);
  // Subagent calls leave the main state alone.
  const st2 = readJson(path.join(STATE, `main-${SID}.json`));
  check('subagent call leaves main state', st2 && st2.level === 0, JSON.stringify(st2));

  // post-edit: the contract's on-edit check, found from the project or a subdirectory.
  const edited = path.join(editDir, 'a.txt');
  r = run('post-edit.js', { cwd: editDir, tool_name: 'Write', tool_input: { file_path: edited } });
  check('post-edit failing check: exit 2 and the notice prefix', r.code === 2 && r.err.startsWith(`On-edit check failed for ${edited}:`) && !/Heliotrop/.test(r.err),
    `code=${r.code} err='${r.err.slice(0, 80)}'`);
  fs.mkdirSync(path.join(editDir, 'sub'), { recursive: true });
  r = run('post-edit.js', { cwd: path.join(editDir, 'sub'), tool_name: 'Write', tool_input: { file_path: edited } });
  check('contract found from a subdirectory cwd (post-edit)', r.code === 2 && /^On-edit check failed for /.test(r.err), `code=${r.code}`);
  r = run('post-edit.js', { cwd: plainDir, tool_name: 'Write', tool_input: { file_path: edited } });
  check('post-edit without an on-edit line: silent', silent(r), `code=${r.code} err='${r.err}'`);

  // archive: with a contract the transcript is copied (home folder is redirected into the fixtures).
  r = run('archive-transcript.js', { session_id: SID, transcript_path: main, cwd: deepDir });
  check('archive with a contract found from a subdirectory copies the transcript',
    r.code === 0 && fs.existsSync(path.join(HOME, '.claude', 'heliotrop-archive', 'proj', `${SID}.jsonl`)), `code=${r.code}`);

  // SessionStart: the rules with the placeholders replaced, then the contract, with a fake plugin root.
  const fakeRoot = path.join(W, 'plugin');
  fs.mkdirSync(path.join(fakeRoot, 'core'), { recursive: true });
  const rulesFixture = [
    '# Orchestrator rules', '', 'Intro.', '',
    '## Hard rules', 'Budget {{context-budget}}; notice {{main-notice}}; hard {{main-hard}}; step {{main-remind}}; again {{context-budget}}.', '',
    '## Guidance', 'G body', ''].join('\n');
  fs.writeFileSync(path.join(fakeRoot, 'core', 'orchestrator.md'), rulesFixture);
  const expectedLine = (b, n, h, s) => `Budget ${b}; notice ${n}; hard ${h}; step ${s}; again ${b}.`;
  r = run('session-start.js', { session_id: 'x', source: 'startup', cwd: plainDir }, { CLAUDE_PLUGIN_ROOT: fakeRoot });
  c = ctx(parse(r.out));
  check('placeholders replaced by the defaults, none left',
    c.includes(expectedLine(K(DEFAULT_BUDGET), K(DEFAULT_MAIN_NOTICE), K(DEFAULT_MAIN_HARD), K(MAIN_REMIND_STEP))) && !c.includes('{{'),
    JSON.stringify(c.split('\n')[5]));
  r = run('session-start.js', { session_id: 'x', source: 'startup', cwd: notesDir }, { CLAUDE_PLUGIN_ROOT: fakeRoot });
  c = ctx(parse(r.out));
  check('placeholders replaced by the contract overrides, none left',
    c.includes(expectedLine('50k', '120k', '180k', K(MAIN_REMIND_STEP))) && !c.includes('{{'), JSON.stringify(c.split('\n')[5]));
  check('contract follows the rules under its heading, no init suggestion',
    c.startsWith('# Orchestrator rules') && /G body\n\n# Project contract \(\.claude\/contract\.md\)\n\n# Project contract\nWe ship on Fridays\./.test(c) &&
    c.trimEnd().endsWith('main-context: 120k / 180k') && !/\/heliotrop:init|No project notes|earlier engine version/.test(c),
    JSON.stringify(c.slice(-120)));
  r = run('session-start.js', { session_id: 'x', source: 'startup', cwd: deepDir }, { CLAUDE_PLUGIN_ROOT: fakeRoot });
  check('contract found from a subdirectory cwd (session-start)', ctx(parse(r.out)) === c, `len=${ctx(parse(r.out)).length}`);
  r = run('session-start.js', { session_id: 'x', source: 'startup', cwd: notesDir }, { CLAUDE_PLUGIN_ROOT: fakeRoot, CLAUDE_PROJECT_DIR: deepDir });
  check('CLAUDE_PROJECT_DIR is walked up as well', ctx(parse(r.out)) === c, `len=${ctx(parse(r.out)).length}`);

  // The real orchestrator rules, without CLAUDE_PLUGIN_ROOT (resolved from the hook's own path). Tolerant: the
  // rules may not contain placeholders yet; when they do, the defaults must appear in their place.
  const realRules = fs.readFileSync(path.join(HOOKS, '..', 'core', 'orchestrator.md'), 'utf8').trimEnd();
  r = run('session-start.js', { session_id: 'x', source: 'startup', cwd: plainDir });
  c = ctx(parse(r.out));
  const hasPlaceholders = /\{\{(context-budget|main-notice|main-hard|main-remind)\}\}/.test(realRules);
  const realExpected = realRules.split('{{context-budget}}').join(K(DEFAULT_BUDGET)).split('{{main-notice}}').join(K(DEFAULT_MAIN_NOTICE))
    .split('{{main-hard}}').join(K(DEFAULT_MAIN_HARD)).split('{{main-remind}}').join(K(MAIN_REMIND_STEP));
  check('real orchestrator.md: rules with the defaults substituted, then the contract, no placeholder left',
    r.code === 0 && c.startsWith(realExpected) && !c.includes('{{') && c.includes('\n\n# Project contract (.claude/contract.md)\n\n# Project contract'),
    `placeholders in orchestrator.md: ${hasPlaceholders ? 'yes' : 'not yet'}; len=${c.length}`);

  // State files older than 7 days are deleted on SessionStart, with or without a contract.
  const old = path.join(STATE, 'agent-old.json');
  fs.writeFileSync(old, '{"level":1}');
  const t = (Date.now() - 8 * 24 * 3600 * 1000) / 1000;
  fs.utimesSync(old, t, t);
  run('session-start.js', { session_id: 'x', source: 'startup', cwd: bareDir });
  check('state older than 7 days deleted', !fs.existsSync(old) && fs.existsSync(path.join(STATE, `main-${SID}.json`)), fs.readdirSync(STATE).join(','));

  // The plugin version equals the newest version heading of the CHANGELOG.
  const version = (readJson(path.join(REPO, 'plugins', 'heliotrop', '.claude-plugin', 'plugin.json')) || {}).version;
  const heading = (fs.readFileSync(path.join(REPO, 'CHANGELOG.md'), 'utf8').match(/^## (\d+\.\d+\.\d+)\b/m) || [])[1];
  check('plugin.json version equals the newest CHANGELOG heading', version && version === heading, `plugin.json=${version} CHANGELOG=${heading}`);

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
