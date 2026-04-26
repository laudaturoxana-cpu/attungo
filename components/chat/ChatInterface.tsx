"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import AttoCharacter, { type AttoState } from "@/components/atto/AttoCharacter";
import AttoFireflies from "@/components/atto/AttoFireflies";
import MessageBubble, { type Message } from "./MessageBubble";
import SprintTimer from "./SprintTimer";
import StarsDisplay from "./StarsDisplay";
import VoiceInput from "./VoiceInput";
import type { SessionLanguage } from "@/lib/supabase/types";
import type { ChildProfile } from "@/lib/atto/types";

interface ChatInterfaceProps {
  childId: string;
  childName: string;
  subject: string;
  topic: string;
  grade: number;
  language: SessionLanguage;
  curriculumType?: string;
  childProfile?: ChildProfile;
  freeMode?: boolean;
  sprintMinutes?: number;
  onSessionEnd?: (summary: { stars: number; concepts: string[] }) => void;
}

export default function ChatInterface({
  childId,
  childName,
  subject,
  topic,
  grade,
  language,
  curriculumType = "RO_NATIONAL",
  childProfile,
  freeMode = false,
  sprintMinutes = 15,
  onSessionEnd,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [attoState, setAttoState] = useState<AttoState>("neutral");
  const [isTyping, setIsTyping] = useState(false);
  const [stars, setStars] = useState(0);
  const [level, setLevel] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sprintComplete, setSprintComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevStarsRef = useRef(0);

  const lang = language;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Star burst animation when child earns a new star
  useEffect(() => {
    if (stars > prevStarsRef.current) {
      setBurstKey((k) => k + 1);
      setShowBurst(true);
      const t = setTimeout(() => setShowBurst(false), 1600);
      prevStarsRef.current = stars;
      return () => clearTimeout(t);
    } else {
      prevStarsRef.current = stars;
    }
  }, [stars]);

  async function startSession() {
    setLoading(true);
    setAttoState("listening");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "start_session",
          childId,
          childName,
          subject,
          topic,
          grade,
          language,
          curriculumType,
          childProfile,
          freeMode,
        }),
      });

      const data = await res.json();
      if (data.sessionId) setSessionId(data.sessionId);

      if (data.message) {
        setMessages([
          {
            id: `atto-0`,
            role: "atto",
            content: data.message,
            attoState: "listening",
          },
        ]);
      }
    } catch {
      setMessages([{
        id: "atto-error",
        role: "atto",
        content: lang === "ro"
          ? "Bună! Sunt Atto. Să începem cu ceva simplu: ce știi deja despre azi?"
          : "Hi! I'm Atto. Let's start with something easy: what do you already know about today's topic?",
        attoState: "listening",
      }]);
    } finally {
      setLoading(false);
    }
  }

  const sendMessage = useCallback(async (text: string, isVoice = false) => {
    if (!text.trim() || loading) return;

    const childMsg: Message = {
      id: `child-${Date.now()}`,
      role: "child",
      content: text,
      isVoice,
    };

    setMessages((prev) => [...prev, childMsg]);
    setInput("");
    setIsTyping(true);
    setAttoState("thinking");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "message",
          sessionId,
          childId,
          childName,
          message: text,
          subject,
          topic,
          grade,
          language,
          curriculumType,
          childProfile,
          conversationHistory: messages.map((m) => ({
            role: m.role === "atto" ? "model" : "user",
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      setIsTyping(false);

      const newAttoState: AttoState = data.detected_state?.engagement > 0.8 ? "happy" :
        data.detected_state?.frustration > 0.6 ? "concerned" : "listening";
      setAttoState(newAttoState);

      if (data.concepts_mastered?.length > 0) {
        setStars((s) => s + data.concepts_mastered.length);
        if (stars + data.concepts_mastered.length >= level * 5) {
          setLevel((l) => l + 1);
        }
      }

      const attoMsg: Message = {
        id: `atto-${Date.now()}`,
        role: "atto",
        content: data.message || (lang === "ro" ? "Interesant! Spune-mi mai mult." : "Interesting! Tell me more."),
        attoState: newAttoState,
      };
      setMessages((prev) => [...prev, attoMsg]);

    } catch {
      setIsTyping(false);
      setAttoState("neutral");
      const fallbackMsg: Message = {
        id: `atto-fallback-${Date.now()}`,
        role: "atto",
        content: lang === "ro" ? "Hmm, să reformulăm. Cum ai explica asta cu propriile tale cuvinte?" : "Hmm, let's rephrase. How would you explain this in your own words?",
        attoState: "listening",
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }
  }, [loading, messages, sessionId, childId, language, lang, stars, level]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleVoiceTranscript(text: string) {
    sendMessage(text, true);
  }

  const statusText = attoState === "thinking"
    ? (lang === "ro" ? "se gândește..." : "thinking...")
    : (lang === "ro" ? "pulsează · ascultă" : "pulsing · listening");

  const statusColor = attoState === "thinking" ? "#E8A020" : "#3ECDA0";

  return (
    <div className="flex flex-col h-full bg-[#FAFAF5] relative">
      {/* Sprint timer bar */}
      <SprintTimer
        durationMinutes={sprintMinutes}
        onSprintComplete={() => setSprintComplete(true)}
        lang={lang}
      />

      {/* Chat header — Atto at 52px, visible mood indicator */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-[#E5E3DC] shadow-sm">
        <div
          className="flex-shrink-0 rounded-full"
          style={attoState === "thinking"
            ? { animation: "pulse-amber 1.2s ease-in-out infinite" }
            : undefined}
        >
          <AttoCharacter state={attoState} size={52} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#0D1B2A] text-sm leading-tight">Atto</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: statusColor }}
            />
            <p className="text-xs" style={{ color: statusColor }}>
              {statusText}
            </p>
          </div>
        </div>
        <StarsDisplay stars={stars} level={level} lang={lang} />
      </div>

      {/* Sprint complete banner */}
      {sprintComplete && (
        <div className="mx-3 mt-3 p-3 bg-[#FEF3C7] border border-[#E8A020]/40 rounded-xl text-sm text-[#92520A] flex items-center gap-2">
          <span>🎉</span>
          <span>
            {lang === "ro"
              ? "Sprint completat! Ia o pauză și mișcă-te 3 minute!"
              : "Sprint complete! Take a break and move for 3 minutes!"}
          </span>
          <button
            onClick={() => setSprintComplete(false)}
            className="ml-auto text-[#92520A]/60 hover:text-[#92520A]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages area — firefly background + scrollable messages */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Floating firefly dots in background */}
        <AttoFireflies count={5} />

        {/* Star burst overlay when child earns a star */}
        {showBurst && (
          <div className="absolute inset-x-0 top-1/3 pointer-events-none z-50 flex justify-center">
            <div key={burstKey} className="animate-star-pop text-center">
              <div className="text-6xl drop-shadow-lg">⭐</div>
              <p className="text-sm font-bold text-[#E8A020] mt-1 drop-shadow">
                {lang === "ro" ? "+1 stea!" : "+1 star!"}
              </p>
            </div>
          </div>
        )}

        <div className="px-4 py-4 space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} lang={lang} />
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-2 items-end animate-fade-in">
              <AttoCharacter state="thinking" size={28} className="flex-shrink-0 mb-1" />
              <div className="bubble-atto px-4 py-3">
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] inline-block"
                      style={{ animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border-t border-[#E5E3DC]"
      >
        {/* Grades 1-2: big voice button, keyboard secondary */}
        {grade <= 2 ? (
          <div className="flex flex-col items-center gap-2 px-4 pt-3 pb-3">
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              lang={lang}
              disabled={loading || isTyping}
              bigMode
            />
            <div className="flex w-full gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={lang === "ro" ? "Sau scrie tu (pentru părinți)..." : "Or type (for parents)..."}
                disabled={loading || isTyping}
                className="flex-1 px-3 py-2 rounded-full bg-[#FAFAF5] border border-[#E5E3DC] text-[#3D3C37] placeholder-[#9B9A93] text-sm focus:outline-none focus:ring-2 focus:ring-[#E8A020]/30 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading || isTyping}
                className="w-9 h-9 rounded-full bg-[#E8A020] flex items-center justify-center flex-shrink-0 hover:bg-[#C17D0A] transition-all active:scale-95 disabled:opacity-40"
                aria-label={lang === "ro" ? "Trimite" : "Send"}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8h12M9 3l5 5-5 5" stroke="#3D1500" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          /* Grades 3+: compact mic + text + send */
          <div className="flex items-center gap-2 px-4 py-3">
            <VoiceInput onTranscript={handleVoiceTranscript} lang={lang} disabled={loading || isTyping} />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={lang === "ro" ? "Scrie răspunsul tău..." : "Type your answer..."}
              disabled={loading || isTyping}
              className="flex-1 px-4 py-2.5 rounded-full bg-[#FAFAF5] border border-[#E5E3DC] text-[#3D3C37] placeholder-[#9B9A93] text-sm focus:outline-none focus:ring-2 focus:ring-[#E8A020]/30 focus:border-[#E8A020]/40 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || isTyping}
              className="w-10 h-10 rounded-full bg-[#E8A020] flex items-center justify-center flex-shrink-0 hover:bg-[#C17D0A] transition-all active:scale-95 disabled:opacity-40"
              aria-label={lang === "ro" ? "Trimite" : "Send"}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8h12M9 3l5 5-5 5" stroke="#3D1500" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
