import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AttoCharacter from "@/components/atto/AttoCharacter";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: parent } = await supabase
    .from("parents")
    .select("name, subscription_plan, trial_ends_at")
    .eq("id", user.id)
    .single();

  const { data: children } = await supabase
    .from("children")
    .select(`
      id, name, age, grade, curriculum_type, session_language,
      child_profiles (
        total_sessions, total_minutes, streak_days, current_energy,
        current_engagement, last_session_at
      )
    `)
    .eq("parent_id", user.id)
    .eq("is_active", true);

  const trialDaysLeft = parent?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(parent.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null;

  const PLAN_LIMITS: Record<string, number> = { trial: 1, essential: 1, family: 3, annual: 1, cancelled: 0 };
  const childLimit = PLAN_LIMITS[parent?.subscription_plan ?? "trial"] ?? 1;
  const childCount = children?.length ?? 0;
  const canAddChild = childCount < childLimit;

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0D1B2A]" style={{ fontFamily: "var(--font-display)" }}>
            Bun venit înapoi, {parent?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-[#9B9A93] mt-1">Uite ce s-a întâmplat cu Atto azi.</p>
        </div>

        {parent?.subscription_plan === "trial" && trialDaysLeft !== null && (
          <div className="bg-[#FEF3C7] border border-[#E8A020]/30 rounded-xl px-4 py-3 text-sm text-[#92520A] text-right">
            <p className="font-bold">{trialDaysLeft} zile rămase în trial</p>
            <Link href="/settings" className="text-[#E8A020] underline text-xs">
              Activează abonamentul
            </Link>
          </div>
        )}
      </div>

      {/* Children cards */}
      {(!children || children.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 gap-6 bg-white rounded-2xl border border-[#E5E3DC]">
          <AttoCharacter state="listening" size={80} />
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#0D1B2A] mb-2" style={{ fontFamily: "var(--font-display)" }}>
              Adaugă primul copil
            </h2>
            <p className="text-[#9B9A93] mb-6">Atto e gata să se calibreze pe el/ea.</p>
            <Link
              href="/onboarding"
              className="inline-flex items-center px-6 py-3 rounded-full bg-[#E8A020] text-[#3D1500] font-semibold hover:bg-[#C17D0A] hover:text-white transition-all"
            >
              Adaugă copil →
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => {
            const profile = Array.isArray(child.child_profiles)
              ? child.child_profiles[0]
              : child.child_profiles;

            return (
              <div
                key={child.id}
                className="bg-white rounded-2xl border border-[#E5E3DC] overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all group"
              >
                {/* Card header — navy gradient */}
                <div className="bg-gradient-to-br from-[#1B2C3E] to-[#0D1B2A] p-5 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-lg">{child.name}</p>
                    <p className="text-white/50 text-sm">Clasa {child.grade} · {child.age} ani</p>
                  </div>
                  <AttoCharacter
                    state={profile?.current_energy === "high" ? "happy" : "neutral"}
                    size={44}
                  />
                </div>

                {/* Stats */}
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

                  {/* Engagement bar */}
                  <div>
                    <div className="flex justify-between text-xs text-[#9B9A93] mb-1">
                      <span>Engagement azi</span>
                      <span>{Math.round((profile?.current_engagement ?? 0.8) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-[#E5E3DC] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3ECDA0] rounded-full"
                        style={{ width: `${(profile?.current_engagement ?? 0.8) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Link
                      href={`/session/${child.id}`}
                      className="flex-1 py-2.5 rounded-full bg-[#E8A020] text-[#3D1500] font-semibold text-sm text-center hover:bg-[#C17D0A] hover:text-white transition-all"
                    >
                      Sesiune cu Atto →
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

          {/* Add another child card — visible only if under plan limit */}
          {canAddChild ? (
            <Link
              href="/onboarding"
              className="bg-white rounded-2xl border-2 border-dashed border-[#E5E3DC] p-8 flex flex-col items-center justify-center gap-3 hover:border-[#E8A020]/40 hover:bg-[#FEF3C7]/20 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#E8A020] text-2xl">
                +
              </div>
              <p className="text-[#9B9A93] text-sm font-medium">Adaugă copil</p>
            </Link>
          ) : (
            <Link
              href="/settings"
              className="bg-white rounded-2xl border-2 border-dashed border-[#E5E3DC] p-8 flex flex-col items-center justify-center gap-3 hover:border-[#3ECDA0]/30 hover:bg-[#F0FDF8]/50 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-[#F0FDF8] flex items-center justify-center text-[#1D9E75] text-lg font-bold">
                ↑
              </div>
              <p className="text-[#9B9A93] text-sm font-medium text-center">
                Upgrade la Family<br />
                <span className="text-xs text-[#3ECDA0]">pentru 3 profiluri</span>
              </p>
            </Link>
          )}
        </div>
      )}

      {/* Recent reports */}
      <RecentReports parentId={user.id} />
    </div>
  );
}

async function RecentReports({ parentId }: { parentId: string }) {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("parent_reports")
    .select("*, children(name)")
    .in(
      "child_id",
      (await supabase.from("children").select("id").eq("parent_id", parentId)).data?.map((c) => c.id) ?? []
    )
    .order("created_at", { ascending: false })
    .limit(3);

  if (!reports?.length) return null;

  return (
    <div>
      <h2 className="text-xl font-bold text-[#0D1B2A] mb-4" style={{ fontFamily: "var(--font-display)" }}>
        Rapoarte recente
      </h2>
      <div className="flex flex-col gap-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-xl border border-[#E5E3DC] p-5 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-[#F0FDF8] flex items-center justify-center text-[#1D9E75] flex-shrink-0">
              📋
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-semibold text-[#0D1B2A] text-sm">
                  {(report as unknown as { children?: { name: string } | null }).children?.name} · {report.report_type === "session" ? "Sesiune" : "Raport"}
                </p>
                {!report.is_read && (
                  <span className="w-2 h-2 rounded-full bg-[#E8A020] flex-shrink-0" />
                )}
              </div>
              <p className="text-[#9B9A93] text-sm line-clamp-2">{report.summary}</p>
              {report.atto_message_to_parent && (
                <p className="text-[#1D9E75] text-xs mt-1 italic">
                  &ldquo;{report.atto_message_to_parent}&rdquo;
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
