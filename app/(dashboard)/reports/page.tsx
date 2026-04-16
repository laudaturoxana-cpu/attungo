import { createClient } from "@/lib/supabase/server";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: childIds } = await supabase
    .from("children")
    .select("id, name")
    .eq("parent_id", user.id)
    .eq("is_active", true);

  const ids = childIds?.map((c) => c.id) ?? [];

  const { data: reports } = ids.length > 0
    ? await supabase
        .from("parent_reports")
        .select("*")
        .in("child_id", ids)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] };

  const childNameMap = Object.fromEntries((childIds ?? []).map((c) => [c.id, c.name]));

  // Mark unread as read (fire-and-forget)
  if (ids.length > 0) {
    supabase
      .from("parent_reports")
      .update({ is_read: true })
      .in("child_id", ids)
      .eq("is_read", false)
      .then(() => {});
  }

  const REPORT_TYPE_LABELS: Record<string, string> = {
    session: "Sesiune",
    weekly: "Săptămânal",
    monthly: "Lunar",
  };

  type ReportRow = NonNullable<typeof reports>[number];
  const grouped = (reports ?? []).reduce<Record<string, ReportRow[]>>((acc, report) => {
    if (!report) return acc;
    const date = new Date(report.created_at).toLocaleDateString("ro-RO", { month: "long", year: "numeric" });
    if (!acc[date]) acc[date] = [];
    acc[date].push(report);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-[#0D1B2A]" style={{ fontFamily: "var(--font-display)" }}>
          Rapoarte Atto
        </h1>
        <p className="text-[#9B9A93] mt-1">
          Tot ce a observat Atto despre progresul copilului tău.
        </p>
      </div>

      {(!reports || reports.length === 0) ? (
        <div className="bg-white rounded-2xl border border-[#E5E3DC] p-16 text-center">
          <p className="text-4xl mb-4">📋</p>
          <h2 className="text-xl font-bold text-[#0D1B2A] mb-2">Niciun raport încă</h2>
          <p className="text-[#9B9A93]">Rapoartele apar după prima sesiune cu Atto.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(grouped).map(([month, monthReports]) => (
            <div key={month}>
              <h2 className="text-sm font-semibold text-[#9B9A93] uppercase tracking-wider mb-3 capitalize">
                {month}
              </h2>
              <div className="flex flex-col gap-3">
                {monthReports?.map((report) => {
                  const childName = childNameMap[report.child_id] ?? "Copil";
                  const scoreColor = (report.progress_score ?? 0) >= 0.7 ? "#1D9E75" : (report.progress_score ?? 0) >= 0.4 ? "#E8A020" : "#9B9A93";

                  return (
                    <div
                      key={report.id}
                      className="bg-white rounded-2xl border border-[#E5E3DC] p-4 sm:p-6 flex gap-3 sm:gap-5"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-[#F0FDF8] flex items-center justify-center text-xl flex-shrink-0">
                        {report.report_type === "weekly" ? "📊" : report.report_type === "monthly" ? "📅" : "📋"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-[#0D1B2A]">{childName}</span>
                              <span className="text-xs bg-[#F5F4EF] text-[#9B9A93] px-2 py-0.5 rounded-full">
                                {REPORT_TYPE_LABELS[report.report_type] ?? report.report_type}
                              </span>
                              {!report.is_read && (
                                <span className="text-xs bg-[#FEF3C7] border border-[#E8A020]/30 text-[#92520A] px-2 py-0.5 rounded-full">
                                  Nou
                                </span>
                              )}
                            </div>
                            <p className="text-[#9B9A93] text-xs mt-0.5">
                              {new Date(report.created_at).toLocaleDateString("ro-RO", {
                                day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
                              })}
                            </p>
                          </div>

                          {report.progress_score !== null && (
                            <div className="text-right flex-shrink-0">
                              <p className="text-2xl font-black font-mono" style={{ color: scoreColor }}>
                                {Math.round(report.progress_score * 100)}%
                              </p>
                              <p className="text-[#9B9A93] text-xs">progres</p>
                            </div>
                          )}
                        </div>

                        <p className="text-[#3D3C37] text-sm leading-relaxed">{report.summary}</p>

                        {report.atto_message_to_parent && (
                          <div className="mt-3 pl-3 border-l-2 border-[#3ECDA0]/50">
                            <p className="text-[#1D9E75] text-sm italic">
                              &ldquo;{report.atto_message_to_parent}&rdquo;
                            </p>
                            <p className="text-[#9B9A93] text-xs mt-0.5">— Atto</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 mt-3">
                          {report.concepts_learned?.slice(0, 4).map((c) => (
                            <span key={c} className="text-xs bg-[#F0FDF8] text-[#1D9E75] px-2 py-0.5 rounded-full">
                              ✓ {c}
                            </span>
                          ))}
                          {report.concepts_struggling?.slice(0, 2).map((c) => (
                            <span key={c} className="text-xs bg-[#FEF3C7]/50 text-[#92520A] px-2 py-0.5 rounded-full">
                              ⟳ {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
