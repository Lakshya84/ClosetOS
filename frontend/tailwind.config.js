/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: "#0A0A0A",
          card: "#141414",
          lime: "#C8FF00",
          primary: "#F0F0F0",
          muted: "#6B6B6B",
          red: "#FF3B3B"
        }
      },
      fontFamily: {
        sans: ['"Outfit"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      boxShadow: {
        'glow-lime': '0 0 15px rgba(200, 255, 0, 0.15)',
        'glow-red': '0 0 15px rgba(255, 59, 59, 0.2)'
      }
    },
  },
  plugins: [],
}
