"use client";

import { useEffect, useRef } from "react";

interface Firefly {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
}

interface AttoFirefliesProps {
  count?: number;
  className?: string;
}

export default function AttoFireflies({ count = 8, className = "" }: AttoFirefliesProps) {
  const fireflies: Firefly[] = Array.from({ length: count }, (_, i) => ({
    x: 5 + Math.random() * 90,
    y: 10 + Math.random() * 80,
    size: 2 + Math.random() * 3,
    delay: i * 0.7 + Math.random() * 2,
    duration: 3 + Math.random() * 3,
    driftX: (Math.random() - 0.5) * 60,
  }));

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {fireflies.map((ff, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${ff.x}%`,
            top: `${ff.y}%`,
            width: ff.size,
            height: ff.size,
            background: "#E8A020",
            boxShadow: `0 0 ${ff.size * 3}px #E8A020, 0 0 ${ff.size * 6}px rgba(232,160,32,0.4)`,
            animation: `firefly-float ${ff.duration}s ease-in-out ${ff.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
