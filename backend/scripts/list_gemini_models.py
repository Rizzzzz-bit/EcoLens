"""
Diagnostic script — lists Gemini models available to the configured API key.

Usage (inside the backend container):
    python scripts/list_gemini_models.py

Requirements:
    GEMINI_API_KEY must be set in the environment (loaded from backend/.env
    by docker-compose automatically).

This script does NOT modify any application code and has no side-effects.
"""

import os
import sys


def main() -> None:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY is not set in the environment.", file=sys.stderr)
        sys.exit(1)

    # Confirm the key is present without revealing it
    masked = api_key[:4] + "*" * (len(api_key) - 8) + api_key[-4:]
    print(f"GEMINI_API_KEY detected: {masked}")
    print(f"Key length             : {len(api_key)} characters\n")

    try:
        from google import genai
    except ImportError:
        print("ERROR: google-genai package is not installed.", file=sys.stderr)
        sys.exit(1)

    client = genai.Client(api_key=api_key)

    print("Fetching available models...\n")
    print(f"{'Model name':<55} {'generateContent?'}")
    print("-" * 75)

    count = 0
    try:
        for model in client.models.list():
            name = getattr(model, "name", str(model))

            # The SDK exposes supported_actions or supported_generation_methods
            # depending on the version — check both.
            methods = (
                getattr(model, "supported_generation_methods", None)
                or getattr(model, "supported_actions", None)
                or []
            )
            supports_generate = "generateContent" in methods if methods else "unknown"

            print(f"{name:<55} {supports_generate}")
            count += 1
    except Exception as exc:
        print(f"\nERROR while listing models: {exc}", file=sys.stderr)
        sys.exit(1)

    print("-" * 75)
    print(f"\nTotal models listed: {count}")

    if count == 0:
        print("\nWARNING: No models returned. The API key may be invalid or "
              "the account may not have Gemini API access enabled.")


if __name__ == "__main__":
    main()
