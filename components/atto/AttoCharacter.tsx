"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

export type AttoState = "listening" | "thinking" | "happy" | "neutral" | "concerned";

interface AttoCharacterProps {
  state?: AttoState;
  size?: number;
  className?: string;
  color?: string;
}

const STATE_CONFIG: Record<
  AttoState,
  {
    pulseSpeed: string;
    glowOpacity: number;
    antennaColor: string;
    smileD: string;
    browD: string;
  }
> = {
  listening: {
    pulseSpeed: "2s",
    glowOpacity: 0.15,
    antennaColor: "#3ECDA0",
    smileD: "M50 61 Q55 65 60 61",
    browD: "M51 46 Q55 40 59 46",
  },
  thinking: {
    pulseSpeed: "1s",
    glowOpacity: 0.2,
    antennaColor: "#E8A020",
    smileD: "M51 62 Q55 64.5 59 62",
    browD: "M51 45 Q55 40 60 46",
  },
  happy: {
    pulseSpeed: "0.6s",
    glowOpacity: 0.25,
    antennaColor: "#E8A020",
    smileD: "M49 60 Q55 67 61 60",
    browD: "M51 44 Q55 38 59 44",
  },
  neutral: {
    pulseSpeed: "3s",
    glowOpacity: 0.12,
    antennaColor: "#3ECDA0",
    smileD: "M51 62 Q55 64 59 62",
    browD: "M51 47 Q55 42 59 47",
  },
  concerned: {
    pulseSpeed: "4s",
    glowOpacity: 0.1,
    antennaColor: "#3ECDA0",
    smileD: "M50 64 Q55 61 60 64",
    browD: "M51 44 Q55 48 59 44",
  },
};

