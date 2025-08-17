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
        "exam-background": "#f6f8fc",
        "exam-border": "#ededed",
        "exam-border-secondary": "#bfbfbf",
        "exam-text-primary": "#1b1b1b",
        "exam-text-secondary": "#424242",
        "exam-text-muted": "#757575",
        "exam-neutral": "#525252",
        "exam-neutral-dark": "#2c2c2c",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'glow-sm': '0 0 20px 5px hsl(209 95% 45% / 0.15), 0 0 40px 10px hsl(209 95% 45% / 0.10), 0 0 60px 15px hsl(209 95% 45% / 0.05)',
        'glow-md': '0 0 25px 8px hsl(209 95% 45% / 0.20), 0 0 50px 15px hsl(209 95% 45% / 0.15), 0 0 75px 20px hsl(209 95% 45% / 0.08)',
        'glow-lg': '0 0 30px 10px hsl(209 95% 45% / 0.25), 0 0 60px 20px hsl(209 95% 45% / 0.18), 0 0 90px 30px hsl(209 95% 45% / 0.10)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config