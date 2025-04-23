# TL Co‑Pilot

A mono‑repo containing:

- **AI Agent** (Python) — see [ai-logic/README.md](ai-logic/README.md)  
- **Storage API** (Express + MongoDB) — implemented in [storage/src/server.ts](storage/src/server.ts)  
- **Frontend** (Next.js) — see [frontend/README.md](frontend/README.md)  
- **STT Backend** — see [stt-backend/README.md](stt-backend/README.md) (if available)

## Prerequisites

- Node.js ≥ 18  
- pnpm or npm  
- Python ≥ 3.8  
- MongoDB instance (local or cloud)

## Getting Started

Clone the repo and enter the project root:

```bash
git clone <repository-url>
cd tl-co-pilot
```

### 1. Start the Storage API

```bash
cd storage
pnpm instal
# create a .env file at storage/.env with:
# DB_CONNECT=<your_mongo_connection_string>
pnpm run dev
```

### 2. Start the AI Agent

```bash
cd ai-logic
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# copy ai-logic/.env.example to ai-logic/.env and fill in any keys
python src/main.py
```

### 3. Start the Frontend

```bash
cd frontend
pnpm install     # or npm install
pnpm dev         # or npm run dev
```

### 4. (Optional) Start the STT Backend

```bash
cd stt-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# copy stt-backend/.env.example to stt-backend/.env and fill in any keys
python co-pilot-stt.py # Run the media converter to text
python co-pilot-transcription.py # Send args to the llm
```

## Environment Variables

- storage/.env — `DB_CONNECT`  
- ai-logic/.env
- stt-backend/.env
- frontend — no required env vars by default  
