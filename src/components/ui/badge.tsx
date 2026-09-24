import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "outline"
    | "paid"
    | "pending"
    | "checked_in"
    | "valid"
    | "invalid"
    | "sold_out";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}) => {
  const variantStyles = {
    default: "bg-[#141414] text-[#A0A0A0] border border-[#2A2A2A]",
    primary: "bg-[#FF0000]/15 text-[#FF0000] border border-[#FF0000]/40 shadow-[0_0_12px_rgba(255,0,0,0.25)] font-bold tracking-wider uppercase",
    secondary: "bg-[#141414] text-white border border-[#2E2E2E]",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
    danger: "bg-[#FF0000]/20 text-[#FF0000] border border-[#FF0000]/50",
    outline: "border border-[#2A2A2A] text-[#A0A0A0]",
    paid: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(0,223,143,0.2)] font-mono",
    pending: "bg-amber-500/15 text-amber-300 border border-amber-500/40 font-mono",
    valid: "bg-[#0D0D0D] text-[#00DF8F] border border-[#00DF8F]/50 font-bold tracking-widest uppercase",
    checked_in: "bg-[#1A1A1A] text-white border border-[#444444] font-semibold tracking-wider uppercase",
    invalid: "bg-[#FF0000]/20 text-[#FF0000] border border-[#FF0000]/50",
    sold_out: "bg-[#111111] text-[#6F6F6F] border border-[#2A2A2A] line-through opacity-75 font-mono",
  };

  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 tracking-wider uppercase font-semibold rounded-md",
    md: "text-xs px-2.5 py-1 tracking-wide font-medium rounded-lg",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 transition-colors select-none font-mono",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
