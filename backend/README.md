# AeroStress Backend

API, terrain classification, and stress calculation services.

## Structure

```
backend/
├── app/
│   ├── api/         # Route handlers
│   ├── models/      # Data models
│   ├── services/    # Business logic (terrain, stress scoring)
│   └── main.py      # FastAPI app
├── tests/
└── requirements.txt
```

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload
```
