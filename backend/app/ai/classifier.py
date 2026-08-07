"""
AI Image Classifier — rule-based mock using PIL image analysis.
No heavy ML framework required for the demo. Uses colour histogram
heuristics + filename hints to simulate MobileNetV2-style classification.
In production, replace classify_image() with real model inference.
"""
import io
import random
from PIL import Image
from app.models import TicketCategory
from app.config.gamification import ACTION_MAP


# Category colour heuristic thresholds (HSV-based approximation via RGB)
def _dominant_colour(img: Image.Image):
    img = img.convert("RGB").resize((50, 50))
    pixels = list(img.getdata())
    r = sum(p[0] for p in pixels) / len(pixels)
    g = sum(p[1] for p in pixels) / len(pixels)
    b = sum(p[2] for p in pixels) / len(pixels)
    return r, g, b


def classify_image(image_bytes: bytes) -> dict:
    """
    Classify an image into one of the five waste categories.
    Returns: { category, confidence, action_recommendation, eco_tip }
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        r, g, b = _dominant_colour(img)

        # Simple heuristic mapping
        if g > r and g > b and g > 100:
            # Greenish → organic (plants, food)
            category = TicketCategory.organic
            confidence = round(random.uniform(0.72, 0.91), 2)
        elif b > r and b > g and b > 100:
            # Bluish → recyclable (plastic bottles, paper)
            category = TicketCategory.recyclable
            confidence = round(random.uniform(0.68, 0.88), 2)
        elif r > 160 and g < 80 and b < 80:
            # Deep red → hazardous (fire extinguisher, warning signs)
            category = TicketCategory.hazardous
            confidence = round(random.uniform(0.75, 0.93), 2)
        elif r > 130 and g > 100 and b < 80:
            # Orange/yellow → resource wastage (water tap, electrical)
            category = TicketCategory.resource_wastage
            confidence = round(random.uniform(0.65, 0.85), 2)
        else:
            category = TicketCategory.general_waste
            confidence = round(random.uniform(0.60, 0.82), 2)
    except Exception:
        # Fallback if image can't be parsed
        category = TicketCategory.general_waste
        confidence = 0.60

    info = ACTION_MAP[category.value]
    return {
        "category": category,
        "confidence": confidence,
        "action_recommendation": info["action"],
        "eco_tip": info["tip"],
    }
