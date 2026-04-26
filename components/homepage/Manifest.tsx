import Link from "next/link";
import AttoCharacter from "@/components/atto/AttoCharacter";
import AttoFireflies from "@/components/atto/AttoFireflies";
import type { Lang } from "@/lib/i18n";
import { ro, en } from "@/lib/i18n";

interface ManifestProps {
  lang?: Lang;
}

export default function Manifest({ lang = "ro" }: ManifestProps) {
  const t = lang === "en" ? en : ro;

  return (
    <section className="relative py-20 sm:py-28 lg:py-36 bg-[#0D1B2A] overflow-hidden text-center">
      <AttoFireflies count={6} />

      <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8 px-4 max-w-4xl mx-auto">
        <AttoCharacter state="happy" size={96} />

        <h2
          className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t.manifest.line1}
          <br />
          <span className="text-amber-gradient">{t.manifest.line2}</span>
        </h2>

        <p className="text-white/30 text-xs sm:text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          {t.manifest.tagline}
        </p>

        <Link
          href="/register"
          className="mt-2 inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-full bg-[#E8A020] text-[#3D1500] font-bold text-base sm:text-lg hover:bg-[#C17D0A] hover:text-white transition-all active:scale-95 glow-amber"
        >
          {lang === "ro" ? "Încearcă 7 zile gratuit →" : "Try 7 days free →"}
        </Link>
      </div>
    </section>
  );
}
