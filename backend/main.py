from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

from routers import sessions, profiles, reports

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔥 Attungo FastAPI backend starting...")
    yield
    print("🔥 Attungo FastAPI backend shutting down...")

app = FastAPI(
    title="Attungo API",
    description="Backend AI pentru Attungo — tutorele care ascultă",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://attungo.com",
        "https://attungo.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
app.include_router(profiles.router, prefix="/profiles", tags=["profiles"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "Attungo Backend"}
