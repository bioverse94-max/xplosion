import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "neon";
  size?: "sm" | "md" | "lg" | "xl" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold tracking-wide uppercase transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none rounded-xl active:scale-[0.98]";

    const variantStyles = {
      primary:
        "bg-[#FF0000] text-black hover:bg-[#E60000] focus:ring-[#FF0000] shadow-[0_0_25px_rgba(255,0,0,0.45)] hover:shadow-[0_0_35px_rgba(255,0,0,0.65)]",
      secondary:
        "bg-[#141414] text-white border border-[#2A2A2A] hover:border-[#FF0000] hover:text-[#FF0000] focus:ring-white",
      neon:
        "bg-[#FF0000] text-black font-extrabold tracking-wider hover:bg-[#E60000] shadow-[0_0_35px_rgba(255,0,0,0.55)] hover:shadow-[0_0_50px_rgba(255,0,0,0.8)] focus:ring-[#FF0000]",
      outline:
        "border border-[#2E2E2E] bg-[#080808]/80 text-[#F5F5F5] hover:border-[#FF0000] hover:text-[#FF0000] hover:bg-[#0D0D0D] hover:shadow-[0_0_20px_rgba(255,0,0,0.25)] focus:ring-[#FF0000]",
      ghost:
        "bg-transparent text-[#A0A0A0] hover:text-white hover:bg-[#141414] focus:ring-slate-400",
      danger:
        "bg-[#8B0000] text-white font-medium hover:bg-[#A50000] focus:ring-[#8B0000] shadow-[0_0_20px_rgba(139,0,0,0.4)]",
    };

    const sizeStyles = {
      sm: "text-xs px-3.5 py-2 gap-1.5",
      md: "text-xs px-4 py-2.5 gap-2",
      lg: "text-sm px-6 py-3.5 gap-2.5",
      xl: "text-base px-8 py-4 gap-3 font-extrabold font-display tracking-wider",
      icon: "p-2.5 h-10 w-10 justify-center",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
