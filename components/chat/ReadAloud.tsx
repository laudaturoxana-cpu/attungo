"use client";

import { useState, useEffect, useRef } from "react";

interface ReadAloudProps {
  text: string;
  lang?: "ro" | "en";
}

export default function ReadAloud({ text, lang = "ro" }: ReadAloudProps) {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop speaking when component unmounts (e.g. navigating away)
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  function getBestVoice(langCode: string): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    // Prefer exact match (e.g. "ro-RO"), then prefix match (e.g. "ro")
    return (
      voices.find((v) => v.lang === langCode) ??
      voices.find((v) => v.lang.startsWith(langCode.split("-")[0])) ??
      null
    );
  }

  function handleClick() {
    if (!window.speechSynthesis) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const langCode = lang === "ro" ? "ro-RO" : "en-US";

    // voices may not be loaded yet — retry once after a tick
    function speak() {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.rate = 0.92;   // slightly slower — easier for kids
      utterance.pitch = 1.05;  // slightly warm/friendly

      const voice = getBestVoice(langCode);
      if (voice) utterance.voice = voice;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }

    // Voices may not be ready yet on first load
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => { speak(); };
    } else {
      speak();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={speaking
        ? (lang === "ro" ? "Oprește cititul" : "Stop reading")
        : (lang === "ro" ? "Ascultă mesajul" : "Read aloud")}
      title={speaking
        ? (lang === "ro" ? "Oprește" : "Stop")
        : (lang === "ro" ? "Ascultă" : "Listen")}
      className={`mt-2 flex items-center gap-1 text-xs rounded-full px-2 py-1 transition-all select-none ${
        speaking
          ? "bg-[#3ECDA0]/20 text-[#1D9E75] border border-[#3ECDA0]/40"
          : "text-[#9B9A93] hover:text-[#1D9E75] hover:bg-[#F0FDF8]"
      }`}
    >
      {speaking ? (
        // Animated sound wave (3 bars)
        <span className="flex items-end gap-[2px] h-3">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-[#1D9E75]"
              style={{
                height: i === 1 ? "12px" : "8px",
                animation: `typing-dot 1s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </span>
      ) : (
        // Speaker icon
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path
            d="M2 4.5H4.5L7.5 2v9l-3-2.5H2V4.5z"
            fill="currentColor"
            opacity="0.8"
          />
          <path
            d="M9.5 4.5a2.5 2.5 0 010 4"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      )}
      <span>{speaking
        ? (lang === "ro" ? "oprește" : "stop")
        : (lang === "ro" ? "ascultă" : "listen")
      }</span>
    </button>
  );
}
