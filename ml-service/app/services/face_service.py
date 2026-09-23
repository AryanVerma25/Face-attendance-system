import base64

import cv2
import numpy as np
from insightface.app import FaceAnalysis


# Load the face recognition model once
face_app = FaceAnalysis(
    name="buffalo_l",
    providers=["CPUExecutionProvider"]
)

face_app.prepare(
    ctx_id=0,
    det_size=(640, 640)
)


def generate_embedding(image_data: str):
    """
    Decode the base64 image, detect exactly one face,
    and generate an ArcFace embedding.
    """

    try:
        # Remove the data URL prefix if present
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]

        # Decode base64
        image_bytes = base64.b64decode(image_data)

        # Convert bytes to numpy array
        image_array = np.frombuffer(
            image_bytes,
            dtype=np.uint8
        )

        # Decode image using OpenCV
        image = cv2.imdecode(
            image_array,
            cv2.IMREAD_COLOR
        )

        if image is None:
            raise ValueError("Invalid image data")

        # Detect faces
        faces = face_app.get(image)

        # We need exactly one face for enrollment
        if len(faces) == 0:
            raise ValueError(
                "No face detected. Please position your face clearly."
            )

        if len(faces) > 1:
            raise ValueError(
                "Multiple faces detected. Only one person should be visible."
            )

        face = faces[0]

        # Get ArcFace embedding
        embedding = face.embedding

        if embedding is None:
            raise ValueError(
                "Unable to generate face embedding."
            )

        # Normalize embedding
        embedding = embedding / np.linalg.norm(embedding)

        return embedding.astype(float).tolist()

    except ValueError:
        raise

    except Exception as error:
        print("Embedding generation error:", error)

        raise ValueError(
            "Unable to process the face image."
        )

def verify_face(image_data: str, stored_embedding: list):
    current_embedding = generate_embedding(image_data)

    current = np.array(current_embedding, dtype=np.float32)
    stored = np.array(stored_embedding, dtype=np.float32)

    # Normalize both embeddings
    current = current / np.linalg.norm(current)
    stored = stored / np.linalg.norm(stored)

    # Cosine similarity
    similarity = float(np.dot(current, stored))

    # Temporary threshold for testing.
    # We will tune this after testing real samples.
    threshold = 0.45

    return {
        "matched": similarity >= threshold,
        "similarity": similarity,
        "threshold": threshold
    }
def analyze_liveness_frames(images: list[str]):
    """
    Basic challenge-response liveness check using
    head movement across multiple camera frames.

    Expected sequence:
    1. Center
    2. Turn left
    3. Turn right

    This is a prototype liveness check.
    It should be strengthened with a dedicated
    anti-spoofing model before production deployment.
    """

    if len(images) < 3:
        raise ValueError(
            "At least 3 frames are required for liveness verification."
        )

    yaw_positions = []

    for image_data in images:
        try:
            if "," in image_data:
                image_data = image_data.split(",", 1)[1]

            image_bytes = base64.b64decode(image_data)

            image_array = np.frombuffer(
                image_bytes,
                dtype=np.uint8
            )

            image = cv2.imdecode(
                image_array,
                cv2.IMREAD_COLOR
            )

            if image is None:
                raise ValueError("Invalid image data.")

            faces = face_app.get(image)

            if len(faces) == 0:
                raise ValueError(
                    "No face detected in one of the frames."
                )

            if len(faces) > 1:
                raise ValueError(
                    "Multiple faces detected. Only one person should be visible."
                )

            face = faces[0]

            if face.kps is None:
                raise ValueError(
                    "Face landmarks could not be detected."
                )

            # InsightFace 5-point landmarks:
            # 0 = left eye
            # 1 = right eye
            # 2 = nose
            # 3 = left mouth
            # 4 = right mouth

            left_eye = face.kps[0]
            right_eye = face.kps[1]
            nose = face.kps[2]

            eye_center_x = (
                float(left_eye[0]) +
                float(right_eye[0])
            ) / 2.0

            eye_distance = abs(
                float(right_eye[0]) -
                float(left_eye[0])
            )

            if eye_distance < 1:
                raise ValueError(
                    "Face landmarks are too close to analyze."
                )

            # Normalized horizontal nose position.
            yaw_position = (
                float(nose[0]) - eye_center_x
            ) / eye_distance

            yaw_positions.append(yaw_position)

        except ValueError:
            raise

        except Exception as error:
            print(
                "Liveness frame error:",
                error
            )

            raise ValueError(
                "Unable to analyze liveness frame."
            )

    first = yaw_positions[0]
    middle = yaw_positions[1]
    last = yaw_positions[2]

    # Require noticeable movement in opposite directions.
    movement_left = first - middle
    movement_right = last - middle

    movement_threshold = 0.08

    left_movement_detected = (
        abs(movement_left) >= movement_threshold
    )

    right_movement_detected = (
        abs(movement_right) >= movement_threshold
    )

    liveness_passed = (
        left_movement_detected and
        right_movement_detected
    )

    return {
        "liveness": liveness_passed,
        "frames_analyzed": len(images),
        "yaw_positions": yaw_positions,
        "movement_threshold": movement_threshold
    }