import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Colors (CSS variable–driven for theming) ──
      colors: {
        background: "var(--color-bg)",
        "background-2": "var(--color-bg-2)",
        card: "var(--color-card)",
        border: "var(--color-border)",
        foreground: "var(--color-text)",
        muted: "var(--color-muted)",
        accent: {
          DEFAULT: "var(--color-accent)",
          secondary: "var(--color-accent-2)",
        },
        teal: "var(--color-teal)",
        gold: "var(--color-gold)",
        rose: "var(--color-rose)",
        success: "var(--color-success)",
      },

      // ── Typography ──
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },

      fontSize: {
        "display-xl": ["4rem", { lineHeight: "1.1", fontWeight: "700" }],
        "display-lg": ["3rem", { lineHeight: "1.15", fontWeight: "700" }],
        "display-md": ["2.25rem", { lineHeight: "1.2", fontWeight: "600" }],
        "display-sm": ["1.875rem", { lineHeight: "1.25", fontWeight: "600" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
        caption: ["0.75rem", { lineHeight: "1.4", fontWeight: "400" }],
      },

      // ── Spacing (4px base already in Tailwind) ──
      spacing: {
        "4.5": "1.125rem",
        "13": "3.25rem",
        "15": "3.75rem",
        "18": "4.5rem",
        "88": "22rem",
        "100": "25rem",
        "120": "30rem",
      },

      // ── Border Radius ──
      borderRadius: {
        card: "16px",
        input: "10px",
        pill: "50px",
      },

      // ── Shadows (accent-colored glows) ──
      boxShadow: {
        glow: "0 0 20px rgba(199, 125, 255, 0.15)",
        "glow-md": "0 0 30px rgba(199, 125, 255, 0.2)",
        "glow-lg": "0 0 40px rgba(199, 125, 255, 0.25)",
        "glow-teal": "0 0 20px rgba(0, 212, 200, 0.15)",
        "card-hover": "0 8px 30px rgba(0, 0, 0, 0.3)",
        soft: "0 2px 10px rgba(0, 0, 0, 0.1)",
      },

      // ── Animations ──
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(10px)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "bounce-dot": {
          "0%, 80%, 100%": { transform: "scale(0)" },
          "40%": { transform: "scale(1)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.95)", opacity: "0.7" },
          "50%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.95)", opacity: "0.7" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "fade-out": "fade-out 0.3s ease-in",
        "slide-up": "slide-up 0.4s ease-out",
        "slide-down": "slide-down 0.4s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        shimmer: "shimmer 1.5s infinite linear",
        "bounce-dot": "bounce-dot 1.4s infinite ease-in-out both",
        "pulse-ring": "pulse-ring 2s infinite ease-in-out",
      },

      // ── Transitions ──
      transitionDuration: {
        "400": "400ms",
      },

      // ── Responsive Breakpoints (customized) ──
      screens: {
        xs: "480px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },

      // ── Z-Index Scale ──
      zIndex: {
        dropdown: "1000",
        sticky: "1020",
        fixed: "1030",
        "modal-backdrop": "1040",
        modal: "1050",
        popover: "1060",
        tooltip: "1070",
        toast: "1080",
      },

      // ── Backdrop Blur ──
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
};

export default config;
