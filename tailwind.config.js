/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'grid-cols-4',
    'grid-cols-5',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
