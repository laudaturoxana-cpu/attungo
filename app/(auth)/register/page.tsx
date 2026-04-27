"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AttoCharacter from "@/components/atto/AttoCharacter";
import AttoFireflies from "@/components/atto/AttoFireflies";
import Button from "@/components/ui/Button";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "essential";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (authError || !authData.user) {
      setError(authError?.message || "Eroare la înregistrare");
      setLoading(false);
      return;
    }

    // If no session (email confirmation required), sign in immediately
    if (!authData.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError("Cont creat! Verifică emailul și loghează-te.");
        setLoading(false);
        return;
      }
    }

    const registerRes = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: authData.user.id, email, name }),
    });

    if (!registerRes.ok) {
      setError("Cont creat, dar eroare la configurare. Contactează-ne.");
      setLoading(false);
      return;
    }

    router.push("/onboarding");
  }

  const PLAN_LABELS: Record<string, { name: string; price: string }> = {
    essential: { name: "Essential", price: "€12/lună" },
    family: { name: "Family", price: "€19/lună" },
    annual: { name: "Annual", price: "€99/an (€8/lună)" },
  };

  return (
    <form onSubmit={handleRegister} className="bg-[#1B2C3E] rounded-2xl border border-white/10 p-5 sm:p-8 flex flex-col gap-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {plan && PLAN_LABELS[plan] && (
        <div className="bg-[#0D1B2A]/60 rounded-xl px-4 py-3 border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-white/40 text-xs">Plan ales</p>
            <p className="text-white font-semibold text-sm">{PLAN_LABELS[plan].name}</p>
          </div>
          <div className="text-right">
            <p className="text-[#E8A020] font-bold text-sm">{PLAN_LABELS[plan].price}</p>
            <p className="text-[#3ECDA0] text-xs">7 zile gratuit</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-white/70 text-sm font-medium">Numele tău complet</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          className="px-4 py-3 rounded-xl bg-[#0D1B2A]/80 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#E8A020]/50 focus:ring-1 focus:ring-[#E8A020]/30 transition-all"
          placeholder="Maria Ionescu"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-white/70 text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="px-4 py-3 rounded-xl bg-[#0D1B2A]/80 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#E8A020]/50 focus:ring-1 focus:ring-[#E8A020]/30 transition-all"
          placeholder="maria@exemplu.ro"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-white/70 text-sm font-medium">Parolă</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="px-4 py-3 rounded-xl bg-[#0D1B2A]/80 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#E8A020]/50 focus:ring-1 focus:ring-[#E8A020]/30 transition-all"
          placeholder="Minim 8 caractere"
        />
      </div>

      <Button
        type="submit"
        variant="amber"
        size="lg"
        disabled={loading}
        className="w-full mt-2"
      >
        {loading ? "Se creează contul..." : "Creează cont →"}
      </Button>

      <p className="text-center text-white/30 text-xs leading-relaxed">
        Prin înregistrare accepți{" "}
        <Link href="/terms" className="underline hover:text-white/60">Termenii</Link>{" "}
        și{" "}
        <Link href="/privacy" className="underline hover:text-white/60">Politica de Confidențialitate</Link>.
      </p>

      <p className="text-center text-white/40 text-sm">
        Ai deja cont?{" "}
        <Link href="/login" className="text-[#3ECDA0] hover:underline">
          Conectează-te
        </Link>
      </p>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center relative overflow-hidden px-4">
      <AttoFireflies count={6} />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center gap-3">
          <AttoCharacter state="happy" size={64} />
          <Link href="/" className="flex items-center gap-1 justify-center">
            <span className="text-2xl font-black" style={{ fontFamily: "var(--font-display)" }}>
              <span style={{ color: "#3ECDA0" }}>at</span>
              <span className="text-white">tungo</span>
            </span>
          </Link>
          <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Începe 7 zile gratuit
          </h1>
        </div>

        <Suspense fallback={
          <div className="bg-[#1B2C3E] rounded-2xl border border-white/10 p-8 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#E8A020] border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
