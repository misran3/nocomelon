/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B6B',
          hover: '#FF5252',
        },
        secondary: '#4ECDC4',
        accent: '#FFE66D',
        background: '#FAFAFA',
        surface: '#FFFFFF',
        text: {
          DEFAULT: '#2D3748',
          muted: '#718096',
        },
        border: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
