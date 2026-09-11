/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      colors: {
        'bg-base': '#FCFAF6',
        'bg-surface': '#F4F3EC',
        'bg-sunken': '#EDEAE0',
        'near-black': '#1A1311',
        'text-sec': '#4A3F3B',
        'text-tert': '#7A6E6A',
        'vermilion': '#E5472D',
        'burnt-red': '#C43A22',
        'amber': '#F6A81F',
        'gov-green': '#2B8A68',
        'border-subtle': '#E0DDD5',
        'border-default': '#C8C3BA',
      },
      fontSize: {
        'display-xl': ['2.5rem', { lineHeight: '1.15', fontWeight: '500' }],
        'display-lg': ['2rem', { lineHeight: '1.2', fontWeight: '600' }],
        'display-md': ['1.5rem', { lineHeight: '1.25', fontWeight: '600' }],
        'heading-sm': ['1.125rem', { lineHeight: '1.35', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.65' }],
        'body-sm': ['0.875rem', { lineHeight: '1.6' }],
        'label': ['0.75rem', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.06em' }],
        'caption': ['0.75rem', { lineHeight: '1.5' }],
        'mono-sm': ['0.8125rem', { lineHeight: '1.5' }],
      },
    },
  },
  plugins: [],
}
