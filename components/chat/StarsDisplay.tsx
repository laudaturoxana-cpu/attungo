"use client";

interface StarsDisplayProps {
  stars: number;
  level?: number;
  streakDays?: number;
  lang?: "ro" | "en";
}

const LEVEL_NAMES_RO = ["Explorator", "Descoperitor", "Înțelept", "Maestru", "Luminar"];
const LEVEL_NAMES_EN = ["Explorer", "Discoverer", "Sage", "Master", "Luminary"];

export default function StarsDisplay({ stars, level = 1, streakDays = 0, lang = "ro" }: StarsDisplayProps) {
  const starsPerLevel = 5;
  const filledInLevel = stars % starsPerLevel;
  const levelNames = lang === "ro" ? LEVEL_NAMES_RO : LEVEL_NAMES_EN;
  const levelName = levelNames[Math.min(level - 1, levelNames.length - 1)];

  return (
    <div className="flex flex-col items-end gap-0.5">
      {/* Level name — emotionally meaningful */}
      <span className="text-[10px] font-semibold text-[#1D9E75] tracking-wide uppercase leading-none">
        {levelName}
      </span>

      {/* 5 star progress dots toward next level */}
      <div className="flex items-center gap-0.5">
        {Array.from({ length: starsPerLevel }).map((_, i) => (
          <span
            key={i}
            className="text-[11px] leading-none"
            style={{
              opacity: i < filledInLevel ? 1 : 0.25,
              filter: i < filledInLevel ? "drop-shadow(0 0 3px rgba(232,160,32,0.8))" : "none",
              transition: "opacity 0.3s, filter 0.3s",
            }}
          >
            ⭐
          </span>
        ))}

        {/* Streak */}
        {streakDays > 0 && (
          <span className="ml-1 text-[11px] leading-none">🔥</span>
        )}
      </div>
    </div>
  );
}
