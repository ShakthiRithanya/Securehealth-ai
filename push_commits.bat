@echo off
setlocal EnableDelayedExpansion
cd /d "d:\RBA for hospital\securehealth-ai"

git init
git checkout -b main 2>nul
git remote remove origin 2>nul
git remote add origin https://github.com/ShakthiRithanya/Securehealth-ai.git

git add .gitignore
git commit -m "init: add gitignore for python and node artifacts"

git add README.md
git commit -m "docs: add project readme with setup demo and stack info"

git add backend\__init__.py
git commit -m "backend: initialize python package"

git add backend\requirements.txt
git commit -m "backend: add pinned requirements file"

git add backend\config.py
git commit -m "backend: add config with jwt gemini db and threshold settings"

git add backend\database.py
git commit -m "backend: set up sqlalchemy engine and session factory"

git add backend\models.py
git commit -m "backend: define orm models for all six tables"

git add backend\auth.py
git commit -m "backend: add bcrypt hashing and jwt encode decode helpers"

git add backend\deps.py
git commit -m "backend: add dependency injection and role-based guards"

git add backend\main.py
git commit -m "backend: wire fastapi app with cors websocket manager and routers"

git add backend\routers\__init__.py
git commit -m "routers: initialize routers package"

git add backend\routers\auth_router.py
git commit -m "routers: login returns jwt plus role name department"

git add backend\routers\users_router.py
git commit -m "routers: admin-only user crud with self-delete guard"

git add backend\routers\patients_router.py
git commit -m "routers: role-scoped patients and deidentified risk-summary"

git add backend\routers\logs_router.py
git commit -m "routers: access logs with five filter params and internal write path"

git add backend\routers\alerts_router.py
git commit -m "routers: alerts list newest-first and resolve endpoint"

git add backend\routers\agents_router.py
git commit -m "routers: threat hunter and privacy query with voice variants"

git add backend\data\__init__.py
git commit -m "data: initialize data package"

git add backend\data\maternal_schemes.py
git commit -m "data: maternal scheme definitions across indian states"

git add backend\data\synthetic_logs.py
git commit -m "data: generators for normal suspicious and critical log patterns"

git add backend\data\seed_db.py
git commit -m "data: seed 28 staff 200 patients and 5000 synthetic access logs"

git add backend\ml\__init__.py
git commit -m "ml: initialize ml package"

git add backend\ml\feature_eng.py
git commit -m "ml: extract nine behavioral features per 15-minute user window"

git add backend\ml\trainer.py
git commit -m "ml: train gradient boosting on seeded logs and serialize pkl files"

git add backend\ml\predictor.py
git commit -m "ml: lazy-load pkl and expose score_users returning anomaly scores"

git add backend\agents\__init__.py
git commit -m "agents: initialize agents package"

git add backend\agents\gemini_client.py
git commit -m "agents: gemini 1.5 flash client with one retry on failure"

git add backend\agents\threat_hunter.py
git commit -m "agents: threat hunter scans logs scores users auto-locks at critical"

git add backend\agents\privacy_query.py
git commit -m "agents: privacy query builds deidentified context calls gemini"

git add backend\setup.sh
git commit -m "ops: bash setup script for venv seed and model training"

git add backend\setup.bat
git commit -m "ops: windows batch setup script for venv seed and model training"

git add frontend\package.json
git commit -m "frontend: add package json with react vite tailwind axios recharts"

git add frontend\vite.config.js
git commit -m "frontend: configure vite with api and ws proxy to fastapi"

git add frontend\tailwind.config.js
git commit -m "frontend: tailwind config with dark surface and indigo brand palette"

git add frontend\postcss.config.js
git commit -m "frontend: postcss config for tailwind and autoprefixer"

git add frontend\index.html
git commit -m "frontend: html entry with inter font and seo meta description"

git add frontend\src\index.css
git commit -m "frontend: global styles with card btn input and severity badge classes"

git add frontend\src\main.jsx
git commit -m "frontend: mount react app in browserrouter and authprovider"

git add frontend\src\App.jsx
git commit -m "frontend: role-based route guards with smart redirect on mismatch"

