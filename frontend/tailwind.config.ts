import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#030303",
        surface: {
          DEFAULT: "#080808",
          hover: "#141414",
          elevated: "#0D0D0D",
          border: "#1F1F1F",
          glass: "rgba(8, 8, 8, 0.88)",
        },
        primary: {
          DEFAULT: "#FF0000",
          hover: "#E60000",
          dark: "#C40000",
          deep: "#8B0000",
          glow: "rgba(255, 0, 0, 0.5)",
        },
        brand: {
          black: "#030303",
          blackDeep: "#050505",
          dark: "#080808",
          card: "#0D0D0D",
          red: "#FF0000",
          redCrimson: "#E60000",
          redDark: "#C40000",
          redDeep: "#8B0000",
          white: "#FFFFFF",
          offwhite: "#F5F5F5",
          lightGray: "#E5E5E5",
          muted: "#A0A0A0",
          subtle: "#6F6F6F",
          border: "#2A2A2A",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "Bebas Neue", "sans-serif"],
        heading: ["var(--font-heading)", "Oswald", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        "red-glow": "0 0 25px -2px rgba(255, 0, 0, 0.45)",
        "red-glow-lg": "0 0 50px -5px rgba(255, 0, 0, 0.65)",
        "red-glow-subtle": "0 0 15px -3px rgba(255, 0, 0, 0.25)",
        "red-edge": "inset 0 0 0 1px rgba(255, 0, 0, 0.6), 0 0 25px -4px rgba(255, 0, 0, 0.35)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.6)",
      },
      backgroundImage: {
        "stage-light": "radial-gradient(ellipse at top, rgba(255, 0, 0, 0.22) 0%, transparent 70%)",
        "red-radial": "radial-gradient(circle at 50% 30%, rgba(255, 0, 0, 0.18) 0%, transparent 60%)",
        "red-radial-bottom": "radial-gradient(circle at 50% 90%, rgba(255, 0, 0, 0.15) 0%, transparent 60%)",
        "grunge-grid": "linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "red-flash": "redFlash 1.5s ease-out",
        "scan-line": "scanline 8s linear infinite",
      },
      keyframes: {
        redFlash: {
          "0%": { opacity: "0.8" },
          "100%": { opacity: "0" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
