"use client";

import { useEffect, useState } from "react";

interface SprintTimerProps {
  durationMinutes: number;
  onSprintComplete?: () => void;
  lang?: "ro" | "en";
}

export default function SprintTimer({ durationMinutes, onSprintComplete, lang = "ro" }: SprintTimerProps) {
  const totalSeconds = durationMinutes * 60;
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (completed) return;
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= totalSeconds) {
          setCompleted(true);
          onSprintComplete?.();
          clearInterval(interval);
          return totalSeconds;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [totalSeconds, onSprintComplete, completed]);

  const progress = elapsed / totalSeconds;
  const remaining = totalSeconds - elapsed;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FAFAF5] border-b border-[#E5E3DC]">
      {/* Progress bar */}
      <div className="flex-1 h-1.5 bg-[#E5E3DC] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#E8A020] rounded-full transition-all duration-1000"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </div>

      {/* Time remaining */}
      <span className="text-xs font-mono text-[#9B9A93] flex-shrink-0">
        {completed
          ? lang === "ro" ? "Pauză! 🎉" : "Break! 🎉"
          : `${mins}:${secs.toString().padStart(2, "0")}`}
      </span>
    </div>
  );
}
