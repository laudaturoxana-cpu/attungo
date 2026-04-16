"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AttoCharacter, { type AttoState } from "@/components/atto/AttoCharacter";
import AttoFireflies from "@/components/atto/AttoFireflies";
import type { Lang } from "@/lib/i18n";
import { ro, en } from "@/lib/i18n";

interface HeroProps {
  lang?: Lang;
}

const DEMO_RO = [
  { role: "atto" as const, text: "Înainte să începem, spune-mi un lucru la care ești deja bun. Orice!", state: "listening" as AttoState },
  { role: "child" as const, text: "La Minecraft știu să construiesc orice!" },
  { role: "atto" as const, text: "Wow, asta e o super putere! Acum rezolvăm matematica exact cum construiești în Minecraft. Ce pui primul?", state: "happy" as AttoState },
];

const DEMO_EN = [
  { role: "atto" as const, text: "Before we start, tell me one thing you're already good at. Anything!", state: "listening" as AttoState },
  { role: "child" as const, text: "I can build anything in Minecraft!" },
  { role: "atto" as const, text: "Wow, that's a superpower! Now let's solve maths the way you build in Minecraft. What do you place first?", state: "happy" as AttoState },
];

export default function Hero({ lang = "ro" }: HeroProps) {
  const t = lang === "en" ? en : ro;
  const demo = lang === "en" ? DEMO_EN : DEMO_RO;

  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [attoState, setAttoState] = useState<AttoState>("listening");
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {
    const timings = [0, 1800, 3000, 4800];
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    function runLoop() {
      setVisibleMessages(0);
      setAttoState("listening");
      setShowTyping(false);

      timeouts.push(setTimeout(() => setVisibleMessages(1), timings[0]));
      timeouts.push(setTimeout(() => setVisibleMessages(2), timings[1]));
      timeouts.push(setTimeout(() => { setShowTyping(true); setAttoState("thinking"); }, timings[2]));
      timeouts.push(setTimeout(() => { setShowTyping(false); setVisibleMessages(3); setAttoState("happy"); }, timings[3]));
      timeouts.push(setTimeout(() => runLoop(), 7000));
    }

    const start = setTimeout(runLoop, 500);
    return () => { clearTimeout(start); timeouts.forEach(clearTimeout); };
  }, [lang]);

  return (
    <section className="relative min-h-screen bg-[#0D1B2A] flex items-center overflow-hidden">
      <AttoFireflies count={8} />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* LEFT — Copy */}
          <div className="flex flex-col gap-6 text-center lg:text-left animate-slide-up">
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.1]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t.hero.titleLine1}{" "}
              <span className="text-amber-gradient">{t.hero.titleHighlight}</span>
              <br />
              {t.hero.titleLine2}
              <br />
              <span className="text-[#3ECDA0]">{t.hero.titleLine3}</span>
            </h1>

            <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
              {t.hero.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-4 rounded-full bg-[#E8A020] text-[#92520A] font-bold text-base sm:text-lg hover:bg-[#C17D0A] hover:text-white transition-all active:scale-95 glow-amber"
              >
                {t.hero.ctaPrimary}
              </Link>
              <a
                href="#cum-functioneaza"
                className="inline-flex items-center justify-center px-6 py-4 rounded-full border-2 border-white/30 text-white font-semibold hover:border-white/60 hover:bg-white/10 transition-all"
              >
                {t.hero.ctaSecondary}
              </a>
            </div>

            <p className="text-white/40 text-xs sm:text-sm" style={{ fontFamily: "var(--font-mono)" }}>
              {t.hero.trustBar}
            </p>
          </div>

          {/* RIGHT — Phone mockup */}
          <div className="flex justify-center w-full">
            <div className="relative">
              <div className="relative w-[260px] sm:w-[300px] bg-[#1B2C3E] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden">
                {/* Notch */}
                <div className="h-7 bg-[#0D1B2A] flex items-center justify-center">
                  <div className="w-14 h-1 bg-white/20 rounded-full" />
                </div>

                {/* Chat header */}
                <div className="px-3 py-2.5 bg-[#1B2C3E] border-b border-white/10 flex items-center gap-2.5">
                  <AttoCharacter state={attoState} size={32} />
                  <div>
                    <p className="text-white font-semibold text-xs">Atto</p>
                    <p className="text-[#3ECDA0] text-xs">
                      {attoState === "thinking" ? t.demo.statusThinking : t.demo.statusListening}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-1 bg-[#FEF3C7]/10 rounded-full px-2 py-0.5">
                    <span className="text-[#E8A020] text-xs">★</span>
                    <span className="text-white/60 text-xs">3</span>
                  </div>
                </div>

                {/* Messages */}
                <div className="px-3 py-3 space-y-2.5 min-h-[200px] bg-[#FAFAF5]">
                  {demo.map((msg, i) => {
                    if (i >= visibleMessages) return null;
                    return (
                      <div
                        key={i}
                        className={`flex gap-2 items-end animate-slide-up ${msg.role === "child" ? "flex-row-reverse" : ""}`}
                      >
                        {msg.role === "atto" && (
                          <AttoCharacter state={msg.state} size={22} className="flex-shrink-0" />
                        )}
                        <div className={`max-w-[78%] px-2.5 py-2 text-xs leading-relaxed ${
                          msg.role === "atto" ? "bubble-atto text-[#1B5E4F]" : "bubble-child"
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}

                  {showTyping && (
                    <div className="flex gap-2 items-end animate-fade-in">
                      <AttoCharacter state="thinking" size={22} className="flex-shrink-0" />
                      <div className="bubble-atto px-3 py-2.5 flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] inline-block"
                            style={{ animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Input bar */}
                <div className="px-3 py-2.5 bg-white border-t border-[#E5E3DC] flex gap-2">
                  <div className="flex-1 bg-[#FAFAF5] border border-[#E5E3DC] rounded-full px-3 py-1.5 text-xs text-[#9B9A93]">
                    {lang === "ro" ? "Scrie răspunsul tău..." : "Type your answer..."}
                  </div>
                  <button className="w-7 h-7 rounded-full bg-[#E8A020] flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M8 3l4 4-4 4" stroke="#92520A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="absolute -inset-8 rounded-full opacity-20 blur-3xl -z-10"
                style={{ background: "radial-gradient(circle, #E8A020, transparent 70%)" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#FAFAF5] to-transparent pointer-events-none" />
    </section>
  );
}
