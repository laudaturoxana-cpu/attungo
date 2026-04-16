import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import AttoCharacter from "@/components/atto/AttoCharacter";

export default async function ChildProfilePage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: child } = await supabase
    .from("children")
    .select(`
      id, name, age, grade, curriculum_type, session_language, atto_name, atto_color, created_at,
      child_profiles (
        learning_visual, learning_auditory, learning_logical, learning_kinesthetic,
        passion_sport, passion_music, passion_tech, passion_stories, passion_animals, passion_art, passion_science,
        positive_anchors, current_energy, current_engagement, current_frustration,
        total_sessions, total_minutes, streak_days, last_session_at
      )
    `)
    .eq("id", childId)
    .eq("parent_id", user.id)
    .single();

  if (!child) notFound();

  const { data: recentSessions } = await supabase
    .from("sessions")
    .select("id, subject, topic, duration_minutes, avg_engagement, concepts_mastered_today, started_at, session_completed")
    .eq("child_id", childId)
    .order("started_at", { ascending: false })
    .limit(5);

  const { data: reports } = await supabase
    .from("parent_reports")
    .select("id, report_type, summary, atto_message_to_parent, engagement_score, progress_score, created_at, is_read")
    .eq("child_id", childId)
    .order("created_at", { ascending: false })
    .limit(3);

  const profile = Array.isArray(child.child_profiles)
    ? child.child_profiles[0]
    : child.child_profiles;

  const CURRICULUM_LABELS: Record<string, string> = {
    RO_NATIONAL: "Curriculum Național RO",
    US_COMMON_CORE: "US Common Core",
    EN_CAMBRIDGE: "Cambridge EN",
    US_HOMESCHOOL: "Homeschool US",
  };

  const passions = [
    { key: "passion_sport", label: "Sport", emoji: "⚽" },
    { key: "passion_music", label: "Muzică", emoji: "🎵" },
    { key: "passion_tech", label: "Tech", emoji: "💻" },
    { key: "passion_stories", label: "Povești", emoji: "📚" },
    { key: "passion_animals", label: "Animale", emoji: "🐾" },
    { key: "passion_art", label: "Artă", emoji: "🎨" },
    { key: "passion_science", label: "Știință", emoji: "🔬" },
  ] as const;

  const learnStyles = [
    { key: "learning_visual", label: "Vizual", color: "#3ECDA0" },
    { key: "learning_auditory", label: "Auditiv", color: "#E8A020" },
    { key: "learning_logical", label: "Logic", color: "#4A9EE8" },
    { key: "learning_kinesthetic", label: "Kinestezic", color: "#A855F7" },
  ] as const;

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Link href="/children" className="text-[#9B9A93] hover:text-[#E8A020] transition-colors text-sm mt-1">
          ← Înapoi
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1B2C3E] to-[#0D1B2A] flex items-center justify-center">
              <AttoCharacter
                state={profile?.current_energy === "high" ? "happy" : "neutral"}
                size={40}
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#0D1B2A]" style={{ fontFamily: "var(--font-display)" }}>
                {child.name}
              </h1>
              <p className="text-[#9B9A93]">
                Clasa {child.grade} · {child.age} ani · {CURRICULUM_LABELS[child.curriculum_type]}
              </p>
            </div>
          </div>
        </div>
        <Link
          href={`/session/${child.id}`}
          className="px-5 py-2.5 rounded-full bg-[#E8A020] text-[#92520A] font-semibold text-sm hover:bg-[#C17D0A] hover:text-white transition-all"
        >
          Sesiune cu Atto →
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Sesiuni totale", value: profile?.total_sessions ?? 0, suffix: "" },
          { label: "Minute totale", value: profile?.total_minutes ?? 0, suffix: " min" },
          { label: "Streak", value: profile?.streak_days ?? 0, suffix: " zile 🔥" },
          { label: "Engagement", value: Math.round((profile?.current_engagement ?? 0) * 100), suffix: "%" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-[#E5E3DC] p-5 text-center">
            <p className="text-3xl font-black text-[#0D1B2A]" style={{ fontFamily: "var(--font-mono)" }}>
              {stat.value}{stat.suffix}
            </p>
            <p className="text-[#9B9A93] text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Learning style */}
        <div className="bg-white rounded-2xl border border-[#E5E3DC] p-6">
          <h2 className="font-bold text-[#0D1B2A] mb-4">Stil de învățare</h2>
          <div className="flex flex-col gap-3">
            {learnStyles.map((style) => {
              const val = profile ? (profile[style.key] as number) ?? 0 : 0;
              return (
                <div key={style.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#3D3C37]">{style.label}</span>
                    <span className="text-[#9B9A93] font-mono">{Math.round(val * 100)}%</span>
                  </div>
                  <div className="h-2 bg-[#F5F4EF] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${val * 100}%`, backgroundColor: style.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Passions */}
        <div className="bg-white rounded-2xl border border-[#E5E3DC] p-6">
          <h2 className="font-bold text-[#0D1B2A] mb-4">Pasiuni detectate de Atto</h2>
          <div className="grid grid-cols-2 gap-2">
            {passions.map((passion) => {
              const val = profile ? (profile[passion.key] as number) ?? 0 : 0;
              const level = val >= 0.7 ? "high" : val >= 0.4 ? "medium" : "low";
              return (
                <div
                  key={passion.key}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                    level === "high"
                      ? "bg-[#F0FDF8] border border-[#3ECDA0]/30 text-[#1D9E75]"
                      : level === "medium"
                      ? "bg-[#FEF3C7]/50 border border-[#E8A020]/20 text-[#92520A]"
                      : "bg-[#F5F4EF] border border-[#E5E3DC] text-[#9B9A93]"
                  }`}
                >
                  <span>{passion.emoji}</span>
                  <span className="font-medium">{passion.label}</span>
                  <span className="ml-auto font-mono text-xs">{Math.round(val * 100)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent sessions */}
      {recentSessions && recentSessions.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E3DC] p-6">
          <h2 className="font-bold text-[#0D1B2A] mb-4">Sesiuni recente</h2>
          <div className="flex flex-col gap-3">
            {recentSessions.map((session) => (
              <div key={session.id} className="flex items-start gap-4 py-3 border-b border-[#F5F4EF] last:border-0">
                <div className="w-10 h-10 rounded-xl bg-[#F0FDF8] flex items-center justify-center text-[#1D9E75] flex-shrink-0 text-sm font-bold">
                  {session.session_completed ? "✓" : "○"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#0D1B2A] text-sm">{session.subject}</p>
                    {session.topic !== session.subject && (
                      <span className="text-[#9B9A93] text-xs">· {session.topic}</span>
                    )}
                  </div>
                  {session.concepts_mastered_today && session.concepts_mastered_today.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {session.concepts_mastered_today.slice(0, 3).map((c) => (
                        <span key={c} className="text-xs bg-[#F0FDF8] text-[#1D9E75] px-2 py-0.5 rounded-full">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[#9B9A93] text-xs">
                    {new Date(session.started_at).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}
                  </p>
                  {session.duration_minutes && (
                    <p className="text-[#9B9A93] text-xs">{session.duration_minutes} min</p>
                  )}
                  {session.avg_engagement > 0 && (
                    <p className="text-[#3ECDA0] text-xs font-mono">{Math.round(session.avg_engagement * 100)}%</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent reports */}
      {reports && reports.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E3DC] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#0D1B2A]">Rapoarte Atto</h2>
            <Link href="/reports" className="text-[#E8A020] text-sm hover:underline">
              Toate →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {reports.map((report) => (
              <div key={report.id} className="flex gap-4 py-3 border-b border-[#F5F4EF] last:border-0">
                <div className="w-10 h-10 rounded-xl bg-[#F0FDF8] flex items-center justify-center flex-shrink-0">
                  📋
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-[#FEF3C7]/50 border border-[#E8A020]/20 text-[#92520A] px-2 py-0.5 rounded-full capitalize">
                      {report.report_type}
                    </span>
                    {!report.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#E8A020]" />
                    )}
                  </div>
                  <p className="text-[#3D3C37] text-sm line-clamp-2">{report.summary}</p>
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
      )}

      {/* Positive anchors */}
      {profile?.positive_anchors && profile.positive_anchors.length > 0 && (
        <div className="bg-[#F0FDF8] rounded-2xl border border-[#3ECDA0]/20 p-6">
          <h2 className="font-bold text-[#1D9E75] mb-3">Ancorele pozitive ale lui Atto</h2>
          <div className="flex flex-wrap gap-2">
            {(profile.positive_anchors as string[]).map((anchor) => (
              <span key={anchor} className="bg-white border border-[#3ECDA0]/30 text-[#1D9E75] text-sm px-3 py-1 rounded-full">
                {anchor}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
