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
        // Pixealogy Design System
        sun: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
          deep: "#B45309",
        },
        coral: {
          DEFAULT: "#F97066",
          light: "#FEE2E2",
        },
        terra: "#C2410C",
        mint: {
          DEFAULT: "#34D399",
          light: "#D1FAE5",
          deep: "#059669",
        },
        ocean: {
          DEFAULT: "#0EA5E9",
          light: "#E0F2FE",
        },
        violet: {
          DEFAULT: "#8B5CF6",
          light: "#EDE9FE",
        },
        ink: {
          1: "#1C1917",
          2: "#44403C",
          3: "#78716C",
          4: "#A8A29E",
        },
        cream: "#FFFBF5",
        sand: "#F5F0EB",
        border: "#E7E0D8",
      },
      fontFamily: {
        sora: ["var(--font-sora)", "sans-serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
      borderRadius: {
        DEFAULT: "12px",
        sm: "8px",
        xs: "6px",
      },
    },
  },
  plugins: [],
};
export default config;
