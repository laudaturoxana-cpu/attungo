"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface AccordionItem {
  q: string;
  a: string;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

export default function Accordion({ items, className }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, i) => (
        <div
          key={i}
          className="border border-[#E5E3DC] rounded-xl overflow-hidden bg-white"
        >
          <button
            className="w-full flex items-center justify-between px-6 py-5 text-left font-semibold text-[#3D3C37] hover:bg-[#FAFAF5] transition-colors"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
          >
            <span>{item.q}</span>
            <span
              className={cn(
                "ml-4 flex-shrink-0 w-6 h-6 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#E8A020] transition-transform duration-200",
                openIndex === i && "rotate-45"
              )}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
          </button>
          <div
            className={cn(
              "overflow-hidden transition-all duration-300",
              openIndex === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <p className="px-6 pb-5 text-[#9B9A93] leading-relaxed">{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
