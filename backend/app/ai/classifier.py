"""
AI Image Classifier — Gemini 2.5 Flash vision-based implementation.

Replaces the old RGB-heuristic mock with real image understanding via the
Google GenAI Python SDK. The public interface (classify_image) is unchanged.

Environment:
    GEMINI_API_KEY  — must be set; never hardcoded here.
"""

import hashlib
import json
import logging
import os
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from jose import JWTError, jwt

from google import genai
from google.genai import types

from app.models import TicketCategory
from app.config.gamification import ACTION_MAP

logger = logging.getLogger(__name__)

# ── Valid category values ──────────────────────────────────────────────────────

_VALID_CATEGORIES = {c.value for c in TicketCategory}

# ── Gemini prompt ──────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """\
You are an AI assistant for EcoLens, an environmental reporting platform for \
a university campus.

Your job is to analyse an uploaded image and determine:

1. Whether the image is RELEVANT to EcoLens.
   A relevant image must clearly show one of:
   - Campus waste or litter (organic, recyclable, hazardous, or general)
   - Campus cleanliness or pollution issues
   - Campus resource wastage (running taps, leaking pipes, lights left on, \
excessive electrical usage, water pooling, etc.)

   An IRRELEVANT image is anything that does not show a real campus \
environmental or cleanliness issue — e.g. people posing, random objects, \
food, indoor furniture, screenshots, memes, animals without waste context, etc.

2. If RELEVANT, classify into exactly one of:
   - organic          (food waste, biodegradable material, plant/garden waste)
   - recyclable       (paper, plastic bottles, cardboard, metal cans, glass)
   - hazardous        (chemicals, batteries, medical waste, paint, e-waste)
   - general_waste    (mixed non-recyclable litter, cigarette butts, styrofoam)
   - resource_wastage (running tap, leaking pipe, wasted electricity, open \
drain, pooled water, lights on in empty rooms)

Respond ONLY with a single valid JSON object — no markdown, no explanation \
outside the JSON. The JSON must have exactly these fields:

{
  "relevant": true or false,
  "category": "<one of the five values above>" or null,
  "reason": "<one concise sentence explaining your decision>",
  "action_recommendation": "<actionable instruction for the campus reporter>",
  "eco_tip": "<short campus sustainability tip related to this issue>"
}

