/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#00C853',
          greenDark: '#00A846',
          cream: '#F5EED7',
          dark: '#0D0D0D',
          red: '#E63946',
          bg: '#FAFAF8',
          surface: '#F1EFE8',
          text: '#0D0D0D',
          text2: '#6B6B66',
          border: 'rgba(13,13,13,0.1)',
          border2: 'rgba(13,13,13,0.18)'
        }
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      },
      borderRadius: {
        card: '12px'
      }
    }
  },
  plugins: []
};
