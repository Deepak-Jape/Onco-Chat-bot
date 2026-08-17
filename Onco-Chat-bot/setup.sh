#!/usr/bin/env bash
#
# Oncosuite chat app -- one-shot local setup.
#
# Usage:
#   ./setup.sh /path/to/oncosuite_gold.dump
#
# Run this from the folder containing db.py, vocab.py, router.py, memory.py,
# citations.py, tools/, eval/, README.md (the files from the build).
#
# What it does, in order:
#   1. Checks for psql/pg_restore, downloads a standalone pg_restore 17 if
#      yours is too old to read the dump (same fix used in the sandbox build)
#   2. Creates the `oncosuite` database and required extensions
#   3. Restores the dump
#   4. Sets up a Python venv and installs psycopg2
#   5. Populates the vocab_terms table
#   6. Runs the eval harness to confirm everything works end to end
#
set -euo pipefail

DUMP_PATH="${1:-}"
DB_NAME="oncosuite"
PG17_URL="https://github.com/theseus-rs/postgresql-binaries/releases/download/17.10.0"

if [ -z "$DUMP_PATH" ]; then
  echo "Usage: ./setup.sh /path/to/oncosuite_gold.dump"
  exit 1
fi
if [ ! -f "$DUMP_PATH" ]; then
  echo "ERROR: dump file not found at $DUMP_PATH"
  exit 1
fi

echo "== 1/6: checking pg_restore version =="
PG_RESTORE_BIN="pg_restore"
if ! command -v pg_restore >/dev/null 2>&1; then
  echo "pg_restore not found on PATH -- is PostgreSQL installed and on PATH?"
  exit 1
fi

# The dump's archive format needs pg_restore >= 17. If the local one is older,
# pg_restore -l will fail with "unsupported version (1.16) in file header" --
# fall back to a standalone pg17 build, no system install needed.
if ! pg_restore -l "$DUMP_PATH" >/dev/null 2>/tmp/pgrestore_check.log; then
  echo "Local pg_restore can't read this dump format -- fetching a standalone pg17 build..."
  OS="$(uname -s)"
  ARCH="$(uname -m)"
  if [ "$OS" = "Darwin" ]; then
    ASSET="postgresql-17.10.0-x86_64-apple-darwin.tar.gz"
    [ "$ARCH" = "arm64" ] && ASSET="postgresql-17.10.0-aarch64-apple-darwin.tar.gz"
  else
    ASSET="postgresql-17.10.0-x86_64-unknown-linux-gnu.tar.gz"
  fi
  curl -sL "$PG17_URL/$ASSET" -o /tmp/pg17.tar.gz
  mkdir -p /tmp/pg17
  tar -xzf /tmp/pg17.tar.gz -C /tmp/pg17
  PG_RESTORE_BIN="$(find /tmp/pg17 -type f -name pg_restore | head -1)"
  echo "Using standalone pg_restore at: $PG_RESTORE_BIN"
fi

echo "== 2/6: creating database and extensions =="
if psql -lqt | cut -d '|' -f 1 | grep -qw "$DB_NAME"; then
  echo "Database '$DB_NAME' already exists, skipping create."
else
  createdb "$DB_NAME"
fi
psql -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS citext;"
psql -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
psql -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;"

echo "== 3/6: restoring dump (this can take a few minutes) =="
"$PG_RESTORE_BIN" --no-owner --no-privileges -d "$DB_NAME" "$DUMP_PATH" || {
  echo "pg_restore finished with warnings -- checking table count before treating as fatal..."
}
TRIAL_COUNT=$(psql -d "$DB_NAME" -tAc "SELECT count(*) FROM oncosuite_gold.trial_info;" 2>/dev/null || echo "0")
if [ "$TRIAL_COUNT" -lt 1 ]; then
  echo "ERROR: restore did not populate trial_info. Check /tmp/pgrestore_check.log and re-run."
  exit 1
fi
echo "Restore OK -- trial_info has $TRIAL_COUNT rows."

echo "== 4/6: setting up Python venv =="
if [ ! -d venv ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet psycopg2-binary

echo "== 5/6: populating vocab_terms =="
python3 vocab_build.py

echo "== 6/6: running eval harness =="
python3 eval/run_eval.py | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f\"tool_call_accuracy: {d['tool_call_accuracy']}\")
print(f\"escalation_accuracy: {d['escalation_accuracy']}\")
"

echo
echo "Setup complete. To use the app in a new shell:"
echo "  source venv/bin/activate"
echo "  python3 -c \"from router import handle_turn; print(handle_turn('s1', 'Show me recruiting Phase 3 trials for NSCLC KRAS'))\""
echo
echo "NOTE: db.py's DSN defaults to 'dbname=oncosuite' (local socket, OS-user auth)."
echo "If that fails to connect on your machine, edit db.py's DSN per the README."
