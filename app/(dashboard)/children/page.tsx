import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AttoCharacter from "@/components/atto/AttoCharacter";

export default async function ChildrenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: children } = await supabase
    .from("children")
    .select(`
      id, name, age, grade, curriculum_type, session_language, atto_name, atto_color, is_active, created_at,
      child_profiles (
        total_sessions, total_minutes, streak_days, current_energy, current_engagement, last_session_at
      )
    `)
    .eq("parent_id", user.id)
    .order("created_at", { ascending: true });

  const { data: parent } = await supabase
    .from("parents")
    .select("subscription_plan")
    .eq("id", user.id)
    .single();

  const planLimits: Record<string, number> = { trial: 1, essential: 1, family: 3, annual: 1, cancelled: 0 };
  const limit = planLimits[parent?.subscription_plan ?? "trial"] ?? 1;
  const activeCount = children?.filter((c) => c.is_active).length ?? 0;
  const canAddMore = activeCount < limit;

  const CURRICULUM_LABELS: Record<string, string> = {
    RO_NATIONAL: "Curriculum RO",
    US_COMMON_CORE: "US Common Core",
    EN_CAMBRIDGE: "Cambridge EN",
    US_HOMESCHOOL: "Homeschool US",
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0D1B2A]" style={{ fontFamily: "var(--font-display)" }}>
            Copiii mei
          </h1>
          <p className="text-[#9B9A93] mt-1">
            {activeCount} / {limit} {limit === 1 ? "profil activ" : "profiluri active"}
          </p>
        </div>
        {canAddMore && (
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E8A020] text-[#3D1500] font-semibold text-sm hover:bg-[#C17D0A] hover:text-white transition-all"
          >
            + Adaugă copil
          </Link>
        )}
      </div>

      {(!children || children.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 gap-6 bg-white rounded-2xl border border-[#E5E3DC]">
          <AttoCharacter state="listening" size={80} />
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#0D1B2A] mb-2" style={{ fontFamily: "var(--font-display)" }}>
              Niciun copil adăugat încă
            </h2>
            <p className="text-[#9B9A93] mb-6">Atto e gata să se calibreze pe el/ea.</p>
            <Link
              href="/onboarding"
              className="inline-flex items-center px-6 py-3 rounded-full bg-[#E8A020] text-[#3D1500] font-semibold hover:bg-[#C17D0A] hover:text-white transition-all"
            >
              Adaugă primul copil →
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => {
            const profile = Array.isArray(child.child_profiles)
              ? child.child_profiles[0]
              : child.child_profiles;

            const lastSession = profile?.last_session_at
              ? new Date(profile.last_session_at).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })
              : null;

            return (
              <div
                key={child.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                  child.is_active
                    ? "border-[#E5E3DC] hover:shadow-md hover:-translate-y-1"
                    : "border-[#E5E3DC] opacity-50"
                }`}
              >
                <div className="bg-gradient-to-br from-[#1B2C3E] to-[#0D1B2A] p-5 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-lg">{child.name}</p>
                    <p className="text-white/50 text-sm">
                      Clasa {child.grade} · {child.age} ani
                    </p>
                    <p className="text-white/30 text-xs mt-0.5">
                      {CURRICULUM_LABELS[child.curriculum_type] ?? child.curriculum_type}
                      {" · "}
                      {child.session_language === "ro" ? "Română" : "English"}
                    </p>
                  </div>
                  <AttoCharacter
                    state={profile?.current_energy === "high" ? "happy" : profile?.current_energy === "low" ? "concerned" : "neutral"}
                    size={44}
                  />
                </div>

                <div className="p-5 flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-2xl font-black text-[#0D1B2A]" style={{ fontFamily: "var(--font-mono)" }}>
                        {profile?.total_sessions ?? 0}
                      </p>
                      <p className="text-[#9B9A93] text-xs">sesiuni</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-[#0D1B2A]" style={{ fontFamily: "var(--font-mono)" }}>
                        {profile?.total_minutes ?? 0}
                      </p>
                      <p className="text-[#9B9A93] text-xs">minute</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-[#E8A020]" style={{ fontFamily: "var(--font-mono)" }}>
                        🔥{profile?.streak_days ?? 0}
                      </p>
                      <p className="text-[#9B9A93] text-xs">streak</p>
                    </div>
                  </div>

                  {lastSession && (
                    <p className="text-[#9B9A93] text-xs text-center">
                      Ultima sesiune: {lastSession}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Link
                      href={`/session/${child.id}`}
                      className="flex-1 py-2.5 rounded-full bg-[#E8A020] text-[#3D1500] font-semibold text-sm text-center hover:bg-[#C17D0A] hover:text-white transition-all"
                    >
                      Sesiune →
                    </Link>
                    <Link
                      href={`/children/${child.id}`}
                      className="px-4 py-2.5 rounded-full border border-[#E5E3DC] text-[#9B9A93] font-semibold text-sm hover:border-[#E8A020]/40 hover:text-[#E8A020] transition-all"
                    >
                      Profil
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {canAddMore && (
            <Link
              href="/onboarding"
              className="bg-white rounded-2xl border-2 border-dashed border-[#E5E3DC] p-8 flex flex-col items-center justify-center gap-3 hover:border-[#E8A020]/40 hover:bg-[#FEF3C7]/20 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#E8A020] text-2xl">
                +
              </div>
              <p className="text-[#9B9A93] text-sm font-medium">Adaugă copil</p>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
