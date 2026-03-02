# SecureHealth AI

> AI-agent powered security and access control system for Indian hospitals — built for hackathon demonstration.

---

## The Problem

Indian hospitals face a serious but underreported threat: **insider data misuse**. Doctors viewing hundreds of unrelated patient files, nurses exporting scheme data after hours, compromised credentials silently harvesting records — none of these are caught by traditional login systems. At the same time, healthcare staff cannot easily query de-identified aggregate data without risking accidental PII exposure.

---

## What SecureHealth AI Does

Two autonomous AI agents running inside a FastAPI backend:

### 🕵️ Threat Hunter Agent
- Watches access logs 24/7 using a trained **Gradient Boosting ML model**
- Assigns anomaly scores to every user session based on 9 behavioral features (pace, off-hours access, bulk exports, IP changes, role mismatches)
- Fires tiered alerts: **medium → high → critical**
- At critical threshold: **auto-locks the user account instantly**
- Triggered by **voice commands** from the admin UI ("Hunter, scan Ward D")
- Broadcasts alerts in real time over **WebSockets** — dashboard lights up live

### 🔒 Privacy Query Agent
- Lets doctors and admins ask **natural language questions** about their patients
- Built on **Gemini 1.5 Flash** with a strict de-identification layer
- Role-scoped: doctors only see their own patients, nurses see their ward only
- Returns aggregate statistics only — **zero names, zero Aadhaar, zero DOB** ever sent to the LLM
- Also **voice-activated**

### Role-Based Dashboards
| Role | What they see |
|---|---|
| Admin | Full user management, all logs, Threat Hunter control, live alert feed |
| Doctor | Assigned patients, risk distribution, scheme eligibility, Privacy Query |
| Nurse | Ward patient list, own activity log |

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Backend | FastAPI, SQLite, SQLAlchemy, JWT (python-jose), bcrypt (passlib), WebSockets |
| ML | scikit-learn GradientBoostingClassifier, StandardScaler, pandas, numpy |
| LLM | Google Gemini 1.5 Flash (google-generativeai) |
| Frontend | React 18, Vite 5, Tailwind CSS 3, react-router-dom 6, axios, Recharts |
| Voice | WebSpeech API (browser-native, no server audio processing) |
| Data | Synthetic hospital logs + maternal scheme data (MaatriNet, PMMVY, JSY, Janani Suraksha) |

---

## Prerequisites

- Python **3.11+**
- Node.js **18+** and npm
- A **Gemini API key** — set as environment variable before starting:

```bash
# Linux / macOS
export GEMINI_API_KEY="your_key_here"

# Windows
set GEMINI_API_KEY=your_key_here
```

---

## Setup

### 1. Clone and enter the project

```bash
git clone <repo-url>
cd securehealth-ai
```

### 2. Bootstrap the backend (one-time)

**Linux / macOS:**
```bash
bash backend/setup.sh
```

**Windows:**
```bat
backend\setup.bat
```

This script:
- Creates a Python virtual environment in `.venv`
- Installs all backend dependencies from `backend/requirements.txt`
- Seeds the SQLite database with synthetic hospital data (`seed_db.py`)
- Trains and saves the ML anomaly detection model (`trainer.py`)

### 3. Start the backend

```bash
# If not already in venv:
source .venv/bin/activate     # Linux/macOS
.venv\Scripts\activate        # Windows

uvicorn backend.main:app --reload
```

Backend runs at: **http://localhost:8000**  
Swagger docs: **http://localhost:8000/docs**

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## Demo Accounts

All passwords are set by `seed_db.py`.

| Role | Email | Password |
|---|---|---|
| Admin | admin1@securehealth.in | Admin@123 |
| Admin | admin2@securehealth.in | Admin@123 |
| Doctor | doctor1@securehealth.in | Doctor@123 |
| Doctor | doctor2@securehealth.in | Doctor@123 |
| Nurse | nurse1@securehealth.in | Nurse@123 |
| Nurse | nurse2@securehealth.in | Nurse@123 |

---

## Demo Flow

1. **Login as Admin** (`admin1@securehealth.in / Admin@123`) → land on Admin Dashboard with live stats
2. **Navigate to Threat Hunter** → click mic button → say _"Hunter, full scan"_ → watch agent run
3. **See alerts appear** in real time on screen — severity badges, anomaly scores, auto-lock flags
4. **Check Audit Log** → filter by `flagged=yes` → see highlighted rows with ML anomaly scores
5. **Resolve an alert** using the Resolve button → it disappears from the list
6. **Log out → Login as Doctor** (`doctor1@securehealth.in / Doctor@123`) → Doctor Dashboard
7. **See assigned patients** with risk scores and scheme eligibility (MaatriNet, PMMVY, JSY)
8. **Open Privacy Query** → type or speak _"Which of my patients are high risk?"_ → Gemini answers with aggregate stats, zero PII
9. **Try a scheme query** → _"How many of my patients qualify for PMMVY?"_ → instant de-identified answer
10. **Log out → Login as Nurse** → see only ward-scoped patient list and own activity log

---

## Project Structure

```
securehealth-ai/
├── backend/
│   ├── main.py               FastAPI app, WebSocket manager, router mounts
│   ├── config.py             JWT, Gemini key, DB path, anomaly thresholds
│   ├── database.py           SQLAlchemy engine + session
│   ├── models.py             ORM models (User, Patient, AccessLog, Alert, ...)
│   ├── auth.py               bcrypt + JWT utilities
│   ├── deps.py               FastAPI dependency injection + role guards
│   ├── routers/              6 API routers
│   ├── agents/               Threat Hunter + Privacy Query + Gemini client
│   ├── ml/                   Feature engineering, trainer, predictor
│   ├── data/                 Synthetic data generators, seeder, scheme data
│   ├── requirements.txt
│   ├── setup.sh
│   └── setup.bat
├── frontend/
│   ├── src/
│   │   ├── pages/            Login, AdminDashboard, ThreatHunterPage, ...
│   │   ├── components/       Navbar, StatWidget, ThreatCard, LogTable, ...
│   │   ├── hooks/            useVoice, useWebSocket
│   │   ├── contexts/         AuthContext
│   │   └── api/              axios client with JWT interceptor
│   ├── tailwind.config.js
│   └── vite.config.js
└── ml_models/
    ├── threat_model.pkl
    └── scaler.pkl
```

---


 
