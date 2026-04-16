import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef9ee',
          100: '#fdf0d0',
          200: '#fadd9d',
          300: '#f6c460',
          400: '#f2a82e',
          500: '#ef8f10',
          600: '#d96e09',
          700: '#b4510b',
          800: '#903f10',
          900: '#763510',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
