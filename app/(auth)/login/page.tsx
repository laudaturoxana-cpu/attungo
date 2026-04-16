"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AttoCharacter from "@/components/atto/AttoCharacter";
import AttoFireflies from "@/components/atto/AttoFireflies";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center relative overflow-hidden px-4">
      <AttoFireflies count={6} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center gap-3">
          <AttoCharacter state="listening" size={64} />
          <Link href="/" className="flex items-center gap-1 justify-center">
            <span className="text-2xl font-black" style={{ fontFamily: "var(--font-display)" }}>
              <span style={{ color: "#3ECDA0" }}>at</span>
              <span className="text-white">tungo</span>
            </span>
          </Link>
          <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Bun revenit
          </h1>
          <p className="text-white/50 text-sm">Intră în contul tău Attungo</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-[#1B2C3E] rounded-2xl border border-white/10 p-5 sm:p-8 flex flex-col gap-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-white/70 text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="px-4 py-3 rounded-xl bg-[#0D1B2A]/80 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#E8A020]/50 focus:ring-1 focus:ring-[#E8A020]/30 transition-all"
              placeholder="parinte@exemplu.ro"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-white/70 text-sm font-medium">Parolă</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="px-4 py-3 rounded-xl bg-[#0D1B2A]/80 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#E8A020]/50 focus:ring-1 focus:ring-[#E8A020]/30 transition-all"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            variant="amber"
            size="lg"
            disabled={loading}
            className="w-full mt-2"
          >
            {loading ? "Se încarcă..." : "Intră în cont"}
          </Button>

          <p className="text-center text-white/40 text-sm">
            Nu ai cont?{" "}
            <Link href="/register" className="text-[#3ECDA0] hover:underline">
              Înregistrează-te
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
