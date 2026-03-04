/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2bbdee",
        "background-light": "#f6f7f8",
        "background-dark": "#101d22",
        "neutral-dark": "#192d33",
        "neutral-border": "#325a67",
        "neutral-muted": "#92bbc9",
        "neutral-accent": "#233f48",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}