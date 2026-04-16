from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Any
import os

from db.supabase_client import get_supabase

router = APIRouter()


class ProfileUpdate(BaseModel):
    current_energy: Optional[str] = None
    current_frustration: Optional[float] = None
    current_engagement: Optional[float] = None
    positive_anchors: Optional[list[str]] = None


@router.get("/{child_id}")
async def get_profile(
    child_id: str,
    x_backend_secret: str = Header(default=""),
):
    if x_backend_secret != os.environ.get("BACKEND_SECRET", ""):
        raise HTTPException(status_code=401, detail="Invalid secret")

    supabase = get_supabase()
    res = supabase.table("child_profiles").select("*").eq("child_id", child_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return res.data


@router.put("/{child_id}")
async def update_profile(
    child_id: str,
    update: ProfileUpdate,
    x_backend_secret: str = Header(default=""),
):
    if x_backend_secret != os.environ.get("BACKEND_SECRET", ""):
        raise HTTPException(status_code=401, detail="Invalid secret")

    supabase = get_supabase()
    updates = update.model_dump(exclude_none=True)
    if not updates:
        return {"ok": True}

    supabase.table("child_profiles").update(updates).eq("child_id", child_id).execute()
    return {"ok": True}
