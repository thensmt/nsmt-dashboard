import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: "var(--blue)",
        surface: "var(--surface)",
        ink: {
          90: "var(--ink-90)",
          60: "var(--ink-60)",
          40: "var(--ink-40)",
          20: "var(--ink-20)",
          10: "var(--ink-10)",
        },
      },
      fontFamily: {
        sans: ['"Rubik"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
