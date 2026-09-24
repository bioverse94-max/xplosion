import React from "react";

/**
 * Atmospheric background lighting with subtle red radial gradients, smoke, and stage light cones.
 */
export const Atmosphere: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Layer 1: Pure Black Base */}
      <div className="absolute inset-0 bg-[#030303] pointer-events-none -z-30" />

      {/* Layer 2: Subtle Red Ambient Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(255,0,0,0.18)_0%,transparent_70%)] pointer-events-none -z-20 blur-[90px]" />
      <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(196,0,0,0.12)_0%,transparent_65%)] pointer-events-none -z-20 blur-[100px]" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(139,0,0,0.12)_0%,transparent_70%)] pointer-events-none -z-20 blur-[110px]" />

      {/* Layer 3: Noise Texture */}
      <NoiseOverlay opacity={0.035} />

      {children}
    </div>
  );
};

/**
 * Noise / Film Grain texture overlay
 */
export const NoiseOverlay: React.FC<{ opacity?: number }> = ({ opacity = 0.04 }) => {
  return (
    <div
      className="absolute inset-0 pointer-events-none -z-10"
      style={{
        opacity,
        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
        backgroundSize: "20px 20px",
      }}
    />
  );
};

/**
 * Reusable red spotlight / stage light beam
 */
export const StageLight: React.FC<{
  position?: "center" | "left" | "right" | "top";
  intensity?: "low" | "medium" | "high";
}> = ({ position = "center", intensity = "medium" }) => {
  const intensityMap = {
    low: "rgba(255, 0, 0, 0.12)",
    medium: "rgba(255, 0, 0, 0.22)",
    high: "rgba(255, 0, 0, 0.35)",
  };

  const posClass =
    position === "left"
      ? "left-0 -top-20"
      : position === "right"
      ? "right-0 -top-20"
      : position === "top"
      ? "left-1/2 -translate-x-1/2 -top-32"
      : "left-1/2 -translate-x-1/2 top-1/4 -translate-y-1/2";

  return (
    <div
      className={`absolute ${posClass} w-[600px] sm:w-[850px] h-[450px] rounded-full blur-[120px] pointer-events-none -z-10`}
      style={{
        background: `radial-gradient(ellipse at center, ${intensityMap[intensity]} 0%, transparent 70%)`,
      }}
    />
  );
};

/**
 * Reusable dynamic red glow wrapper for buttons, badges, and focal elements
 */
export const RedGlow: React.FC<{
  children: React.ReactNode;
  strength?: "subtle" | "medium" | "strong";
  className?: string;
}> = ({ children, strength = "medium", className = "" }) => {
  const shadowClass =
    strength === "subtle"
      ? "shadow-[0_0_20px_-3px_rgba(255,0,0,0.25)]"
      : strength === "strong"
      ? "shadow-[0_0_45px_-2px_rgba(255,0,0,0.6)]"
      : "shadow-[0_0_30px_-3px_rgba(255,0,0,0.4)]";

  return <div className={`${shadowClass} ${className}`}>{children}</div>;
};

/**
 * Hand-drawn brush stroke line graphic (SVG vector, scalable, pure red/white)
 */
export const BrushStroke: React.FC<{
  color?: string;
  className?: string;
  width?: number | string;
}> = ({ color = "#FF0000", className = "", width = "100%" }) => {
  return (
    <div className={`overflow-hidden pointer-events-none ${className}`} style={{ width }}>
      <svg
        viewBox="0 0 500 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        preserveAspectRatio="none"
      >
        <path
          d="M2.5 14.5C85.2 7.8 190.4 4.2 278.5 6.5C366.6 8.8 451.8 13.2 497.5 15.5C465.2 18.2 380.4 19.8 285.5 18.2C190.6 16.6 85.5 11.8 2.5 14.5Z"
          fill={color}
          fillOpacity="0.9"
        />
        <path
          d="M15 17.5C110 11 245 9.5 380 12.5C425 13.5 470 15 490 17"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />
      </svg>
    </div>
  );
};

