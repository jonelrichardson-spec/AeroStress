import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import fleets, inspections, model_review, profile, stress_overrides, turbines, turbines_global

app = FastAPI(
    title="AeroStress API",
    description="Predictive maintenance for wind turbines in complex terrain",
    version="0.1.0",
)

# CORS: localhost + Render + any Vercel deployment (*.vercel.app). Extra origins from env.
_cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://aerostress.onrender.com",
]
_extra = os.getenv("CORS_ORIGINS", "")
if _extra:
    _cors_origins = _cors_origins + [o.strip() for o in _extra.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # all Vercel preview and production URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fleets.router)
app.include_router(turbines.router)
app.include_router(turbines_global.router)
app.include_router(inspections.router)
app.include_router(model_review.router)
app.include_router(profile.router)
app.include_router(stress_overrides.router)


@app.get("/health")
def health():
    return {"status": "ok"}
