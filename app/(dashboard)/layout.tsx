import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: parent } = await supabase
    .from("parents")
    .select("name, subscription_plan, subscription_status")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#FAFAF5]">
      {/* Top nav */}
      <header className="bg-[#0D1B2A] border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-1 shrink-0">
              <span className="text-lg font-black" style={{ fontFamily: "var(--font-display)" }}>
                <span style={{ color: "#3ECDA0" }}>at</span>
                <span className="text-white">tungo</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link href="/dashboard" className="text-white/70 hover:text-white transition-colors">Dashboard</Link>
              <Link href="/children" className="text-white/70 hover:text-white transition-colors">Copiii</Link>
              <Link href="/reports" className="text-white/70 hover:text-white transition-colors">Rapoarte</Link>
              <Link href="/settings" className="text-white/70 hover:text-white transition-colors">Setări</Link>
            </nav>

            {/* Right */}
            <div className="flex items-center gap-3">
              {parent?.subscription_plan === "trial" && (
                <Link href="/settings" className="hidden sm:inline-flex text-xs bg-[#FEF3C7]/10 border border-[#E8A020]/30 text-[#E8A020] px-2 py-0.5 rounded-full hover:bg-[#FEF3C7]/20 transition-all">
                  Trial
                </Link>
              )}
              <form action="/api/auth/logout" method="POST">
                <button className="text-white/40 hover:text-white/70 text-xs transition-colors px-2 py-1">
                  Ieși
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0D1B2A] border-t border-white/10 z-40 safe-area-pb">
        <div className="flex items-center justify-around h-14">
          {[
            { href: "/dashboard", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
            { href: "/children", label: "Copii", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
            { href: "/reports", label: "Rapoarte", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
            { href: "/settings", label: "Setări", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 text-white/50 hover:text-white transition-colors px-3 py-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="md:hidden h-14" />
    </div>
  );
}
