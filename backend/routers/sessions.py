"""
Sessions router — gestionează sesiunile cu Atto.
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import os

from services.prompt_builder import build_atto_prompt
from services.gemini_service import chat_with_atto, start_session_message
from services.passion_detector import detect_passions_in_message, merge_passion_signals
from services.emotion_detector import detect_emotional_state
from db.supabase_client import get_supabase

router = APIRouter()


class StartSessionRequest(BaseModel):
    childId: str
    subject: str
    topic: str
    grade: int
    language: str
    childName: str
    curriculumType: str = "RO_NATIONAL"


class MessageRequest(BaseModel):
    sessionId: Optional[str] = None
    childId: str
    message: str
    language: str
    conversationHistory: list[dict] = []


@router.post("/start")
async def start_session(
    req: StartSessionRequest,
    x_backend_secret: str = Header(default=""),
    x_user_id: str = Header(default=""),
):
    if x_backend_secret != os.environ.get("BACKEND_SECRET", ""):
        raise HTTPException(status_code=401, detail="Invalid secret")

    supabase = get_supabase()

    # Load child profile
    profile_res = supabase.table("child_profiles").select("*").eq("child_id", req.childId).single().execute()
    profile = profile_res.data or {}

    # Create session record
    session_res = supabase.table("sessions").insert({
        "child_id": req.childId,
        "subject": req.subject,
        "topic": req.topic,
        "curriculum_type": req.curriculumType,
        "session_language": req.language,
        "session_type": "new_concept",
        "start_energy": profile.get("current_energy", "medium"),
    }).execute()

    session_id = session_res.data[0]["id"] if session_res.data else None

    # Build system prompt
    system_prompt = build_atto_prompt(
        child_profile={
            "name": req.childName,
            "age": profile.get("age", 10),
            "grade": req.grade,
            **profile,
        },
        session={
            "language": req.language,
            "curriculum_type": req.curriculumType,
            "subject": req.subject,
            "topic": req.topic,
            "duration": 15,
        },
        curriculum={},
    )

    # Generate opening message
    response = await start_session_message(
        system_prompt=system_prompt,
        child_name=req.childName,
        subject=req.subject,
        language=req.language,
    )

    # Save opening message
    if session_id:
        supabase.table("messages").insert({
            "session_id": session_id,
            "role": "atto",
            "content": response["message"],
            "metadata": response,
        }).execute()

    return {
        "sessionId": session_id,
        "message": response["message"],
        **response,
    }


@router.post("/message")
async def send_message(
    req: MessageRequest,
    x_backend_secret: str = Header(default=""),
    x_user_id: str = Header(default=""),
):
    if x_backend_secret != os.environ.get("BACKEND_SECRET", ""):
        raise HTTPException(status_code=401, detail="Invalid secret")

    supabase = get_supabase()

    # Load child profile for context
    profile_res = supabase.table("child_profiles").select("*").eq("child_id", req.childId).single().execute()
    profile = profile_res.data or {}

    # Detect passions and emotions in user message
    passion_signals = detect_passions_in_message(req.message)
    emotion_state = detect_emotional_state(req.message)

    # Update frustration in profile if high
    if emotion_state["frustration"] > 0.3:
        new_frustration = min(
            (profile.get("current_frustration", 0) + emotion_state["frustration"]) / 2,
            1.0
        )
        supabase.table("child_profiles").update({
            "current_frustration": new_frustration,
            "current_energy": emotion_state["energy"],
        }).eq("child_id", req.childId).execute()

    # Merge passion signals
    if passion_signals:
        updates = {}
        for passion, score in passion_signals.items():
            col = f"passion_{passion}"
            updates[col] = (profile.get(col, 0) or 0) + score
        if updates:
            supabase.table("child_profiles").update(updates).eq("child_id", req.childId).execute()

    # Build system prompt
    system_prompt = build_atto_prompt(
        child_profile={**profile, "current_frustration": emotion_state["frustration"]},
        session={
            "language": req.language,
            "subject": req.conversationHistory[0].get("subject", "general") if req.conversationHistory else "general",
            "topic": "",
            "curriculum_type": profile.get("curriculum_type", "RO_NATIONAL"),
            "duration": 15,
        },
        curriculum={},
    )

    # Save child message
    if req.sessionId:
        supabase.table("messages").insert({
            "session_id": req.sessionId,
            "role": "child",
            "content": req.message,
            "metadata": {"detected_state": emotion_state, "passion_signals": passion_signals},
        }).execute()

    # Get Atto's response
    response = await chat_with_atto(
        system_prompt=system_prompt,
        conversation_history=req.conversationHistory,
        user_message=req.message,
    )

    # Merge emotion state with Atto's detected state
    merged_state = {**emotion_state, **response.get("detected_state", {})}
    response["detected_state"] = merged_state

    # Handle safety concern
    if emotion_state.get("safety_concern") or response.get("flags", {}).get("safety_concern"):
        if req.sessionId:
            supabase.table("sessions").update({
                "had_safety_concern": True,
            }).eq("id", req.sessionId).execute()
        response["flags"] = response.get("flags", {})
        response["flags"]["safety_concern"] = True

    # Save Atto's response
    if req.sessionId:
        supabase.table("messages").insert({
            "session_id": req.sessionId,
            "role": "atto",
            "content": response["message"],
            "metadata": response,
        }).execute()

        # Update session stats
        supabase.table("sessions").update({
            "questions_asked_by_atto": supabase.table("sessions")
                .select("questions_asked_by_atto")
                .eq("id", req.sessionId)
                .single()
                .execute()
                .data.get("questions_asked_by_atto", 0) + (1 if "?" in response["message"] else 0),
            "avg_engagement": emotion_state["engagement"],
            "peak_frustration": max(
                supabase.table("sessions").select("peak_frustration").eq("id", req.sessionId).single().execute().data.get("peak_frustration", 0),
                emotion_state["frustration"],
            ),
        }).eq("id", req.sessionId).execute()

    return response
