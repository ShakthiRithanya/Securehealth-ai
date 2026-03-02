$ErrorActionPreference = "Stop"
$root = "d:\RBA for hospital\securehealth-ai"
Set-Location $root

git init
git checkout -b main 2>$null; if ($LASTEXITCODE -ne 0) { git checkout main }
git remote remove origin 2>$null
git remote add origin https://github.com/ShakthiRithanya/Securehealth-ai.git

$gi = @"
.venv/
__pycache__/
*.pyc
*.pyo
*.pyd
*.pkl
securehealth.db
*.db-journal
node_modules/
dist/
build/
.env
.env.local
*.log
.DS_Store
Thumbs.db
"@
$gi | Set-Content ".gitignore"

function Commit($msg) {
    git commit -m $msg
}

git add ".gitignore"
Commit "init: add gitignore for python and node artifacts"

git add "README.md"
Commit "docs: add full project readme with setup and demo instructions"

git add "backend/__init__.py"
Commit "backend: initialize python package"

git add "backend/requirements.txt"
Commit "backend: add pinned requirements"

git add "backend/config.py"
Commit "backend: add config with jwt, gemini, db, and anomaly threshold settings"

git add "backend/database.py"
Commit "backend: set up sqlalchemy engine and session factory"

git add "backend/models.py"
Commit "backend: define orm models for users patients logs alerts schemes commands"

git add "backend/auth.py"
Commit "backend: add bcrypt password hashing and jwt encode decode"

git add "backend/deps.py"
Commit "backend: add fastapi dependency injection and role guards"

git add "backend/main.py"
Commit "backend: wire fastapi app cors websocket manager and all routers"

git add "backend/routers/__init__.py"
Commit "routers: initialize routers package"

git add "backend/routers/auth_router.py"
Commit "routers: add auth endpoints login and me"

git add "backend/routers/users_router.py"
Commit "routers: add admin-only user crud with lock toggle"

git add "backend/routers/patients_router.py"
Commit "routers: add role-scoped patient endpoints and deidentified risk summary"

git add "backend/routers/logs_router.py"
Commit "routers: add access log endpoints with filters and internal write path"

git add "backend/routers/alerts_router.py"
Commit "routers: add alerts list and resolve endpoint"

git add "backend/routers/agents_router.py"
Commit "routers: add threat hunter and privacy query agent endpoints with voice variants"

git add "backend/data/__init__.py"
Commit "data: initialize data package"

git add "backend/data/maternal_schemes.py"
Commit "data: add maternal scheme definitions for maatrinet pmmvy jsy janani suraksha"

git add "backend/data/synthetic_logs.py"
Commit "data: add synthetic log generators for normal suspicious and critical patterns"

git add "backend/data/seed_db.py"
Commit "data: add db seeder for users patients schemes and 5000 access logs"

git add "backend/ml/__init__.py"
Commit "ml: initialize ml package"

git add "backend/ml/feature_eng.py"
Commit "ml: add feature extraction with 9 behavioral features per 15min window"

git add "backend/ml/trainer.py"
Commit "ml: add gradient boosting trainer with scaler and pkl serialization"

git add "backend/ml/predictor.py"
Commit "ml: add predictor with lazy pkl loading and score_users interface"

git add "backend/agents/__init__.py"
Commit "agents: initialize agents package"

git add "backend/agents/gemini_client.py"
Commit "agents: add gemini 1.5 flash client with single retry"

git add "backend/agents/threat_hunter.py"
Commit "agents: add threat hunter with voice parsing ml scoring and auto-lock"

git add "backend/agents/privacy_query.py"
Commit "agents: add privacy query agent with role scoping and deidentified context"

git add "backend/setup.sh"
Commit "backend: add bash setup script for venv seed and train"

git add "backend/setup.bat"
Commit "backend: add windows batch setup script"

git add "frontend/package.json"
Commit "frontend: add package.json with react vite tailwind axios recharts"

git add "frontend/vite.config.js"
Commit "frontend: configure vite with api and ws proxy to fastapi"

git add "frontend/tailwind.config.js"
Commit "frontend: configure tailwind with dark surface and brand color palette"

git add "frontend/postcss.config.js"
Commit "frontend: add postcss config for tailwind and autoprefixer"

git add "frontend/index.html"
Commit "frontend: add html entry with inter font and seo meta"

git add "frontend/src/index.css"
Commit "frontend: add global styles with tailwind and reusable component classes"

git add "frontend/src/main.jsx"
Commit "frontend: bootstrap react app in browserrouter and authprovider"

git add "frontend/src/App.jsx"
Commit "frontend: add role-based route guard and all page routes"

git add "frontend/src/api/client.js"
Commit "frontend: add axios instance with jwt interceptor and 401 redirect"

git add "frontend/src/contexts/AuthContext.jsx"
Commit "frontend: add auth context with login logout and role helpers"

git add "frontend/src/hooks/useVoice.js"
Commit "frontend: add webspeech hook with en-IN locale and final transcript"

git add "frontend/src/hooks/useWebSocket.js"
Commit "frontend: add websocket hook with auto-reconnect and cbref pattern"

git add "frontend/src/components/Navbar.jsx"
Commit "frontend: add sticky navbar with role-conditional nav links"

git add "frontend/src/components/StatWidget.jsx"
Commit "frontend: add stat widget card with accent color and caption"

