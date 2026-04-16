"use client";

interface StarsDisplayProps {
  stars: number;
  level?: number;
  streakDays?: number;
  lang?: "ro" | "en";
}

export default function StarsDisplay({ stars, level = 1, streakDays = 0, lang = "ro" }: StarsDisplayProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Stars */}
      <div className="flex items-center gap-1 bg-[#FEF3C7] border border-[#E8A020]/30 rounded-full px-2.5 py-1">
        <span className="text-[#E8A020] text-sm">★</span>
        <span className="text-[#92520A] text-xs font-bold">{stars}</span>
      </div>

      {/* Level */}
      <div className="hidden sm:flex items-center gap-1 bg-[#F0FDF8] border border-[#3ECDA0]/30 rounded-full px-2.5 py-1">
        <span className="text-[#1D9E75] text-xs font-bold">
          {lang === "ro" ? "Niv." : "Lv."} {level}
        </span>
      </div>

      {/* Streak */}
      {streakDays > 0 && (
        <div className="hidden sm:flex items-center gap-1 bg-[#FEF3C7] border border-[#E8A020]/20 rounded-full px-2.5 py-1">
          <span className="text-xs">🔥</span>
          <span className="text-[#92520A] text-xs font-bold">{streakDays}</span>
        </div>
      )}
    </div>
  );
}
