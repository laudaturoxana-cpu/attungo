import { cn } from "@/lib/utils/cn";
import { type HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "amber" | "teal" | "navy" | "gray";
}

export default function Badge({
  className,
  variant = "amber",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide",
        {
          "bg-[#FEF3C7] text-[#92520A] border border-[#E8A020]/30": variant === "amber",
          "bg-[#F0FDF8] text-[#1B5E4F] border border-[#3ECDA0]/30": variant === "teal",
          "bg-[#1B2C3E] text-white": variant === "navy",
          "bg-[#E5E3DC] text-[#3D3C37]": variant === "gray",
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
