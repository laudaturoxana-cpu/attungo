"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AttoCharacter from "@/components/atto/AttoCharacter";
import AttoFireflies from "@/components/atto/AttoFireflies";
import Button from "@/components/ui/Button";
import type { CurriculumType, SessionLanguage } from "@/lib/supabase/types";

const GRADES = Array.from({ length: 8 }, (_, i) => i + 1);
const AGES = Array.from({ length: 10 }, (_, i) => i + 6);

const CURRICULUM_OPTIONS: { value: CurriculumType; label: string }[] = [
  { value: "RO_NATIONAL", label: "Programa MEN România" },
  { value: "US_COMMON_CORE", label: "US Common Core" },
  { value: "EN_CAMBRIDGE", label: "Cambridge" },
  { value: "US_HOMESCHOOL", label: "Homeschool (US)" },
];

const PLAN_LIMITS: Record<string, number> = {
  trial: 1,
  essential: 1,
  family: 3,
  annual: 1,
  cancelled: 0,
};

type PassionKey = "sport" | "music" | "tech" | "stories" | "animals" | "art" | "science";
type LearningStyle = "visual" | "auditory" | "logical" | "kinesthetic";
type EnergyLevel = "low" | "medium" | "high";

interface Step3Answers {
  passions: PassionKey[];
  learningStyle: LearningStyle | "";
  energy: EnergyLevel | "";
  motivators: string[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [questionStep, setQuestionStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState<number>(9);
  const [childGrade, setChildGrade] = useState<number>(3);
  const [curriculum, setCurriculum] = useState<CurriculumType>("RO_NATIONAL");
  const [language, setLanguage] = useState<SessionLanguage>("ro");

  const [answers, setAnswers] = useState<Step3Answers>({
    passions: [],
    learningStyle: "",
    energy: "",
    motivators: [],
  });

  const firstName = childName.split(" ")[0] || "copilul";

  const STEP3_QUESTIONS = [
    {
      id: "passions",
      attoText: `Bine, ${firstName}! Acum spune-mi — ce îi place lui ${firstName} să facă în timpul liber?`,
      hint: "Alege tot ce se potrivește",
      multi: true,
      max: 7,
      options: [
        { label: "🏃 Sport", value: "sport" },
        { label: "🎵 Muzică", value: "music" },
        { label: "💻 Jocuri / tech", value: "tech" },
        { label: "📖 Povești / cărți", value: "stories" },
        { label: "🐾 Animale", value: "animals" },
        { label: "🎨 Desen / artă", value: "art" },
        { label: "🔬 Știință", value: "science" },
      ],
    },
    {
      id: "learningStyle",
      attoText: `Super! Și cum învață cel mai bine ${firstName}?`,
      hint: "Alege una",
      multi: false,
      max: 1,
      options: [
        { label: "👁️ Vede imagini și diagrame", value: "visual" },
        { label: "👂 Ascultă explicații", value: "auditory" },
        { label: "🧩 Rezolvă probleme logice", value: "logical" },
        { label: "🤸 Face lucruri cu mâinile", value: "kinesthetic" },
      ],
    },
    {
      id: "energy",
      attoText: `Înțeles! Cum e ${firstName} în general după școală?`,
      hint: "Alege una",
      multi: false,
      max: 1,
      options: [
        { label: "⚡ Plin/ă de energie", value: "high" },
        { label: "😊 Normal, ok", value: "medium" },
        { label: "😴 Obosit/ă de obicei", value: "low" },
      ],
    },
    {
      id: "motivators",
      attoText: `Ultima întrebare — ce îl/o motivează pe ${firstName} cel mai mult?`,
      hint: "Alege tot ce se potrivește",
      multi: true,
      max: 5,
      options: [
        { label: "🏆 Să câștige / să fie primul", value: "competitie" },
        { label: "⭐ Stele și recompense", value: "recompense" },
        { label: "🤝 Să ajute pe alții", value: "altruism" },
        { label: "🎯 Să înțeleagă bine", value: "mastery" },
        { label: "😄 Să se distreze", value: "distractie" },
      ],
    },
  ];

  const currentQuestion = STEP3_QUESTIONS[questionStep];

  function getSelected(id: string): string[] {
    if (id === "passions") return answers.passions;
    if (id === "learningStyle") return answers.learningStyle ? [answers.learningStyle] : [];
    if (id === "energy") return answers.energy ? [answers.energy] : [];
    if (id === "motivators") return answers.motivators;
    return [];
  }

  function toggleOption(id: string, value: string) {
    setAnswers((prev) => {
      if (id === "passions") {
        const arr = prev.passions.includes(value as PassionKey)
          ? prev.passions.filter((v) => v !== value)
          : prev.passions.length < 2
          ? [...prev.passions, value as PassionKey]
          : prev.passions;
        return { ...prev, passions: arr };
      }
      if (id === "learningStyle") {
        return { ...prev, learningStyle: value as LearningStyle };
      }
      if (id === "energy") {
        return { ...prev, energy: value as EnergyLevel };
      }
      if (id === "motivators") {
        const arr = prev.motivators.includes(value)
          ? prev.motivators.filter((v) => v !== value)
          : prev.motivators.length < 2
          ? [...prev.motivators, value]
          : prev.motivators;
        return { ...prev, motivators: arr };
      }
      return prev;
    });
  }

  function isQuestionAnswered(id: string): boolean {
    if (id === "passions") return answers.passions.length > 0;
    if (id === "learningStyle") return answers.learningStyle !== "";
    if (id === "energy") return answers.energy !== "";
    if (id === "motivators") return answers.motivators.length > 0;
    return false;
  }

  async function handleFinish() {
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const passionMap: Record<string, number> = {
      sport: 0, music: 0, tech: 0, stories: 0, animals: 0, art: 0, science: 0,
    };
    answers.passions.forEach((p) => { passionMap[p] = 10; });

    const learningBase = 0.3;
    const learningMap = {
      learning_visual: learningBase,
      learning_auditory: learningBase,
      learning_logical: learningBase,
      learning_kinesthetic: learningBase,
    };
    if (answers.learningStyle) {
      const key = `learning_${answers.learningStyle}` as keyof typeof learningMap;
      learningMap[key] = 0.8;
    }

    const res = await fetch("/api/auth/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        child: {
          name: childName,
          age: childAge,
          grade: childGrade,
          curriculum_type: curriculum,
          session_language: language,
        },
        profile: {
          passion_sport: passionMap.sport,
          passion_music: passionMap.music,
          passion_tech: passionMap.tech,
          passion_stories: passionMap.stories,
          passion_animals: passionMap.animals,
          passion_art: passionMap.art,
          passion_science: passionMap.science,
          ...learningMap,
          current_energy: answers.energy || "medium",
          positive_anchors: answers.motivators.length > 0 ? answers.motivators : ["recompense"],
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Eroare la salvare. Încearcă din nou.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center relative overflow-hidden px-4">
      <AttoFireflies count={5} />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10 flex flex-col items-center gap-3">
          <AttoCharacter state={step === 3 ? "happy" : "listening"} size={72} />
          <h1 className="text-white text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {step === 3 ? `Hai să îl cunosc pe ${firstName}!` : "Spune-ne despre copilul tău"}
          </h1>
          <p className="text-white/50">
            {step === 3 ? "Câteva întrebări rapide pentru Atto" : "Atto se va calibra exact pe el/ea"}
          </p>

          {/* Step indicator — 3 steps now */}
          <div className="flex gap-2 mt-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s <= step ? "w-8 bg-[#E8A020]" : "w-4 bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-[#1B2C3E] rounded-2xl border border-white/10 p-5 sm:p-8 flex flex-col gap-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* ─── STEP 1 ─── */}
          {step === 1 && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-white/70 text-sm font-medium">Prenumele copilului</label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  required
                  className="px-4 py-3 rounded-xl bg-[#0D1B2A]/80 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#E8A020]/50"
                  placeholder="ex. Luca sau Ioana"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white/70 text-sm font-medium">Vârsta</label>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {AGES.map((age) => (
                    <button
                      key={age}
                      type="button"
                      onClick={() => setChildAge(age)}
                      className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                        childAge === age
                          ? "bg-[#E8A020] text-[#3D1500]"
                          : "bg-[#0D1B2A]/60 text-white/60 hover:text-white border border-white/10"
                      }`}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white/70 text-sm font-medium">Clasa</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {GRADES.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setChildGrade(g)}
                      className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                        childGrade === g
                          ? "bg-[#E8A020] text-[#3D1500]"
                          : "bg-[#0D1B2A]/60 text-white/60 hover:text-white border border-white/10"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="amber"
                size="lg"
                className="w-full mt-2"
                disabled={!childName.trim()}
                onClick={() => setStep(2)}
              >
                Continuă →
              </Button>
            </>
          )}

          {/* ─── STEP 2 ─── */}
          {step === 2 && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-white/70 text-sm font-medium">Curriculum</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CURRICULUM_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCurriculum(opt.value)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium text-left transition-all ${
                        curriculum === opt.value
                          ? "bg-[#E8A020] text-[#3D1500]"
                          : "bg-[#0D1B2A]/60 text-white/60 hover:text-white border border-white/10"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white/70 text-sm font-medium">Limba sesiunilor cu Atto</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["ro", "en"] as SessionLanguage[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLanguage(l)}
                      className={`py-3 rounded-xl font-semibold transition-all ${
                        language === l
                          ? "bg-[#1D9E75] text-white"
                          : "bg-[#0D1B2A]/60 text-white/60 hover:text-white border border-white/10"
                      }`}
                    >
                      {l === "ro" ? "Română" : "English"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#0D1B2A]/60 rounded-xl p-4 text-sm text-white/60 space-y-1 border border-white/10">
                <p><span className="text-white/40">Copil:</span> <span className="text-white">{childName}</span>, {childAge} ani, Clasa {childGrade}</p>
                <p><span className="text-white/40">Curriculum:</span> <span className="text-[#3ECDA0]">{CURRICULUM_OPTIONS.find(o => o.value === curriculum)?.label}</span></p>
                <p><span className="text-white/40">Limbă:</span> <span className="text-[#E8A020]">{language === "ro" ? "Română" : "English"}</span></p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white/40 font-semibold transition-all"
                >
                  Înapoi
                </button>
                <Button
                  variant="amber"
                  size="lg"
                  className="flex-1"
                  onClick={() => { setStep(3); setQuestionStep(0); }}
                >
                  Continuă →
                </Button>
              </div>
            </>
          )}

          {/* ─── STEP 3 — Conversational Atto questions ─── */}
          {step === 3 && (
            <>
              {/* Atto speech bubble */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E8A020]/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-[#E8A020] text-xs font-bold">A</span>
                </div>
                <div className="bg-[#0D1B2A]/60 rounded-2xl rounded-tl-sm px-4 py-3 border border-white/10 flex-1">
                  <p className="text-white text-sm leading-relaxed">{currentQuestion.attoText}</p>
                  {currentQuestion.hint && (
                    <p className="text-white/40 text-xs mt-1">{currentQuestion.hint}</p>
                  )}
                </div>
              </div>

              {/* Answer chips */}
              <div className={`grid gap-2 ${currentQuestion.options.length <= 4 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
                {currentQuestion.options.map((opt) => {
                  const selected = getSelected(currentQuestion.id).includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleOption(currentQuestion.id, opt.value)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium text-left transition-all border ${
                        selected
                          ? "bg-[#E8A020] text-[#3D1500] border-[#E8A020]"
                          : "bg-[#0D1B2A]/60 text-white/70 hover:text-white border-white/10 hover:border-white/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Question progress dots */}
              <div className="flex justify-center gap-1.5">
                {STEP3_QUESTIONS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i < questionStep ? "w-5 bg-[#3ECDA0]" : i === questionStep ? "w-5 bg-[#E8A020]" : "w-2.5 bg-white/20"
                    }`}
                  />
                ))}
              </div>

              {/* Nav buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (questionStep === 0) {
                      setStep(2);
                    } else {
                      setQuestionStep((q) => q - 1);
                    }
                  }}
                  className="flex-1 py-3 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white/40 font-semibold transition-all"
                >
                  Înapoi
                </button>

                {questionStep < STEP3_QUESTIONS.length - 1 ? (
                  <Button
                    variant="amber"
                    size="lg"
                    className="flex-1"
                    disabled={!isQuestionAnswered(currentQuestion.id)}
                    onClick={() => setQuestionStep((q) => q + 1)}
                  >
                    Continuă →
                  </Button>
                ) : (
                  <Button
                    variant="amber"
                    size="lg"
                    className="flex-1"
                    disabled={loading || !isQuestionAnswered(currentQuestion.id)}
                    onClick={handleFinish}
                  >
                    {loading ? "Se salvează..." : "Gata, să înceapă Atto! →"}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
