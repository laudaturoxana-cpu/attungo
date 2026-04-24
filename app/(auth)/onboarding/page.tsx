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

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState<number>(9);
  const [childGrade, setChildGrade] = useState<number>(3);
  const [curriculum, setCurriculum] = useState<CurriculumType>("RO_NATIONAL");
  const [language, setLanguage] = useState<SessionLanguage>("ro");

  const PLAN_LIMITS: Record<string, number> = {
    trial: 1,
    essential: 1,
    family: 3,
    annual: 1,
    cancelled: 0,
  };

  async function handleFinish() {
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Check plan child limit
    const { data: parent } = await supabase
      .from("parents")
      .select("subscription_plan")
      .eq("id", user.id)
      .single();

    const plan = parent?.subscription_plan ?? "trial";
    const limit = PLAN_LIMITS[plan] ?? 1;

    const { count } = await supabase
      .from("children")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", user.id)
      .eq("is_active", true);

    if ((count ?? 0) >= limit) {
      const planLabel = plan === "family" ? "Family (3 copii)" : "Essential/Annual (1 copil)";
      setError(
        plan === "cancelled"
          ? "Abonamentul tău a expirat. Activează un plan din Setări."
          : `Planul tău ${planLabel} permite maximum ${limit} ${limit === 1 ? "copil" : "copii"}. Upgradează la Family pentru 3 profiluri.`
      );
      setLoading(false);
      return;
    }

    const { error: dbError } = await supabase.from("children").insert({
      parent_id: user.id,
      name: childName,
      age: childAge,
      grade: childGrade,
      curriculum_type: curriculum,
      session_language: language,
      atto_color: "#E8A020",
      atto_name: "Atto",
      is_active: true,
    });

    if (dbError) {
      setError("Eroare la salvare. Încearcă din nou.");
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
          <AttoCharacter state="listening" size={72} />
          <h1 className="text-white text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Spune-ne despre copilul tău
          </h1>
          <p className="text-white/50">Atto se va calibra exact pe el/ea</p>

          {/* Step indicator */}
          <div className="flex gap-2 mt-2">
            {[1, 2].map((s) => (
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

          {step === 1 && (
            <>
              {/* Child name */}
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

              {/* Age */}
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

              {/* Grade */}
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

          {step === 2 && (
            <>
              {/* Curriculum */}
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

              {/* Language */}
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

              {/* Summary */}
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
                  className="flex-2 flex-1"
                  disabled={loading}
                  onClick={handleFinish}
                >
                  {loading ? "Se salvează..." : "Gata, să începem!"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