Rules:
- If relevant is false, category MUST be null.
- If relevant is true, category MUST be one of the five valid strings.
- reason must always be present and non-empty.
- action_recommendation and eco_tip must always be present and non-empty.
- Do NOT invent or hallucinate categories outside the five listed.
"""

# ── Lazy Gemini client (initialised once per process) ─────────────────────────

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise EnvironmentError(
                "GEMINI_API_KEY is not set in the environment. "
                "Add it to backend/.env and ensure the container loads it."
            )
        _client = genai.Client(api_key=api_key)
    return _client


# ── Classification token helpers ──────────────────────────────────────────────
#
# The token is a short-lived HS256 JWT that carries the full classification
# result plus a SHA-256 digest of the exact image that was classified.
# It is signed with the same SECRET_KEY / ALGORITHM used for auth JWTs so no
# new secrets or dependencies are needed.
#
# Token TTL: 15 minutes — enough for a user to review the AI result and tap
# "Submit Ticket", but short enough to limit replay opportunities.

_CLASSIFY_TOKEN_TTL_MINUTES = 15
_CLASSIFY_TOKEN_SUBJECT = "classification"


def _secret_key() -> str:
    """Read SECRET_KEY lazily so it is always picked up from the environment."""
    from app.dependencies import SECRET_KEY  # noqa: PLC0415 — intentional late import
    return SECRET_KEY


def _algorithm() -> str:
    from app.dependencies import ALGORITHM  # noqa: PLC0415
    return ALGORITHM


def image_sha256(image_bytes: bytes) -> str:
    """Return the hex-encoded SHA-256 digest of the raw image bytes."""
    return hashlib.sha256(image_bytes).hexdigest()


def sign_result(result: dict, img_hash: str) -> str:
    """
    Encode a classification result as a signed, time-limited JWT.

    Claims:
        sub        — fixed sentinel "classification"
        exp        — UTC expiry (15 minutes from now)
        img_hash   — SHA-256 hex digest of the classified image bytes
        relevant   — bool
        category   — str | None  (TicketCategory value)
        reason     — str
        action_recommendation — str
        eco_tip    — str

    Returns:
        A compact HS256 JWT string.
    """
    expiry = datetime.now(tz=timezone.utc) + timedelta(minutes=_CLASSIFY_TOKEN_TTL_MINUTES)
    payload = {
        "sub": _CLASSIFY_TOKEN_SUBJECT,
        "exp": expiry,
        "img_hash": img_hash,
        "relevant": result["relevant"],
        # TicketCategory is a str-enum; serialise as plain string for JWT
        "category": result["category"].value if result["category"] is not None else None,
        "reason": result["reason"],
        "action_recommendation": result["action_recommendation"],
        "eco_tip": result["eco_tip"],
    }
    return jwt.encode(payload, _secret_key(), algorithm=_algorithm())


def verify_and_extract_result(token: str, image_bytes: bytes) -> dict:
    """
    Validate a classification token and verify the image hash.

    Steps performed (in order):
      1. Decode and verify the JWT signature using the server secret.
      2. Check the 'sub' claim equals "classification" (not an auth token).
      3. Verify the JWT has not expired (jose handles this automatically).
      4. Compute SHA-256 of the submitted image bytes.
      5. Compare with the hash stored in the token claim.
      6. Confirm relevant=True (irrelevant images cannot be submitted).

    Raises:
        HTTPException(422) — on any verification failure, with a user-facing message.

    Returns:
        dict with keys: relevant, category (TicketCategory), reason,
        action_recommendation, eco_tip.
    """
    try:
        payload = jwt.decode(token, _secret_key(), algorithms=[_algorithm()])
    except JWTError as exc:
        logger.warning("Classification token verification failed: %s", exc)
        raise HTTPException(
            status_code=422,
            detail=(
                "The classification token is invalid or has expired. "
                "Please re-analyse your image and try again."
            ),
        ) from exc

    # Guard against a valid *auth* JWT being submitted as a classification token
    if payload.get("sub") != _CLASSIFY_TOKEN_SUBJECT:
        raise HTTPException(
            status_code=422,
            detail="Invalid classification token.",
        )

    # ── Image hash binding ──────────────────────────────────────────────────
    expected_hash: str | None = payload.get("img_hash")
    submitted_hash = image_sha256(image_bytes)
    if expected_hash != submitted_hash:
        raise HTTPException(
            status_code=422,
            detail=(
                "Image does not match the image that was classified. "
                "Please re-analyse your image before submitting."
            ),
        )

    # ── Relevance gate ──────────────────────────────────────────────────────
    if not payload.get("relevant", False):
        raise HTTPException(
            status_code=422,
            detail=payload.get("reason") or "Image does not show a campus environmental issue.",
        )

    # ── Reconstruct the result dict using validated, server-signed values ──
    raw_category = payload.get("category")
    category = (
        TicketCategory(raw_category)
        if raw_category in {c.value for c in TicketCategory}
        else TicketCategory.general_waste
    )

    return {
        "relevant": True,
        "category": category,
        "reason": payload.get("reason", ""),
        "action_recommendation": payload.get("action_recommendation", ""),
        "eco_tip": payload.get("eco_tip", ""),
    }


# ── Public interface ───────────────────────────────────────────────────────────


def classify_image(image_bytes: bytes) -> dict:
    """
    Classify a campus image using Gemini 2.5 Flash.

    Args:
        image_bytes: Raw bytes of the uploaded image.

    Returns:
        A dict with keys:
            relevant              (bool)
            category              (TicketCategory | None)
            reason                (str)
            action_recommendation (str)
            eco_tip               (str)

    Raises:
        ValueError  — if image_bytes is empty / not a valid image.
        RuntimeError — on Gemini API failure or unrecoverable parse error.
    """
    if not image_bytes:
        raise ValueError("No image data received.")

    # Detect MIME type from magic bytes (support JPEG, PNG, WEBP, GIF)
    mime_type = _detect_mime(image_bytes)
    if mime_type is None:
        raise ValueError(
            "Unsupported image format. Please upload a JPEG, PNG, WEBP, or GIF."
        )

    client = _get_client()

    # Build the image part using inline base64
    image_part = types.Part.from_bytes(
        data=image_bytes,
        mime_type=mime_type,
    )
    text_part = types.Part.from_text(text="Analyse this campus image and respond with JSON only.")

    try:
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=[
                types.Content(
                    role="user",
                    parts=[image_part, text_part],
                )
            ],
            config=types.GenerateContentConfig(
                system_instruction=_SYSTEM_PROMPT,
                temperature=0.1,
                response_mime_type="application/json",
            ),
        )
    except Exception as exc:
        logger.error("Gemini API call failed: %s", exc)
        raise RuntimeError(f"Image classification service unavailable: {exc}") from exc

    raw_text = (response.text or "").strip()
    if not raw_text:
        raise RuntimeError("Gemini returned an empty response. Please try again.")

    return _parse_and_enrich(raw_text)


# ── Internal helpers ───────────────────────────────────────────────────────────


def _detect_mime(data: bytes) -> str | None:
    """Return MIME type from magic bytes, or None if unrecognised."""
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:4] in (b"RIFF",) and data[8:12] == b"WEBP":
        return "image/webp"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif"
    # Fallback: allow JPEG with loose SOI check
    if data[:2] == b"\xff\xd8":
        return "image/jpeg"
    return None


def _parse_and_enrich(raw_text: str) -> dict:
    """
    Parse the Gemini JSON response and enrich it with ACTION_MAP values
    for valid waste categories (preserving existing action/tip wording).
    """
    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse Gemini JSON response: %r — %s", raw_text, exc)
        raise RuntimeError(
            "Received a malformed response from the classification service."
        ) from exc

    # ── Validate 'relevant' ────────────────────────────────────────────────
    relevant = data.get("relevant")
    if not isinstance(relevant, bool):
        raise RuntimeError(
            "Classification service returned an unexpected response format "
            "(missing or invalid 'relevant' field)."
        )

    reason = str(data.get("reason") or "").strip()
    if not reason:
        reason = "No reason provided by the classification model."

    # ── Irrelevant image ───────────────────────────────────────────────────
    if not relevant:
        return {
            "relevant": False,
            "category": None,
            "reason": reason,
            "action_recommendation": str(data.get("action_recommendation") or "").strip()
                or "This image does not appear to show a campus environmental issue.",
            "eco_tip": str(data.get("eco_tip") or "").strip()
                or "Please upload an image of a real campus waste or resource-usage issue.",
        }

    # ── Relevant image — validate category ────────────────────────────────
    raw_category = str(data.get("category") or "").strip().lower()
    if raw_category not in _VALID_CATEGORIES:
        logger.warning(
            "Gemini returned unknown category %r for a relevant image; "
            "treating as general_waste.",
            raw_category,
        )
        raw_category = TicketCategory.general_waste.value

    category = TicketCategory(raw_category)

    # Use ACTION_MAP to preserve existing action/tip wording for known categories.
    map_info = ACTION_MAP[category.value]

    return {
        "relevant": True,
        "category": category,
        "reason": reason,
        "action_recommendation": map_info["action"],
        "eco_tip": map_info["tip"],
    }
