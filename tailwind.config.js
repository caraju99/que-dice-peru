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
          red: '#C8102E',
          redDark: '#9B0A22',
          redSoft: 'rgba(200,16,46,0.08)',
          redMid: 'rgba(200,16,46,0.18)',
          gold: '#E8C547',
          white: '#FAFAF7',
          dark: '#111111',
          dark2: '#1E1E1E',
          dark3: '#2A2A2A',
          text: '#111111',
          text2: '#6B6B6B',
          text3: '#9B9B9B',
          surface: '#F2EFE9',
          border: 'rgba(17,17,17,0.08)',
          border2: 'rgba(17,17,17,0.14)',
          green: '#C8102E',
          greenDark: '#9B0A22',
          bg: '#FAFAF7',
        }
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Playfair Display', 'serif'],
        body: ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'DM Mono', 'monospace']
      },
      borderRadius: {
        card: '6px'
      }
    }
  },
  plugins: []
};