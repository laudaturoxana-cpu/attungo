"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ChatInterface from "@/components/chat/ChatInterface";
import type { CurriculumType, SessionLanguage } from "@/lib/supabase/types";

interface ChildData {
  id: string;
  name: string;
  age: number;
  grade: number;
  curriculum_type: CurriculumType;
  session_language: SessionLanguage;
}

const SUBJECTS_RO = ["Matematică", "Română", "Engleză", "Științe", "Biologie", "Geografie", "Istorie", "Fizică"];
const SUBJECTS_EN = ["Mathematics", "English", "Science", "Biology", "Geography", "History", "Physics", "Reading"];

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const childId = params.childId as string;

  const [child, setChild] = useState<ChildData | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    }
    loadChild();
  }, [childId, router]);

  if (loading || !child) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#E8A020] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const lang = child.session_language;
  const subjects = lang === "ro" ? SUBJECTS_RO : SUBJECTS_EN;
  const sprintMinutes = child.grade <= 2 ? 10 : child.grade <= 4 ? 15 : 20;

  if (!started) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0D1B2A] mb-1" style={{ fontFamily: "var(--font-display)" }}>
            {lang === "ro" ? `Sesiune pentru ${child.name}` : `Session for ${child.name}`}
          </h1>
          <p className="text-[#9B9A93] text-sm">
            {lang === "ro" ? `Clasa ${child.grade} · Sprint ${sprintMinutes} min` : `Grade ${child.grade} · ${sprintMinutes} min sprint`}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E3DC] p-6 flex flex-col gap-5">
          {/* Subject selector */}
          <div className="flex flex-col gap-2">
            <label className="text-[#3D3C37] font-medium text-sm">
              {lang === "ro" ? "Materia" : "Subject"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {subjects.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSubject(s)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                    selectedSubject === s
                      ? "bg-[#E8A020] text-[#92520A]"
                      : "bg-[#FAFAF5] border border-[#E5E3DC] text-[#9B9A93] hover:border-[#E8A020]/40 hover:text-[#E8A020]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Topic input */}
          <div className="flex flex-col gap-2">
            <label className="text-[#3D3C37] font-medium text-sm">
              {lang === "ro" ? "Tema specifică (opțional)" : "Specific topic (optional)"}
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={lang === "ro" ? "ex. Fracții simple, Acordul adjectivului..." : "e.g. Simple fractions, Reading comprehension..."}
              className="px-4 py-3 rounded-xl bg-[#FAFAF5] border border-[#E5E3DC] text-[#3D3C37] placeholder-[#9B9A93] focus:outline-none focus:ring-2 focus:ring-[#E8A020]/30"
            />
          </div>

          <button
            disabled={!selectedSubject}
            onClick={() => setStarted(true)}
            className="w-full py-3 rounded-full bg-[#E8A020] text-[#92520A] font-bold hover:bg-[#C17D0A] hover:text-white transition-all disabled:opacity-40"
          >
            {lang === "ro" ? "Pornește sesiunea →" : "Start session →"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col rounded-2xl overflow-hidden border border-[#E5E3DC] shadow-sm">
      <ChatInterface
        childId={child.id}
        childName={child.name}
        subject={selectedSubject}
        topic={topic || selectedSubject}
        grade={child.grade}
        language={lang}
        sprintMinutes={sprintMinutes}
        onSessionEnd={() => router.push("/dashboard")}
      />
    </div>
  );
}
