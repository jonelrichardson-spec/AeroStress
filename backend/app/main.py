from fastapi import FastAPI

app = FastAPI(
    title="AeroStress API",
    description="Predictive maintenance for wind turbines in complex terrain",
    version="0.1.0",
)


@app.get("/health")
def health():
    return {"status": "ok"}
