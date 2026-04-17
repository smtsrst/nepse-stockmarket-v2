/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Lumina-inspired dark theme
        'bg-primary': '#0d0d0d',
        'bg-secondary': '#1a1a1a',
        'bg-tertiary': '#262626',
        'accent': '#ff9900',
        'accent-hover': '#ffb84d',
        'text-primary': '#e5e5e5',
        'text-secondary': '#a3a3a3',
        'gain': '#22c55e',
        'loss': '#ef4444',
        'border': '#333333',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}