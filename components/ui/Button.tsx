import { cn } from "@/lib/utils/cn";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "amber" | "teal" | "outline" | "ghost" | "navy";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "amber", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
          // Size variants
          {
            "text-sm px-4 py-2": size === "sm",
            "text-base px-6 py-3": size === "md",
            "text-lg px-8 py-4": size === "lg",
          },
          // Color variants
          {
            "bg-[#E8A020] text-[#3D1500] hover:bg-[#C17D0A] hover:text-white focus-visible:ring-[#E8A020] active:scale-95":
              variant === "amber",
            "bg-[#1D9E75] text-white hover:bg-[#1B5E4F] focus-visible:ring-[#1D9E75] active:scale-95":
              variant === "teal",
            "border-2 border-white/30 text-white hover:border-white/60 hover:bg-white/10 focus-visible:ring-white":
              variant === "outline",
            "text-[#9B9A93] hover:text-[#3D3C37] hover:bg-[#E5E3DC]/50 focus-visible:ring-[#E5E3DC]":
              variant === "ghost",
            "bg-[#1B2C3E] text-white hover:bg-[#0D1B2A] focus-visible:ring-[#1B2C3E] active:scale-95":
              variant === "navy",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
