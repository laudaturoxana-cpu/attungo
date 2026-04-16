"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { Lang } from "@/lib/i18n";
import { ro, en } from "@/lib/i18n";

interface HeaderProps {
  lang?: Lang;
  onLangChange?: (lang: Lang) => void;
}

export default function Header({ lang = "ro", onLangChange }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const t = lang === "en" ? en : ro;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#0D1B2A]/95 backdrop-blur-md border-b border-white/10 shadow-lg"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 select-none">
            <span
              className="text-2xl font-black tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span style={{ color: "#3ECDA0" }}>at</span>
              <span className="text-white">tungo</span>
            </span>
            {/* Animated amber dot */}
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#E8A020] animate-glow-pulse"
              style={{ marginLeft: 2 }}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: t.nav.howItWorks, href: "#cum-functioneaza" },
              { label: t.nav.forWho, href: "#pentru-cine" },
              { label: t.nav.pricing, href: "#preturi" },
              { label: t.nav.faq, href: "#faq" },
              { label: t.nav.contact, href: "#contact" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-white/70 hover:text-white text-sm font-medium transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right side: Lang toggle + CTA + Login */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="hidden sm:flex items-center bg-white/10 rounded-full p-0.5 border border-white/20">
              {(["ro", "en"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => onLangChange?.(l)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all",
                    lang === l
                      ? "bg-[#E8A020] text-[#92520A]"
                      : "text-white/60 hover:text-white"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Login link */}
            <Link
              href="/login"
              className="hidden sm:inline-flex text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              {t.nav.login}
            </Link>

            {/* CTA button */}
            <Link
              href="/register"
              className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#E8A020] text-[#92520A] font-semibold text-sm hover:bg-[#C17D0A] hover:text-white transition-all active:scale-95"
            >
              {t.nav.cta}
            </Link>

            {/* Mobile hamburger */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                {menuOpen ? (
                  <path d="M4 4l14 14M4 18L18 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                ) : (
                  <>
                    <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            menuOpen ? "max-h-96 pb-6" : "max-h-0"
          )}
        >
          <nav className="flex flex-col gap-4 pt-4 border-t border-white/10">
            {[
              { label: t.nav.howItWorks, href: "#cum-functioneaza" },
              { label: t.nav.forWho, href: "#pentru-cine" },
              { label: t.nav.pricing, href: "#preturi" },
              { label: t.nav.faq, href: "#faq" },
              { label: t.nav.contact, href: "#contact" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-white/80 hover:text-white font-medium"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            {/* Mobile lang toggle */}
            <div className="flex items-center gap-2 pt-2">
              {(["ro", "en"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => { onLangChange?.(l); setMenuOpen(false); }}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-semibold uppercase transition-all",
                    lang === l
                      ? "bg-[#E8A020] text-[#92520A]"
                      : "bg-white/10 text-white/60 hover:text-white"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