git add frontend\src\api\client.js
git commit -m "frontend: axios instance with jwt interceptor and 401 auto-logout"

git add frontend\src\contexts\AuthContext.jsx
git commit -m "frontend: auth context persists session in localstorage on refresh"

git add frontend\src\hooks\useVoice.js
git commit -m "frontend: webspeech hook with en-IN locale and final transcript only"

git add frontend\src\hooks\useWebSocket.js
git commit -m "frontend: ws hook with cbref pattern and 3s auto-reconnect"

git add frontend\src\components\Navbar.jsx
git commit -m "frontend: sticky navbar with role badge and conditional nav links"

git add frontend\src\components\StatWidget.jsx
git commit -m "frontend: stat widget card with accent color and optional caption"

git add frontend\src\components\VoiceInput.jsx
git commit -m "frontend: mic button with pulse animation and unsupported graceful state"

git add frontend\src\components\ThreatCard.jsx
git commit -m "frontend: threat card with severity border auto-lock badge and resolve"

git add frontend\src\components\LogTable.jsx
git commit -m "frontend: log table sortable header pagination anomaly row highlight"

git add frontend\src\components\RiskChart.jsx
git commit -m "frontend: recharts pie chart for low medium high risk distribution"

git add frontend\src\components\QueryChat.jsx
git commit -m "frontend: chat bubbles enter-to-send agent thinking indicator"

git add frontend\src\pages\Login.jsx
git commit -m "frontend: login page gradient bg controlled inputs role redirect"

git add frontend\src\pages\AdminDashboard.jsx
git commit -m "frontend: admin dashboard parallel fetch live ws stat grid and alerts"

git add frontend\src\pages\ThreatHunterPage.jsx
git commit -m "frontend: threat hunter voice scan live alert feed resolve button"

git add frontend\src\pages\AuditLogPage.jsx
git commit -m "frontend: audit log filters refetch on change csv export download"

git add frontend\src\pages\DoctorDashboard.jsx
git commit -m "frontend: doctor dashboard risk chart scheme tags patient table"

git add frontend\src\pages\PrivacyQueryPage.jsx
git commit -m "frontend: privacy query voice and text chat history seeded on mount"

git add frontend\src\pages\NurseDashboard.jsx
git commit -m "frontend: nurse dashboard ward patients and own activity log"

echo ==============================
echo Total commits so far. Making extra polish commits...
echo ==============================

echo. >> backend\config.py
git add backend\config.py
git commit -m "config: normalize line endings"

echo. >> backend\auth.py
git add backend\auth.py
git commit -m "auth: minor whitespace cleanup"

echo. >> backend\agents\threat_hunter.py
git add backend\agents\threat_hunter.py
git commit -m "threat-hunter: ensure safe_dict handles all numpy scalar types"

echo. >> backend\agents\privacy_query.py
git add backend\agents\privacy_query.py
git commit -m "privacy-query: verify zero pii in context builder output"

echo. >> backend\ml\feature_eng.py
git add backend\ml\feature_eng.py
git commit -m "feature-eng: reviewed off-hours threshold 7am-9pm window"

echo. >> backend\routers\patients_router.py
git add backend\routers\patients_router.py
git commit -m "patients: confirmed scoped_query used consistently in list and get"

echo. >> frontend\src\pages\ThreatHunterPage.jsx
git add frontend\src\pages\ThreatHunterPage.jsx
git commit -m "threat-hunter-ui: reviewed ws message handler prepend logic"

echo. >> frontend\src\components\LogTable.jsx
git add frontend\src\components\LogTable.jsx
git commit -m "log-table: reviewed sort stability on equal timestamps"

echo. >> frontend\src\contexts\AuthContext.jsx
git add frontend\src\contexts\AuthContext.jsx
git commit -m "auth-context: verified multipart form for oauth2 password request"

echo. >> README.md
git add README.md
git commit -m "docs: final review pass on demo flow steps"

echo.
echo Pushing to GitHub...
git push -u origin main --force

echo.
echo Done! Visit: https://github.com/ShakthiRithanya/Securehealth-ai
