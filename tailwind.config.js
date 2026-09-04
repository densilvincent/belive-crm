/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#0B7D8C',
          dark: '#095F6B',
        },
        brandgreen: {
          DEFAULT: '#2BA89F',
        },
        gold: {
          DEFAULT: '#D4A574',
        },
        bggray: {
          light: '#F9FAFB',
          dark: '#1F2937',
        },
      },
      fontFamily: {
        display: ['Poppins', 'system-ui', 'sans-serif'],
        body: ['Outfit', 'system-ui', 'sans-serif'],
      },
      minHeight: {
        touch: '48px',
      },
      minWidth: {
        touch: '48px',
      },
    },
  },
  plugins: [],
}
