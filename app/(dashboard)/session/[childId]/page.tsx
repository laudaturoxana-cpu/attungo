"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ChatInterface from "@/components/chat/ChatInterface";
import AttoCharacter from "@/components/atto/AttoCharacter";
import VoiceInput from "@/components/chat/VoiceInput";
import type { CurriculumType, SessionLanguage } from "@/lib/supabase/types";
import type { ChildProfile } from "@/lib/atto/types";

interface ChildData {
  id: string;
  name: string;
  age: number;
  grade: number;
  curriculum_type: CurriculumType;
  session_language: SessionLanguage;
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const childId = params.childId as string;

  const [child, setChild] = useState<ChildData | null>(null);
  const [childProfile, setChildProfile] = useState<ChildProfile | undefined>(undefined);
  const [initialText, setInitialText] = useState("");
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function loadChild() {
      const supabase = createClient();
      const { data } = await supabase
        .from("children")
        .select("id, name, age, grade, curriculum_type, session_language")
        .eq("id", childId)
        .single();

      if (!data) { router.push("/dashboard"); return; }
      setChild(data);

      const { data: profile } = await supabase
        .from("child_profiles")
        .select("learning_visual, learning_auditory, learning_logical, learning_kinesthetic, passion_sport, passion_music, passion_tech, passion_stories, passion_animals, passion_art, passion_science, positive_anchors, current_energy, common_mistakes")
        .eq("child_id", childId)
        .single();

      if (profile) setChildProfile(profile as ChildProfile);
      setLoading(false);
    }
    loadChild();
  }, [childId, router]);

  useEffect(() => {
    if (!loading && !started) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading, started]);

  if (loading || !child) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#E8A020] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const lang = child.session_language;
  const isRo = lang === "ro";
  const sprintMinutes = child.grade <= 2 ? 10 : child.grade <= 4 ? 15 : 20;
  const firstName = child.name.split(" ")[0];

  function handleStart() {
    if (!initialText.trim()) return;
    setStarted(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleStart();
    }
  }

  if (!started) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center gap-8 py-8 px-4">

        {/* Atto + greeting */}
        <div className="flex flex-col items-center gap-4 text-center">
          <AttoCharacter state="listening" size={80} />
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-[#0D1B2A]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {isRo ? `Bună, ${firstName}!` : `Hey, ${firstName}!`}
            </h1>
            <p className="text-[#9B9A93] mt-1 text-base">
              {isRo ? "Cu ce te pot ajuta azi?" : "What can I help you with today?"}
            </p>
          </div>
        </div>

        {/* Free-form input */}
        <div className="w-full bg-white rounded-2xl border border-[#E5E3DC] shadow-sm overflow-hidden">
          {child.grade <= 2 ? (
            /* Grade 1-2: big voice button + small text fallback */
            <div className="p-5 flex flex-col gap-4">
              <VoiceInput
                bigMode
                lang={lang}
                onTranscript={(t) => setInitialText(t)}
              />
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={initialText}
                  onChange={(e) => setInitialText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  placeholder={isRo ? "Sau scrie tu (pentru părinți)..." : "Or type (for parents)..."}
                  className="w-full px-4 py-3 rounded-xl bg-[#FAFAF5] border border-[#E5E3DC] text-sm text-[#3D3C37] placeholder-[#9B9A93] focus:outline-none focus:ring-2 focus:ring-[#E8A020]/30 resize-none"
                />
              </div>
            </div>
          ) : (
            /* Grade 3+: text input primary */
            <div className="p-5 flex flex-col gap-3">
              <textarea
                ref={inputRef}
                value={initialText}
                onChange={(e) => setInitialText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                placeholder={
                  isRo
                    ? `ex. "am teme la matematică și nu înțeleg cum se adună fracțiile"\n"trebuie să fac un rezumat la română și nu știu de unde să încep"\n"am o problemă cu viteza și distanța la fizică"`
                    : `e.g. "I have math homework and don't understand fractions"\n"I need to write a summary for English class"\n"I have a science problem about speed"`
                }
                className="w-full px-4 py-3 rounded-xl bg-[#FAFAF5] border border-[#E5E3DC] text-base text-[#3D3C37] placeholder-[#9B9A93] focus:outline-none focus:ring-2 focus:ring-[#E8A020]/30 resize-none leading-relaxed"
              />
              <p className="text-[#9B9A93] text-xs">
                {isRo ? "Spune cu cuvintele tale. Atto înțelege." : "Say it in your own words. Atto understands."}
              </p>
            </div>
          )}

          <div className="px-5 pb-5">
            <button
              disabled={!initialText.trim()}
              onClick={handleStart}
              className="w-full py-3 rounded-full bg-[#E8A020] text-[#3D1500] font-bold hover:bg-[#C17D0A] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isRo ? "Hai să rezolvăm împreună →" : "Let's figure it out together →"}
            </button>
          </div>
        </div>

        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="text-[#9B9A93] text-sm hover:text-[#3D3C37] transition-colors"
        >
          ← {isRo ? "Înapoi" : "Back"}
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col rounded-2xl overflow-hidden border border-[#E5E3DC] shadow-sm">
      <ChatInterface
        childId={child.id}
        childName={child.name}
        subject=""
        topic={initialText}
        grade={child.grade}
        language={lang}
        curriculumType={child.curriculum_type}
        childProfile={childProfile}
        freeMode
        sprintMinutes={sprintMinutes}
        onSessionEnd={() => router.push("/dashboard")}
      />
    </div>
  );
}
