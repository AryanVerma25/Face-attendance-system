from fastapi import FastAPI

from app.routes.face import router as face_router


app = FastAPI(
    title="FaceSecure ML Service",
    version="1.0.0"
)


app.include_router(
    face_router,
    prefix="/api/v1/ml"
)


@app.get("/")
def root():
    return {
        "message": "FaceSecure ML Service is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }