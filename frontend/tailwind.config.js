/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'light-gray': '#f8f9fb',
        'card-bg': '#ffffff',
        'text-dark': '#1a202c',
        'text-muted': '#718096',
      },
      backgroundImage: {
        'gradient-purple-blue': 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 8px 30px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'xl': '1.25rem',
        '2xl': '1.5rem',
        'pill': '9999px',
      },
    },
  },
  plugins: [],
}
