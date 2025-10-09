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
          base: "#FEF5EB", // Main content background
          50: "#FFFEFB",
          100: "#FFFEFD",
          200: "#FFFDF8",
          300: "#FFF9F0",
        },
        // Warm accent colors
        "salmon": {
          300: "#dda896",
          400: "#E59C84",
          500: "#D97757",
          600: "#c55f37ff",
        },
        "coral": {
          400: "#FB923C",
          500: "#EA580C",
        },
        // Blue colors for contrast and interactive elements
        "sky": {
          50: "#f4faffff",
          100: "#E0F2FE",
          200: "#BAE6FD",
          300: "#7DD3FC",
          400: "#38BDF8",
          500: "#0EA5E9",
          600: "#0284C7",
          700: "#0369A1",
          800: "#075985",
        },
        "slate-blue": {
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
        },
        // Warm text colors
        "warm": {
          "text-primary": "#1A1A1A",
          "text-secondary": "#4A4A4A",
          "text-muted": "#6B6B6B",
          "text-subtle": "#9A9A9A",
        },
        // Warm neutrals (stone)
        "stone": {
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
        },
        // Legacy exam colors - updated to warm palette
        "exam-background": "#FFFEFB",
        "exam-border": "#E7E5E4",
        "exam-border-secondary": "#D6D3D1",
        "exam-text-primary": "#1F1F1F",
        "exam-text-secondary": "#525252",
        "exam-text-muted": "#737373",
        "exam-neutral": "#6B6B6B",
        "exam-neutral-dark": "#404040",
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