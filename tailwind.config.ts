import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          blue: "#2388FF",
          light: "#239CFF",
          dark: "#005BE3",
        }
      },
      backgroundImage: {
        'blue-gradient': "linear-gradient(180deg, #239CFF 0%, #005BE3 100%)",
      }
    },
  },
  plugins: [],
} satisfies Config;
