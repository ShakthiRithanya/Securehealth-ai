@echo off
setlocal

cd /d "%~dp0.."

if not exist ".venv" (
    python -m venv .venv
)

call .venv\Scripts\activate

python -m pip install --quiet --upgrade pip
python -m pip install --quiet -r backend\requirements.txt

echo Dependencies installed.

python -m backend.data.seed_db
echo Database seeded.

python -m backend.ml.trainer
echo Model trained and saved.

echo Setup complete. Run: uvicorn backend.main:app --reload

endlocal
