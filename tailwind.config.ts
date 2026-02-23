import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // nortoo Design System — cool fintech palette
        midnight: "#0B0F1A",
        slate: "#1E293B",
        graphite: "#334155",
        fog: "#64748B",
        mist: "#94A3B8",
        cloud: "#CBD5E1",
        silk: "#E2E8F0",
        snow: "#F8FAFC",
        mint: {
          DEFAULT: "#00E5A0",
          dark: "#00C78A",
          deep: "#00A674",
          bg: "rgba(0, 229, 160, 0.04)",
          soft: "rgba(0, 229, 160, 0.20)",
        },
        amber: {
          DEFAULT: "#F59E0B",
          bg: "rgba(245, 158, 11, 0.08)",
          soft: "rgba(245, 158, 11, 0.25)",
        },
        rose: {
          DEFAULT: "#F43F5E",
          bg: "rgba(244, 63, 94, 0.08)",
          soft: "rgba(244, 63, 94, 0.20)",
        },
        violet: {
          DEFAULT: "#8B5CF6",
          bg: "rgba(139, 92, 246, 0.08)",
          soft: "rgba(139, 92, 246, 0.20)",
        },
        ocean: {
          DEFAULT: "#3B82F6",
          bg: "rgba(59, 130, 246, 0.08)",
          soft: "rgba(59, 130, 246, 0.20)",
        },
        lime: {
          DEFAULT: "#C8FF00",
          dark: "#B0E000",
          deep: "#98C200",
          bg: "rgba(200, 255, 0, 0.06)",
          soft: "rgba(200, 255, 0, 0.20)",
        },
      },
      fontFamily: {
        display: ["var(--f-display)", "sans-serif"],
        body: ["var(--f-body)", "sans-serif"],
        mono: ["var(--f-mono)", "monospace"],
      },
      borderRadius: {
        DEFAULT: "16px",
        sm: "10px",
        xs: "6px",
        lg: "20px",
        xl: "24px",
        pill: "100px",
      },
    },
  },
  plugins: [],
};
export default config;
