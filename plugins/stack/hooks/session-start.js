// SessionStart: inject the orchestrator rules when the project has a stack contract.
'use strict';
const fs = require('fs');
const path = require('path');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const contract = path.join(projectDir, '.claude', 'project.md');

const context = fs.existsSync(contract)
  ? fs.readFileSync(path.join(pluginRoot, 'core', 'orchestrator.md'), 'utf8')
  : 'stack: this project has no contract (.claude/project.md), so the stack workflow is off; work normally. ' +
    'If the user wants the stack workflow here, suggest /stack:init.';

process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context },
}));
