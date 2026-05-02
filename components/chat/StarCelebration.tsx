"use client";

import { useEffect } from "react";

function playSuccessSound() {
  try {
    const Ctx = window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.11;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.55);
    });
  } catch {
    // Audio blocked or not supported — silent fail
  }
}

// 35 stars spread across the full width, staggered so they fall like rain
const STARS = Array.from({ length: 35 }, (_, i) => ({
  id: i,
  left: 1 + (i * 2.8) % 98,
  delay: (i * 0.09) % 1.6,
  size: 18 + (i * 7) % 26,
  emoji: i % 5 === 0 ? "🌟" : "⭐",
}));

interface Props {
  show: boolean;
  celebrationKey: number;
  lang?: "ro" | "en";
}

export default function StarCelebration({ show, celebrationKey, lang = "ro" }: Props) {
  useEffect(() => {
    if (show) playSuccessSound();
  }, [show, celebrationKey]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Rain of stars falling from top */}
      {STARS.map((s) => (
        <span
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.left}%`,
            top: "0",
            fontSize: `${s.size}px`,
            animation: `star-rain 3.5s ease-in ${s.delay}s forwards`,
            willChange: "transform, opacity",
            lineHeight: 1,
          }}
        >
          {s.emoji}
        </span>
      ))}

      {/* Central "Bravo!" — fades in then out */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3"
        style={{ animation: "celebrate-fade 3.5s ease forwards" }}
      >
        <span
          style={{
            fontSize: 88,
            display: "block",
            animation: "celebrate-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          }}
        >
          ⭐
        </span>
        <p
          className="font-black text-4xl tracking-wide"
          style={{
            color: "#E8A020",
            textShadow: "0 0 30px rgba(232,160,32,0.9), 0 0 60px rgba(232,160,32,0.5), 0 2px 0 rgba(0,0,0,0.2)",
          }}
        >
          {lang === "ro" ? "Bravo! 🎉" : "Great job! 🎉"}
        </p>
      </div>
    </div>
  );
}
