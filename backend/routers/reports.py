from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
import os
import google.generativeai as genai

from db.supabase_client import get_supabase

router = APIRouter()


@router.post("/generate/{session_id}")
async def generate_session_report(
    session_id: str,
    x_backend_secret: str = Header(default=""),
):
    if x_backend_secret != os.environ.get("BACKEND_SECRET", ""):
        raise HTTPException(status_code=401, detail="Invalid secret")

    supabase = get_supabase()

    # Load session data
    session_res = supabase.table("sessions").select("*, children(name, grade, session_language)").eq("id", session_id).single().execute()
    if not session_res.data:
        raise HTTPException(status_code=404, detail="Session not found")

    session = session_res.data
    child_name = session["children"]["name"]
    lang = session["session_language"]

    # Load messages
    messages_res = supabase.table("messages").select("role, content").eq("session_id", session_id).order("created_at").execute()
    messages = messages_res.data or []

    # Generate report with Gemini
    conversation_text = "\n".join([
        f"{'Atto' if m['role'] == 'atto' else child_name}: {m['content']}"
        for m in messages
    ])

    prompt = f"""Ești Atto, tutorele licurici. Tocmai ai terminat o sesiune cu {child_name}.
Analizează conversația de mai jos și generează un raport pentru părintele lui {child_name}.

CONVERSAȚIE:
{conversation_text[:3000]}

SESIUNE:
- Materia: {session['subject']}
- Tema: {session['topic']}
- Durata: {session.get('duration_minutes', '?')} minute
- Angajament mediu: {session.get('avg_engagement', 0.75):.0%}

Generează un JSON cu structura:
{{
  "summary": "Rezumat cald în 2-3 propoziții (în {lang})",
  "concepts_learned": ["concept1", "concept2"],
  "concepts_struggling": ["concept care necesită mai mult timp"],
  "passions_detected": ["pasiune detectată"],
  "atto_message_to_parent": "Un mesaj personal cald de la Atto pentru tine ca mamă/tată (în {lang})",
  "next_session_recommendation": "Ce să faceți mâine",
  "engagement_score": 0.75,
  "progress_score": 0.6
}}
"""

    try:
        genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = await model.generate_content_async(prompt)

        import json
        import re
        json_match = re.search(r"\{.*\}", response.text, re.DOTALL)
        report_data = json.loads(json_match.group(0)) if json_match else {
            "summary": f"Sesiune completată cu {child_name}.",
            "concepts_learned": [],
            "concepts_struggling": [],
            "passions_detected": [],
            "atto_message_to_parent": f"{child_name} a muncit bine azi!",
            "next_session_recommendation": "Continuă cu același subiect.",
            "engagement_score": session.get("avg_engagement", 0.75),
            "progress_score": 0.5,
        }
    except Exception:
        report_data = {
            "summary": f"Sesiune completată cu {child_name}.",
            "concepts_learned": session.get("concepts_mastered_today", []),
            "concepts_struggling": [],
            "passions_detected": [],
            "atto_message_to_parent": f"{child_name} a muncit bine azi!",
            "next_session_recommendation": "Continuă cu același subiect.",
            "engagement_score": session.get("avg_engagement", 0.75),
            "progress_score": 0.5,
        }

    # Save report
    report_res = supabase.table("parent_reports").insert({
        "child_id": session["child_id"],
        "session_id": session_id,
        "report_type": "session",
        **report_data,
    }).execute()

    return {"ok": True, "report": report_data}


@router.get("/{child_id}")
async def get_reports(
    child_id: str,
    limit: int = 10,
    x_backend_secret: str = Header(default=""),
):
    if x_backend_secret != os.environ.get("BACKEND_SECRET", ""):
        raise HTTPException(status_code=401, detail="Invalid secret")

    supabase = get_supabase()
    res = supabase.table("parent_reports").select("*").eq("child_id", child_id).order("created_at", desc=True).limit(limit).execute()
    return res.data or []
