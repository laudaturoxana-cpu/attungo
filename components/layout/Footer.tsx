import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { ro, en } from "@/lib/i18n";

interface FooterProps {
  lang?: Lang;
}

export default function Footer({ lang = "ro" }: FooterProps) {
  const t = lang === "en" ? en : ro;

  return (
    <footer className="bg-[#0D1B2A] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center sm:items-start gap-1.5">
            <div className="flex items-center gap-1">
              <span className="text-xl font-black" style={{ fontFamily: "var(--font-display)" }}>
                <span style={{ color: "#3ECDA0" }}>at</span>
                <span className="text-white">tungo</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8A020] animate-glow-pulse ml-0.5" />
            </div>
            <p className="text-white/40 text-sm text-center sm:text-left">{t.footer.tagline}</p>
            <p className="text-white/25 text-xs font-mono">We don&apos;t teach. We attune.</p>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-5 sm:gap-6 text-sm flex-wrap justify-center">
            <Link href="/privacy" className="text-white/50 hover:text-white transition-colors">
              {t.footer.privacy}
            </Link>
            <Link href="/terms" className="text-white/50 hover:text-white transition-colors">
              {t.footer.terms}
            </Link>
            <a href="#contact" className="text-white/50 hover:text-white transition-colors">
              {t.footer.contact}
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-white/30 text-xs text-center sm:text-right">{t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