export default function AttoCharacter({
  state = "neutral",
  size = 80,
  className,
  color = "#E8A020",
}: AttoCharacterProps) {
  const cfg = STATE_CONFIG[state];
  const rawId = useId();
  const id = `atto-${rawId.replace(/:/g, "")}`;

  return (
    <div
      className={cn("inline-flex items-center justify-center animate-atto-float", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 110 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        aria-label="Atto the firefly"
        role="img"
      >
        <defs>
          <style>{`
            @keyframes ${id}-pulse-glow {
              0%, 100% { opacity: ${cfg.glowOpacity}; }
              50% { opacity: ${cfg.glowOpacity * 0.45}; }
            }
            @keyframes ${id}-pulse-core {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
            @keyframes ${id}-wing-l {
              0%, 100% { transform: scaleX(1) rotate(-8deg); }
              50% { transform: scaleX(0.85) rotate(-12deg); }
            }
            @keyframes ${id}-wing-r {
              0%, 100% { transform: scaleX(1) rotate(8deg); }
              50% { transform: scaleX(0.85) rotate(12deg); }
            }
            @keyframes ${id}-ant-tip {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.55; }
            }
            .${id}-glow {
              animation: ${id}-pulse-glow ${cfg.pulseSpeed} ease-in-out infinite;
            }
            .${id}-core {
              animation: ${id}-pulse-core ${cfg.pulseSpeed} ease-in-out infinite;
            }
            .${id}-wing-l {
              animation: ${id}-wing-l 0.4s ease-in-out infinite;
              transform-origin: 60px 52px;
            }
            .${id}-wing-r {
              animation: ${id}-wing-r 0.4s ease-in-out infinite;
              transform-origin: 60px 52px;
            }
            .${id}-ant-tip {
              animation: ${id}-ant-tip ${cfg.pulseSpeed} ease-in-out infinite;
            }
          `}</style>
        </defs>

        {/* ── GLOW AMBIENT ── */}
        <circle
          className={`${id}-glow`}
          cx="55" cy="78" r="28"
          fill={color}
          opacity={cfg.glowOpacity}
        />
        <circle
          cx="55" cy="78" r="20"
          fill={color}
          opacity={cfg.glowOpacity * 1.6}
        />

        {/* ── WINGS ── */}
        <ellipse
          className={`${id}-wing-l`}
          cx="32" cy="62" rx="18" ry="10"
          fill="#A7F3D0" opacity="0.55"
          transform="rotate(-25 32 62)"
        />
        <ellipse
          className={`${id}-wing-r`}
          cx="78" cy="62" rx="18" ry="10"
          fill="#A7F3D0" opacity="0.55"
          transform="rotate(25 78 62)"
        />

        {/* ── BODY ── */}
        <ellipse cx="55" cy="70" rx="14" ry="18" fill="#1B2C3E" />
        <ellipse cx="55" cy="70" rx="11" ry="8" fill="#0D1B2A" />

        {/* ── ABDOMEN LIGHT ── */}
        <ellipse className={`${id}-core`} cx="55" cy="75" rx="9" ry="7" fill={color} />
        <ellipse cx="55" cy="75" rx="6" ry="4.5" fill="#FDE68A" />
        <ellipse cx="55" cy="74" rx="3" ry="2.5" fill="#FAFAF5" />

        {/* ── HEAD ── */}
        <circle cx="55" cy="57" r="16" fill="#243647" />
        <circle cx="55" cy="57" r="13" fill="#1B2C3E" />

        {/* ── EYES ── */}
        <circle cx="48" cy="54" r="5.5" fill="#FAFAF5" />
        <circle cx="62" cy="54" r="5.5" fill="#FAFAF5" />
        <circle cx="48.5" cy="54.5" r="3.5" fill="#0D1B2A" />
        <circle cx="62.5" cy="54.5" r="3.5" fill="#0D1B2A" />
        <circle cx="49.5" cy="53.5" r="1.2" fill="#FAFAF5" />
        <circle cx="63.5" cy="53.5" r="1.2" fill="#FAFAF5" />

        {/* ── SMILE ── */}
        <path
          d={cfg.smileD}
          stroke="#3ECDA0"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* ── BROW ARCH (the teal arch above both eyes) ── */}
        <path
          d={cfg.browD}
          stroke="#3ECDA0"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* ── ANTENNAE ── */}
        <line x1="48" y1="44" x2="44" y2="36" stroke={cfg.antennaColor} strokeWidth="1" strokeLinecap="round" />
        <line x1="62" y1="44" x2="66" y2="36" stroke={cfg.antennaColor} strokeWidth="1" strokeLinecap="round" />
        {/* Tip outer */}
        <circle className={`${id}-ant-tip`} cx="44" cy="34" r="3" fill={color} />
        <circle className={`${id}-ant-tip`} cx="66" cy="34" r="3" fill={color} />
        {/* Tip inner */}
        <circle cx="44" cy="34" r="1.5" fill="#FDE68A" />
        <circle cx="66" cy="34" r="1.5" fill="#FDE68A" />

        {/* ── AMBIENT FIREFLY DOTS ── */}
        <circle cx="30" cy="95" r="2" fill={color} opacity="0.3" />
        <circle cx="80" cy="92" r="1.5" fill={color} opacity="0.2" />
        <circle cx="20" cy="80" r="1" fill={color} opacity="0.25" />
        <circle cx="90" cy="85" r="1" fill={color} opacity="0.2" />

        {/* ── EXTRA SPARKLES when happy ── */}
        {state === "happy" && (
          <>
            <circle cx="15" cy="60" r="1.5" fill={color} opacity="0">
              <animate attributeName="opacity" values="0;0.6;0" dur="1.2s" repeatCount="indefinite" begin="0s" />
              <animate attributeName="cy" values="60;54;60" dur="1.2s" repeatCount="indefinite" begin="0s" />
            </circle>
            <circle cx="95" cy="65" r="1.2" fill={color} opacity="0">
              <animate attributeName="opacity" values="0;0.5;0" dur="1.5s" repeatCount="indefinite" begin="0.4s" />
              <animate attributeName="cy" values="65;59;65" dur="1.5s" repeatCount="indefinite" begin="0.4s" />
            </circle>
            <circle cx="12" cy="90" r="1" fill={color} opacity="0">
              <animate attributeName="opacity" values="0;0.4;0" dur="1.8s" repeatCount="indefinite" begin="0.8s" />
            </circle>
          </>
        )}
      </svg>
    </div>
  );
}
