import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Warm cream backgrounds
        "cream": {
          50: "#FFFEFB",
          100: "#FFFEFD",
          200: "#FFFDF8",
          300: "#FFF9F0",
        },
        // Warm accent colors
        "salmon": {
          400: "#E59C84",
          500: "#D97757",
          600: "#C2410C",
        },
        "coral": {
          400: "#FB923C",
          500: "#EA580C",
        },
        // Warm text colors
        "warm": {
          "text-primary": "#141413",
          "text-secondary": "#5C4A45",
          "text-muted": "#8B7A75",
          "text-subtle": "#A39490",
        },
        // Warm neutrals (stone)
        "stone": {
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
        },
        // Legacy exam colors - updated to warm palette
        "exam-background": "#FFFEFB",
        "exam-border": "#E7E5E4",
        "exam-border-secondary": "#D6D3D1",
        "exam-text-primary": "#3D2E2A",
        "exam-text-secondary": "#5C4A45",
        "exam-text-muted": "#8B7A75",
        "exam-neutral": "#78716C",
        "exam-neutral-dark": "#44403C",
        // Filter section colors (already warm)
        "filter-section-bg": "#F5F4ED",
        "filter-section-border": "#F0EEE6",
        "filter-pill-bg": "#FFFEFB",
        "filter-pill-border": "#D0D0D0",
        "filter-clear-text": "#E59C84",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config