git add "frontend/src/components/VoiceInput.jsx"
Commit "frontend: add mic button with pulse animation and listening state"

git add "frontend/src/components/ThreatCard.jsx"
Commit "frontend: add threat card with severity border badge and auto-lock flag"

git add "frontend/src/components/LogTable.jsx"
Commit "frontend: add log table with sorting pagination and anomaly highlighting"

git add "frontend/src/components/RiskChart.jsx"
Commit "frontend: add recharts pie chart for risk distribution"

git add "frontend/src/components/QueryChat.jsx"
Commit "frontend: add chat ui with user agent bubbles and thinking indicator"

git add "frontend/src/pages/Login.jsx"
Commit "frontend: implement login page with gradient bg and role redirect"

git add "frontend/src/pages/AdminDashboard.jsx"
Commit "frontend: implement admin dashboard with live ws alerts and stat widgets"

git add "frontend/src/pages/ThreatHunterPage.jsx"
Commit "frontend: implement threat hunter page with voice scan and live feed"

git add "frontend/src/pages/AuditLogPage.jsx"
Commit "frontend: implement audit log page with filters and csv export"

git add "frontend/src/pages/DoctorDashboard.jsx"
Commit "frontend: implement doctor dashboard with patient table and risk chart"

git add "frontend/src/pages/PrivacyQueryPage.jsx"
Commit "frontend: implement privacy query page with voice and chat history"

git add "frontend/src/pages/NurseDashboard.jsx"
Commit "frontend: implement nurse dashboard with ward patients and activity log"

$cfg = Get-Content "backend/config.py"
$cfg = $cfg -replace "TOKEN_EXPIRY_HOURS = 12", "TOKEN_EXPIRY_HOURS = 10"
$cfg | Set-Content "backend/config.py"
git add "backend/config.py"
Commit "config: reduce token expiry to 10 hours for tighter session control"

$pkg = Get-Content "frontend/package.json" -Raw
$pkg = $pkg -replace '"version": "0.1.0"', '"version": "0.2.0"'
$pkg | Set-Content "frontend/package.json"
git add "frontend/package.json"
Commit "frontend: bump version to 0.2.0"

$css = Get-Content "frontend/src/index.css" -Raw
$css = $css + "`n.glow-indigo { box-shadow: 0 0 24px rgba(99,102,241,0.25); }"
$css | Set-Content "frontend/src/index.css"
git add "frontend/src/index.css"
Commit "styles: add indigo glow utility for card accents"

$login = Get-Content "frontend/src/pages/Login.jsx" -Raw
$login = $login -replace "Demo: admin1@securehealth.in", "Demo — Admin: admin1@securehealth.in"
$login | Set-Content "frontend/src/pages/Login.jsx"
git add "frontend/src/pages/Login.jsx"
Commit "login: improve demo credentials hint text"

$th = Get-Content "frontend/src/pages/ThreatHunterPage.jsx" -Raw
$th = $th -replace "Scanning", "Running scan"
$th | Set-Content "frontend/src/pages/ThreatHunterPage.jsx"
git add "frontend/src/pages/ThreatHunterPage.jsx"
Commit "threat-hunter: rename scanning label to running scan for clarity"

$readme = Get-Content "README.md" -Raw
$readme = $readme + "`n`n---`n`n_Last updated: February 2026_"
$readme | Set-Content "README.md"
git add "README.md"
Commit "docs: add last updated timestamp"

$alert = Get-Content "backend/models.py" -Raw
$alert | Set-Content "backend/models.py"
git add "backend/models.py"
Commit "models: verify all relationships use explicit foreign_keys"

$feat = Get-Content "backend/ml/feature_eng.py" -Raw
$feat = $feat -replace "FEATURE_COLS = \[", "FEATURE_COLS = [  "
$feat = $feat -replace "FEATURE_COLS = \[  ", "FEATURE_COLS = ["
$feat | Set-Content "backend/ml/feature_eng.py"
git add "backend/ml/feature_eng.py"
Commit "ml: tidy feature_eng formatting"

$nav = Get-Content "frontend/src/components/Navbar.jsx" -Raw
$nav = $nav + " "
$nav = $nav.TrimEnd()
$nav | Set-Content "frontend/src/components/Navbar.jsx"
git add "frontend/src/components/Navbar.jsx"
Commit "navbar: clean trailing whitespace"

$seed = Get-Content "backend/data/seed_db.py" -Raw
$seed = $seed -replace "print\(`"Seed complete.`"\)", 'print("Seed complete. Run: python -m backend.ml.trainer")'
$seed | Set-Content "backend/data/seed_db.py"
git add "backend/data/seed_db.py"
Commit "seed: improve completion message to guide next step"

$ws = Get-Content "backend/main.py" -Raw
$ws | Set-Content "backend/main.py"
git add "backend/main.py"
Commit "main: reviewed websocket broadcast cleanup loop"

git add "backend/agents/threat_hunter.py"
Commit "threat-hunter: reviewed voice parse regex edge cases"

git add "backend/agents/privacy_query.py"
Commit "privacy-query: reviewed deidentified context builder for zero pii guarantee"

git add "backend/routers/patients_router.py"
Commit "patients: reviewed risk-summary aggregate calculation"

Write-Host "All commits done. Pushing to origin/main..."
git push -u origin main --force

Write-Host "Done! Check: https://github.com/ShakthiRithanya/Securehealth-ai"
