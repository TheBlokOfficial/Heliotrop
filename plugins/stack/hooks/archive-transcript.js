// Stop: keep a copy of the session's transcripts for the doctor, because the desktop app may delete them later.
// Only in projects with a stack contract. Never fails the session: silent, always exit 0.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

// Copies src to dst unless dst already has the same size and mtime.
function copyIfChanged(src, dst) {
  const s = fs.statSync(src);
  try {
    const d = fs.statSync(dst);
    if (d.size === s.size && Math.floor(d.mtimeMs) === Math.floor(s.mtimeMs)) return;
  } catch (e) { /* not archived yet */ }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  fs.utimesSync(dst, s.atime, s.mtime);
}

function run(input) {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  if (!fs.existsSync(path.join(projectDir, '.claude', 'project.md'))) return;
  if (!input.transcript_path || !fs.existsSync(input.transcript_path)) return;

  const srcDir = path.dirname(input.transcript_path);
  const dstDir = path.join(os.homedir(), '.claude', 'stack-archive', path.basename(srcDir));
  const files = [path.basename(input.transcript_path)];

  const id = input.session_id || path.basename(input.transcript_path, '.jsonl');
  const subDir = path.join(srcDir, id, 'subagents');
  if (fs.existsSync(subDir)) {
    for (const f of fs.readdirSync(subDir)) {
      if (/\.(jsonl|meta\.json)$/.test(f)) files.push(path.join(id, 'subagents', f));
    }
  }
  for (const rel of files) {
    try { copyIfChanged(path.join(srcDir, rel), path.join(dstDir, rel)); } catch (e) { /* skip this file */ }
  }
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  try { run(JSON.parse(raw.replace(/^﻿/, '') || '{}')); } catch (e) { /* never fail the session */ }
  process.exit(0);
});
process.stdin.on('error', () => process.exit(0));
