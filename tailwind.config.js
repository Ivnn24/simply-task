/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: '#0f172a', // Slate-900 background
        brand: '#6366f1', // Indigo primary
      }
    },
  },
  plugins: [],
}