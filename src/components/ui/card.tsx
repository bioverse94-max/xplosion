import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  glow?: "none" | "red" | "subtle";
  hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass = true, glow = "none", hoverEffect = false, children, ...props }, ref) => {
    const glowStyles = {
      none: "",
      red: "hover:shadow-[0_0_35px_-5px_rgba(255,0,0,0.35)] hover:border-[#FF0000]/50",
      subtle: "hover:shadow-[0_0_20px_-3px_rgba(255,0,0,0.2)] hover:border-[#333333]",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border border-[#1E1E1E] text-[#F5F5F5]",
          glass ? "bg-[#080808]/90 backdrop-blur-xl" : "bg-[#080808]",
          hoverEffect && "transition-all duration-300 hover:-translate-y-1",
          glowStyles[glow],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn("p-6 pb-3 space-y-1.5", className)} {...props} />;

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h3
    className={cn("text-xl font-bold tracking-tight text-white font-display uppercase", className)}
    {...props}
  />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => <p className={cn("text-sm text-[#A0A0A0] leading-relaxed", className)} {...props} />;

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn("p-6 pt-3", className)} {...props} />;

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn("p-6 pt-0 flex items-center justify-between border-t border-[#1F1F1F] mt-4", className)}
    {...props}
  />
);
