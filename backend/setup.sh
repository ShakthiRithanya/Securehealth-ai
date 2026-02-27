#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate

pip install --quiet --upgrade pip
pip install --quiet -r backend/requirements.txt

echo "Dependencies installed."

python -m backend.data.seed_db
echo "Database seeded."

python -m backend.ml.trainer
echo "Model trained and saved."

echo "Setup complete. Run: uvicorn backend.main:app --reload"
