"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

export type AttoState = "listening" | "thinking" | "happy" | "neutral" | "concerned";

interface AttoCharacterProps {
  state?: AttoState;
  size?: number;
  className?: string;
  color?: string; // custom amber color (default: #E8A020)
}

const STATE_CONFIG: Record<
  AttoState,
  { glowOpacity: number; glowScale: number; pulseSpeed: string; antennaGlow: boolean; smileD: string }
> = {
  listening: {
    glowOpacity: 0.5,
    glowScale: 1,
    pulseSpeed: "2s",
    antennaGlow: false,
    smileD: "M 8 14 Q 13 17 18 14",
  },
  thinking: {
    glowOpacity: 0.7,
    glowScale: 1.05,
    pulseSpeed: "1s",
    antennaGlow: true,
    smileD: "M 8 15 Q 13 16 18 15",
  },
  happy: {
    glowOpacity: 1,
    glowScale: 1.15,
    pulseSpeed: "0.5s",
    antennaGlow: true,
    smileD: "M 7 13 Q 13 19 19 13",
  },
  neutral: {
    glowOpacity: 0.4,
    glowScale: 1,
    pulseSpeed: "3s",
    antennaGlow: false,
    smileD: "M 8 15 Q 13 17 18 15",
  },
  concerned: {
    glowOpacity: 0.25,
    glowScale: 0.95,
    pulseSpeed: "3s",
    antennaGlow: false,
    smileD: "M 8 16 Q 13 14 18 16",
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
  const svgId = `atto-${rawId.replace(/:/g, "")}`;

  return (
    <div
      className={cn("inline-flex items-center justify-center animate-atto-float", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 52 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        aria-label="Atto the firefly"
        role="img"
      >
        <defs>
          {/* Glow filter */}
          <filter id={`${svgId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Amber radial for abdomen */}
          <radialGradient id={`${svgId}-abdomen`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="60%" stopColor={color} />
            <stop offset="100%" stopColor="#C17D0A" />
          </radialGradient>

          {/* Wing gradient */}
          <linearGradient id={`${svgId}-wing`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3ECDA0" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1D9E75" stopOpacity="0.2" />
          </linearGradient>

          {/* Keyframe styles scoped per instance */}
          <style>{`
            @keyframes ${svgId}-pulse {
              0%, 100% { opacity: ${cfg.glowOpacity}; transform: scale(1); }
              50% { opacity: ${Math.min(cfg.glowOpacity + 0.2, 1)}; transform: scale(${cfg.glowScale}); }
            }
            @keyframes ${svgId}-wl {
              0%, 100% { transform: rotate(-25deg) scaleX(1); }
              50% { transform: rotate(-30deg) scaleX(0.88); }
            }
            @keyframes ${svgId}-wr {
              0%, 100% { transform: rotate(25deg) scaleX(1); }
              50% { transform: rotate(30deg) scaleX(0.88); }
            }
            @keyframes ${svgId}-ant {
              0%, 100% { fill: ${color}; }
              50% { fill: #FDE68A; filter: drop-shadow(0 0 3px ${color}); }
            }
            .${svgId}-abdomen {
              animation: ${svgId}-pulse ${cfg.pulseSpeed} ease-in-out infinite;
              transform-origin: 26px 40px;
            }
            .${svgId}-wing-l {
              animation: ${svgId}-wl 1.8s ease-in-out infinite;
              transform-origin: 18px 30px;
            }
            .${svgId}-wing-r {
              animation: ${svgId}-wr 1.8s ease-in-out infinite;
              transform-origin: 34px 30px;
            }
            .${svgId}-antenna {
              animation: ${cfg.antennaGlow ? `${svgId}-ant 1s ease-in-out infinite` : "none"};
            }
          `}</style>
        </defs>

        {/* === AMBIENT GLOW (behind everything) === */}
        <ellipse
          cx="26"
          cy="40"
          rx="14"
          ry="10"
          fill={color}
          opacity={cfg.glowOpacity * 0.15}
          className={`${svgId}-abdomen`}
        />

        {/* === WINGS === */}
        <ellipse
          cx="14"
          cy="30"
          rx="9"
          ry="5"
          fill={`url(#${svgId}-wing)`}
          transform="rotate(-25, 14, 30)"
          className={`${svgId}-wing-l`}
        />
        <ellipse
          cx="38"
          cy="30"
          rx="9"
          ry="5"
          fill={`url(#${svgId}-wing)`}
          transform="rotate(25, 38, 30)"
          className={`${svgId}-wing-r`}
        />

        {/* === BODY (torso) === */}
        <ellipse cx="26" cy="35" rx="8" ry="10" fill="#1B2C3E" />

        {/* === ABDOMEN LIGHT === */}
        <ellipse
          cx="26"
          cy="40"
          rx="7"
          ry="5"
          fill={`url(#${svgId}-abdomen)`}
          filter={`url(#${svgId}-glow)`}
          className={`${svgId}-abdomen`}
        />
        {/* Inner core light */}
        <ellipse cx="26" cy="40" rx="3.5" ry="2.5" fill="#FDE68A" opacity="0.9" />

        {/* === HEAD === */}
        <circle cx="26" cy="20" r="13" fill="#1B2C3E" />

        {/* === EYES === */}
        {/* Left eye */}
        <circle cx="21" cy="19" r="4" fill="white" />
        <circle cx="22" cy="19.5" r="2" fill="#0D1B2A" />
        <circle cx="22.8" cy="18.5" r="0.7" fill="white" opacity="0.8" />

        {/* Right eye */}
        <circle cx="31" cy="19" r="4" fill="white" />
        <circle cx="30" cy="19.5" r="2" fill="#0D1B2A" />
        <circle cx="30.8" cy="18.5" r="0.7" fill="white" opacity="0.8" />

        {/* === SMILE (varies by state) === */}
        <path
          d={cfg.smileD}
          stroke="#3ECDA0"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* === ANTENNAE === */}
        <line x1="22" y1="8" x2="19" y2="3" stroke="#1B2C3E" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="30" y1="8" x2="33" y2="3" stroke="#1B2C3E" strokeWidth="1.2" strokeLinecap="round" />

        {/* Antenna tips */}
        <circle cx="19" cy="3" r="1.8" fill={color} className={`${svgId}-antenna`} />
        <circle cx="33" cy="3" r="1.8" fill={color} className={`${svgId}-antenna`} />

        {/* === MICRO FIREFLIES (when happy) === */}
        {state === "happy" && (
          <>
            <circle cx="6" cy="15" r="1.2" fill={color} opacity="0.7">
              <animate attributeName="opacity" values="0;0.7;0" dur="1.2s" repeatCount="indefinite" begin="0s" />
              <animate attributeName="cy" values="15;10;15" dur="1.2s" repeatCount="indefinite" begin="0s" />
            </circle>
            <circle cx="46" cy="18" r="1" fill={color} opacity="0.5">
              <animate attributeName="opacity" values="0;0.5;0" dur="1.5s" repeatCount="indefinite" begin="0.4s" />
              <animate attributeName="cy" values="18;12;18" dur="1.5s" repeatCount="indefinite" begin="0.4s" />
            </circle>
            <circle cx="8" cy="40" r="1.2" fill={color} opacity="0.6">
              <animate attributeName="opacity" values="0;0.6;0" dur="1.8s" repeatCount="indefinite" begin="0.8s" />
            </circle>
            <circle cx="44" cy="45" r="0.9" fill={color} opacity="0.5">
              <animate attributeName="opacity" values="0;0.5;0" dur="1.3s" repeatCount="indefinite" begin="0.2s" />
            </circle>
          </>
        )}
      </svg>
    </div>
  );
}
