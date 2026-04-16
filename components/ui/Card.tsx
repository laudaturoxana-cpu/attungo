import { cn } from "@/lib/utils/cn";
import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "navy" | "amber" | "teal";
  hover?: boolean;
}

export default function Card({
  className,
  variant = "default",
  hover = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-300",
        {
          "bg-white border-[#E5E3DC]": variant === "default",
          "bg-[#1B2C3E] border-white/10 text-white": variant === "navy",
          "bg-[#FEF3C7] border-[#E8A020]/30": variant === "amber",
          "bg-[#F0FDF8] border-[#3ECDA0]/30": variant === "teal",
        },
        hover && "hover:-translate-y-1 hover:shadow-lg cursor-pointer",
        hover && variant === "default" && "hover:shadow-amber-100/80 hover:border-[#E8A020]/40",
        hover && variant === "navy" && "hover:shadow-[#E8A020]/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
