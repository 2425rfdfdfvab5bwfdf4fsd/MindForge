import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      maxWidth: {
        "8xl": "90rem",
        "9xl": "100rem",
      },
      colors: {
        forge: {
          base: "#0A0908",
          subtle: "#111110",
          elevated: "#1A1918",
          overlay: "#232220",
          input: "#161514",
          border: "#2A2927",
          "border-strong": "#3D3B39",
          orange: "#FF6B2B",
          "orange-hover": "#FF5214",
          "orange-text": "#FFBDA3",
          "orange-glow": "rgba(255,107,43,0.20)",
          blue: "#3B82F6",
          "blue-hover": "#2563EB",
          "blue-text": "#93C5FD",
        },
        text: {
          primary: "#EDEDEF",
          secondary: "#C2C0BE",
          muted: "#87857F",
          disabled: "#4A4845",
        },
      },
      borderRadius: {
        DEFAULT: "0px",
        sm: "2px",
        md: "4px",
        full: "9999px",
      },
      fontFamily: {
        heading: ["Geist", "Cal Sans", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
      },
      fontSize: {
        display: ["3.052rem", { lineHeight: "1.05", fontWeight: "800" }],
        "4xl": ["2.441rem", { lineHeight: "1.08", fontWeight: "700" }],
        "3xl": ["1.953rem", { lineHeight: "1.15", fontWeight: "700" }],
        "2xl": ["1.563rem", { lineHeight: "1.20", fontWeight: "600" }],
        xl: ["1.25rem", { lineHeight: "1.30", fontWeight: "600" }],
        base: ["1rem", { lineHeight: "1.65", fontWeight: "400" }],
        sm: ["0.875rem", { lineHeight: "1.55", fontWeight: "400" }],
        xs: ["0.75rem", { lineHeight: "1.40", fontWeight: "400" }],
      },
    },
  },
  plugins: [],
};

export default config;
