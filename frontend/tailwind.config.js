// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"], // Enables dark mode using a CSS class
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"], // Specifies the paths to all of your template files
  safelist: [
    {
      // Safelists dynamic border and text color classes used in LoadingComponent
      pattern:
        /^(border|text)-(primary|accent|secondary|muted|destructive|popover|card)(-foreground)?$/,
    },
  ],
  theme: {
    container: {
      center: true, // Centers the container
      padding: "2rem", // Adds 2rem padding on all sides
      screens: {
        "2xl": "1400px", // Customizes the 2xl breakpoint
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
      },
      borderRadius: {
        lg: "var(--radius)", // Large border radius
        md: "calc(var(--radius) - 2px)", // Medium border radius
        sm: "calc(var(--radius) - 4px)", // Small border radius
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        blink: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0 },
        },
        pingSlow: {
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
        pingSlower: {
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
        pingSlowest: {
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
        scaleAnimation: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        blink: "blink 1s step-end infinite",
        "ping-slow": "pingSlow 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "ping-slower": "pingSlower 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "ping-slowest": "pingSlowest 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        scale: "scaleAnimation 1s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")], // Includes the tailwindcss-animate plugin for additional animations
};
