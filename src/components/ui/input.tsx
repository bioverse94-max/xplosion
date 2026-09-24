import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, type = "text", ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold tracking-wider text-[#E5E5E5] uppercase">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[#A0A0A0]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={type}
            className={cn(
              "w-full rounded-xl bg-[#080808] border border-[#222222] px-4 py-3 text-sm text-[#F5F5F5] placeholder:text-[#6F6F6F] transition-all duration-200 focus:outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] focus:shadow-[0_0_15px_rgba(255,0,0,0.25)] disabled:opacity-50 disabled:cursor-not-allowed",
              leftIcon && "pl-11",
              rightIcon && "pr-11",
              error && "border-[#FF0000] focus:border-[#FF0000] focus:ring-[#FF0000]",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center text-[#A0A0A0]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-[#FF0000] font-medium mt-1">{error}</p>}
        {!error && helperText && <p className="text-xs text-[#A0A0A0] mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
