"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PLANS } from "@/lib/stripe/client";

interface Parent {
  name: string;
  email: string;
  phone: string | null;
  language_preference: string;
  subscription_plan: string;
  subscription_status: string;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
}

export default function SettingsPage() {
  const [parent, setParent] = useState<Parent | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("parents")
        .select("name, email, phone, language_preference, subscription_plan, subscription_status, trial_ends_at, stripe_customer_id")
        .eq("id", user.id)
        .single();

      if (data) {
        setParent(data as Parent);
        setName(data.name ?? "");
        setPhone(data.phone ?? "");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("parents")
      .update({ name, phone: phone || null })
      .eq("id", user.id);

    setSaving(false);
    setSaveMsg(error ? "Eroare la salvare." : "Salvat cu succes!");
    setTimeout(() => setSaveMsg(""), 3000);
  }

  async function handleCheckout(planKey: string) {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planKey }),
    });
    const { url, error } = await res.json();
    if (error) { alert(error); return; }
    if (url) window.location.href = url;
  }

  async function handlePortal() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const { url, error } = await res.json();
    if (error) { alert(error); return; }
    if (url) window.location.href = url;
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-[#E8A020] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const trialDaysLeft = parent?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(parent.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null;

  const isPaid = ["essential", "family", "annual"].includes(parent?.subscription_plan ?? "");
  const isTrialActive = parent?.subscription_plan === "trial" && (trialDaysLeft ?? 0) > 0;

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-[#0D1B2A]" style={{ fontFamily: "var(--font-display)" }}>
          Setări cont
        </h1>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-2xl border border-[#E5E3DC] p-6">
        <h2 className="font-bold text-[#0D1B2A] mb-5">Profil</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[#9B9A93] text-sm font-medium">Nume complet</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="px-4 py-3 rounded-xl bg-[#FAFAF5] border border-[#E5E3DC] text-[#0D1B2A] text-base focus:outline-none focus:ring-2 focus:ring-[#E8A020]/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[#9B9A93] text-sm font-medium">Email</label>
            <input
              type="email"
              value={parent?.email ?? ""}
              disabled
              className="px-4 py-3 rounded-xl bg-[#F5F4EF] border border-[#E5E3DC] text-[#9B9A93] text-base cursor-not-allowed"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[#9B9A93] text-sm font-medium">Telefon (opțional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+40 7xx xxx xxx"
              className="px-4 py-3 rounded-xl bg-[#FAFAF5] border border-[#E5E3DC] text-[#0D1B2A] text-base focus:outline-none focus:ring-2 focus:ring-[#E8A020]/30"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-full bg-[#E8A020] text-[#92520A] font-semibold text-sm hover:bg-[#C17D0A] hover:text-white transition-all disabled:opacity-50"
            >
              {saving ? "Se salvează..." : "Salvează modificările"}
            </button>
            {saveMsg && (
              <span className={`text-sm ${saveMsg.includes("Eroare") ? "text-red-500" : "text-[#1D9E75]"}`}>
                {saveMsg}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-2xl border border-[#E5E3DC] p-6">
        <h2 className="font-bold text-[#0D1B2A] mb-5">Abonament</h2>

        {/* Current status */}
        <div className="flex items-center justify-between p-4 bg-[#FAFAF5] rounded-xl mb-5">
          <div>
            <p className="font-semibold text-[#0D1B2A] capitalize">
              {parent?.subscription_plan === "trial" ? "Trial gratuit" : `Plan ${parent?.subscription_plan}`}
            </p>
            {isTrialActive && (
              <p className="text-[#9B9A93] text-sm">{trialDaysLeft} zile rămase</p>
            )}
            {isPaid && (
              <p className="text-[#1D9E75] text-sm capitalize">{parent?.subscription_status}</p>
            )}
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            isPaid ? "bg-[#F0FDF8] text-[#1D9E75] border border-[#3ECDA0]/30"
            : isTrialActive ? "bg-[#FEF3C7] text-[#92520A] border border-[#E8A020]/30"
            : "bg-[#F5F4EF] text-[#9B9A93] border border-[#E5E3DC]"
          }`}>
            {isPaid ? "Activ" : isTrialActive ? "Trial" : "Expirat"}
          </span>
        </div>

        {/* Manage or upgrade */}
        {isPaid && parent?.stripe_customer_id ? (
          <button
            onClick={handlePortal}
            className="w-full py-3 rounded-full border-2 border-[#E5E3DC] text-[#3D3C37] font-semibold hover:border-[#E8A020]/40 hover:text-[#E8A020] transition-all"
          >
            Gestionează abonamentul (Stripe Portal)
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[#9B9A93] text-sm mb-1">
              {isTrialActive ? "Alege un plan pentru a continua după trial:" : "Activează un plan:"}
            </p>
            {(Object.entries(PLANS) as [string, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => (
              <button
                key={key}
                onClick={() => handleCheckout(key)}
                className="flex items-center justify-between w-full px-5 py-4 rounded-xl border border-[#E5E3DC] hover:border-[#E8A020]/50 hover:bg-[#FEF3C7]/20 transition-all text-left"
              >
                <div>
                  <p className="font-semibold text-[#0D1B2A]">{plan.name}</p>
                  <p className="text-[#9B9A93] text-xs">
                    {plan.interval === "year" ? `€${plan.price_eur}/an` : `€${plan.price_eur}/lună`}
                  </p>
                </div>
                <span className="text-[#E8A020] font-semibold text-sm">Alege →</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 p-6">
        <h2 className="font-bold text-[#0D1B2A] mb-4">Cont</h2>
        <button
          onClick={handleLogout}
          className="px-5 py-2.5 rounded-full border border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-all"
        >
          Deconectează-te
        </button>
      </div>
    </div>
  );
}
