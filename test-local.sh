#!/bin/bash

# ── Test your agents locally before pushing to GitHub ──
#
# Usage:
#   1. Export your API keys:
#      export ANTHROPIC_API_KEY="sk-ant-..."
#      export RESEND_API_KEY="re_..."        (optional — skips email, prints to console)
#      export ROSS_EMAIL="you@example.com"   (optional — only needed if sending email)
#
#   2. Run:
#      bash test-local.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Supplement Agent — Local Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for Anthropic key
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "ERROR: ANTHROPIC_API_KEY not set."
  echo ""
  echo "Get one at: https://console.anthropic.com/settings/keys"
  echo "Then run:   export ANTHROPIC_API_KEY=\"sk-ant-...\""
  echo ""
  exit 1
fi

echo "✓ Anthropic API key found"

if [ -z "$RESEND_API_KEY" ]; then
  echo "⚠ No RESEND_API_KEY — will print briefing to console instead of emailing"
else
  echo "✓ Resend API key found"
fi

echo ""
echo "Running agents (this takes 30-60 seconds)..."
echo ""

node agents/daily-briefing.mjs
