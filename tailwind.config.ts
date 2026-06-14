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
        'green-gradient': "linear-gradient(180deg, #00CC00 0%, #008800 100%)",
        'blue-gradient': "linear-gradient(180deg, #239CFF 0%, #005BE3 100%)",
        'yellow-gradient': "linear-gradient(180deg, #FFC900 0%, #FF8F00 100%)",
        'red-gradient': "linear-gradient(180deg, #FF3B30 0%, #C60000 100%)",
        'black-gradient': "linear-gradient(180deg, #555555 0%, #111111 100%)",
        'grey-gradient': "linear-gradient(180deg, #9E9E9E 0%, #616161 100%)",
      }
    },
  },
  plugins: [],
} satisfies Config;
