from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app import models, schemas
from app.db import get_db
from app.dependencies import get_current_user
from app.ai.classifier import classify_image
from app.ai.resource_anomaly import detect_resource_anomalies
from typing import List

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/classify", response_model=schemas.ClassifyResponse)
async def classify(
    image: UploadFile = File(...),
    _: models.User = Depends(get_current_user),
):
    image_bytes = await image.read()
    result = classify_image(image_bytes)
    return result


@router.get("/resource-anomalies", response_model=List[schemas.AnomalyOut])
def resource_anomalies(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    anomalies = detect_resource_anomalies(db)
    return [schemas.AnomalyOut(**a) for a in anomalies]
