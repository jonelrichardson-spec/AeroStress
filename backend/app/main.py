from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import fleets, inspections, profile, turbines, turbines_global

app = FastAPI(
    title="AeroStress API",
    description="Predictive maintenance for wind turbines in complex terrain",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fleets.router)
app.include_router(turbines.router)
app.include_router(turbines_global.router)
app.include_router(inspections.router)
app.include_router(profile.router)


@app.get("/health")
def health():
    return {"status": "ok"}
