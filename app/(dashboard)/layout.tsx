import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get parent info
  const { data: parent } = await supabase
    .from("parents")
    .select("name, subscription_plan, subscription_status")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#FAFAF5]">
      {/* Sidebar / header */}
      <header className="bg-[#0D1B2A] border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-1">
              <span className="text-lg font-black" style={{ fontFamily: "var(--font-display)" }}>
                <span style={{ color: "#3ECDA0" }}>at</span>
                <span className="text-white">tungo</span>
              </span>
              <span className="w-1 h-1 rounded-full bg-[#E8A020] ml-0.5 animate-glow-pulse" />
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link href="/dashboard" className="text-white/70 hover:text-white transition-colors">Dashboard</Link>
              <Link href="/children" className="text-white/70 hover:text-white transition-colors">Copiii</Link>
              <Link href="/reports" className="text-white/70 hover:text-white transition-colors">Rapoarte</Link>
              <Link href="/settings" className="text-white/70 hover:text-white transition-colors">Setări</Link>
            </nav>

            {/* User info + plan */}
            <div className="flex items-center gap-3">
              {parent && (
                <span className="hidden sm:block text-white/50 text-xs">
                  {parent.name?.split(" ")[0]}
                </span>
              )}
              {parent?.subscription_plan === "trial" && (
                <span className="text-xs bg-[#FEF3C7]/10 border border-[#E8A020]/30 text-[#E8A020] px-2 py-0.5 rounded-full">
                  Trial
                </span>
              )}
              <form action="/api/auth/logout" method="POST">
                <button className="text-white/40 hover:text-white/70 text-xs transition-colors">
                  Ieși
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
