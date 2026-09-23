from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.face_service import (
    generate_embedding,
    verify_face,
    analyze_liveness_frames
)


router = APIRouter()


# -----------------------------
# Face Enrollment
# -----------------------------

class FaceEnrollRequest(BaseModel):
    image: str


@router.post("/enroll")
async def enroll_face(request: FaceEnrollRequest):
    try:
        embedding = generate_embedding(request.image)

        return {
            "success": True,
            "embedding": embedding,
            "model": "ArcFace"
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:
        print("Face enrollment error:", error)

        raise HTTPException(
            status_code=500,
            detail="Face enrollment failed"
        )


# -----------------------------
# Face Verification
# -----------------------------

class FaceVerifyRequest(BaseModel):
    image: str
    embedding: list[float]


@router.post("/verify")
async def verify_face_endpoint(request: FaceVerifyRequest):
    try:
        result = verify_face(
            request.image,
            request.embedding
        )

        return {
            "success": True,
            "matched": result["matched"],
            "similarity": result["similarity"],
            "threshold": result["threshold"],
            "model": "ArcFace"
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:
        print("Face verification error:", error)

        raise HTTPException(
            status_code=500,
            detail="Face verification failed"
        )


# -----------------------------
# Liveness Verification
# -----------------------------

class LivenessRequest(BaseModel):
    images: list[str]


@router.post("/liveness")
async def check_liveness(request: LivenessRequest):
    try:
        result = analyze_liveness_frames(
            request.images
        )

        return {
            "success": True,
            "liveness": result["liveness"],
            "frames_analyzed": result["frames_analyzed"],
            "yaw_positions": result["yaw_positions"],
            "movement_threshold": result["movement_threshold"]
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:
        print(
            "Liveness verification error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Liveness verification failed"
        )