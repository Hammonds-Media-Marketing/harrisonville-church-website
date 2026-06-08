#!/bin/bash
# SessionStart hook: validate the .claude workflow config before any build
# work begins. Read-only and fast. It never aborts the session — on failure
# it prints a loud alert so the broken references land in session context.
set -euo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"

if ! command -v node >/dev/null 2>&1; then
  echo "session-start: node not found; skipping Claude config validation."
  exit 0
fi

if node "$ROOT/.claude/scripts/validate-claude-config.mjs" "$ROOT"; then
  exit 0
fi

echo ""
echo "‼️  CLAUDE.md workflow validation FAILED — broken references listed above."
echo "    Skills or @-imports that point at missing files will not load."
echo "    Fix these before running a build."
exit 0
