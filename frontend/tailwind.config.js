/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bar-bg': '#0f0f1a',
        'bar-card': '#1a1a2e',
        'bar-card-hover': '#22224a',
        'bar-gold': '#d4a76a',
        'bar-gold-light': '#e8c490',
        'bar-gold-dark': '#b8863a',
        'bar-border': '#2a2a4a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