/**
 * Slanted dynamic red slash accent
 */
export const RedSlash: React.FC<{ className?: string; angle?: "forward" | "backward" }> = ({
  className = "",
  angle = "forward",
}) => {
  const transform = angle === "forward" ? "-skew-x-12" : "skew-x-12";
  return (
    <span
      className={`inline-block w-2.5 h-6 bg-[#FF0000] ${transform} shadow-[0_0_12px_rgba(255,0,0,0.6)] ${className}`}
      aria-hidden="true"
    />
  );
};

/**
 * Technical editorial section marker (e.g., // 01 — TICKETING DOSSIER)
 */
export const SectionMarker: React.FC<{
  number: string;
  title: string;
  badge?: string;
  className?: string;
}> = ({ number, title, badge, className = "" }) => {
  return (
    <div className={`flex items-center gap-3 mb-4 select-none ${className}`}>
      <div className="flex items-center gap-1.5 font-mono text-xs font-black tracking-widest text-[#FF0000]">
        <span>{"//"}</span>
        <span className="bg-[#FF0000]/10 border border-[#FF0000]/30 px-2 py-0.5 rounded text-[11px] font-bold">
          {number}
        </span>
      </div>
      <div className="h-px w-6 bg-[#FF0000]/50" />
      <span className="text-xs uppercase font-extrabold tracking-widest text-[#E5E5E5] font-display">
        {title}
      </span>
      {badge && (
        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-[#FF0000] text-black">
          {badge}
        </span>
      )}
    </div>
  );
};

/**
 * Hand-drawn horizontal distressed divider
 */
export const HandDrawnLine: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`relative h-2 w-full my-6 pointer-events-none opacity-40 ${className}`}>
      <svg
        viewBox="0 0 1000 6"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1="3"
          x2="1000"
          y2="3"
          stroke="#FF0000"
          strokeWidth="1.5"
          strokeDasharray="8 4 18 6 3 3 12 5"
        />
      </svg>
    </div>
  );
};

/**
 * Grunge / Industrial Card Frame with corner cuts and red border accent
 */
export const DistressedBorder: React.FC<{
  children: React.ReactNode;
  active?: boolean;
  className?: string;
  onClick?: () => void;
}> = ({ children, active = false, className = "", onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl transition-all duration-200 border ${
        active
          ? "border-[#FF0000] bg-[#0D0D0D] shadow-[0_0_25px_-3px_rgba(255,0,0,0.45)] ring-1 ring-[#FF0000]"
          : "border-[#1F1F1F] bg-[#080808]/90 hover:border-[#FF0000]/40 hover:bg-[#0D0D0D]"
      } ${className}`}
    >
      {/* Top red accent marker */}
      <div
        className={`absolute top-0 left-6 h-[2px] transition-all duration-300 ${
          active ? "w-20 bg-[#FF0000]" : "w-8 bg-[#333333] group-hover:bg-[#FF0000]"
        }`}
      />
      {children}
    </div>
  );
};

/**
 * Aggressive Display Title component with Level 1 typography & red accents
 */
export const GrungeText: React.FC<{
  primary: string;
  accent?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg" | "massive";
  className?: string;
}> = ({ primary, accent, subtitle, size = "lg", className = "" }) => {
  const sizeClasses = {
    sm: "text-2xl sm:text-4xl",
    md: "text-3xl sm:text-5xl lg:text-6xl",
    lg: "text-4xl sm:text-6xl lg:text-7xl",
    massive: "text-6xl sm:text-8xl lg:text-9xl",
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <h2
        className={`${sizeClasses[size]} font-black font-display tracking-tight text-white uppercase leading-[0.95]`}
      >
        <span>{primary}</span>
        {accent && <span className="text-[#FF0000] ml-3 glow-red">{accent}</span>}
      </h2>
      {subtitle && (
        <p className="text-xs sm:text-sm font-semibold tracking-wider text-[#A0A0A0] uppercase font-sans">
          {subtitle}
        </p>
      )}
    </div>
  );
};
