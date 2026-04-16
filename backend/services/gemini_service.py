"""
Serviciul Gemini — chat + TTS + STT pentru Atto.
"""
import json
import re
import os
from typing import Any
import google.generativeai as genai

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

# Modelele
CHAT_MODEL = "gemini-2.5-flash"
EMBEDDING_MODEL = "models/text-embedding-004"

_chat_model = None


def get_chat_model() -> genai.GenerativeModel:
    global _chat_model
    if _chat_model is None:
        _chat_model = genai.GenerativeModel(
            model_name=CHAT_MODEL,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=512,
                temperature=0.8,
                top_p=0.95,
            ),
        )
    return _chat_model


def parse_atto_response(raw: str) -> dict[str, Any]:
    """Extrage mesajul vizibil și JSON-ul invizibil din răspunsul lui Atto."""
    json_pattern = r"<<<JSON\s*(.*?)\s*>>>"
    json_match = re.search(json_pattern, raw, re.DOTALL)

    metadata: dict[str, Any] = {
        "detected_state": {"energy": "medium", "frustration": 0.2, "engagement": 0.75},
        "zpd_update": {"concept": "", "result": ""},
        "passion_signals": {},
        "flags": {
            "needs_break": False,
            "frustration_high": False,
            "safety_concern": False,
            "spontaneous_question": False,
        },
        "concepts_mastered": [],
    }

    if json_match:
        try:
            metadata = json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # Curăță JSON-ul din mesajul vizibil
    visible_message = re.sub(r"<<<JSON.*?>>>", "", raw, flags=re.DOTALL).strip()
    return {"message": visible_message, **metadata}


async def chat_with_atto(
    system_prompt: str,
    conversation_history: list[dict[str, str]],
    user_message: str,
) -> dict[str, Any]:
    """Trimite un mesaj lui Atto și primește răspunsul procesat."""
    model = get_chat_model()

    # Construiește istoricul în formatul Gemini
    history = []
    for msg in conversation_history:
        role = "model" if msg.get("role") == "atto" else "user"
        history.append({
            "role": role,
            "parts": [{"text": msg.get("content", "")}],
        })

    chat = model.start_chat(history=history)

    # Injectează system prompt-ul în primul mesaj dacă nu există istoric
    full_message = user_message
    if not history:
        full_message = f"[SYSTEM CONTEXT]\n{system_prompt}\n\n[MESAJUL COPILULUI]\n{user_message}"

    response = await chat.send_message_async(full_message)
    raw_text = response.text

    return parse_atto_response(raw_text)


async def start_session_message(
    system_prompt: str,
    child_name: str,
    subject: str,
    language: str,
) -> dict[str, Any]:
    """Generează mesajul de deschidere al lui Atto pentru o sesiune nouă."""
    model = get_chat_model()

    opener_prompt = f"""{system_prompt}

Acesta este PRIMUL mesaj al sesiunii cu {child_name} pentru {subject}.
Generează un mesaj de bun venit cald și curios care:
1. Salută {child_name} pe nume
2. Arată curiozitate pentru el/ea (nu pentru materie)
3. Pune O SINGURĂ întrebare deschisă care detectează starea/pasiunile
4. Energia e jucăușă și caldă
5. Limbă: {language}
"""

    response = await model.generate_content_async(opener_prompt)
    return parse_atto_response(response.text)


async def get_embedding(text: str) -> list[float]:
    """Generează embedding pentru memorie conversațională."""
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="RETRIEVAL_DOCUMENT",
    )
    return result["embedding"]
