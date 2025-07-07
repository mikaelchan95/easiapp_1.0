/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary brand color - black/white
        brand: {
          50: 'hsl(0, 0%, 98%)',
          100: 'hsl(0, 0%, 96%)',
          200: 'hsl(0, 0%, 90%)',
          300: 'hsl(0, 0%, 83%)',
          400: 'hsl(0, 0%, 64%)',
          500: 'hsl(0, 0%, 45%)',
          600: 'hsl(0, 0%, 32%)',
          700: 'hsl(0, 0%, 25%)',
          800: 'hsl(0, 0%, 15%)',
          900: 'hsl(0, 0%, 9%)',
          950: 'hsl(0, 0%, 4%)'
        },
        // Secondary color - green
        primary: {
          50: 'hsl(142, 76%, 95%)',
          100: 'hsl(141, 79%, 90%)',
          200: 'hsl(141, 72%, 80%)',
          300: 'hsl(142, 69%, 68%)',
          400: 'hsl(142, 64%, 49%)',
          500: 'hsl(142, 70%, 45%)',
          600: 'hsl(142, 76%, 36%)',
          700: 'hsl(142, 72%, 29%)',
          800: 'hsl(143, 64%, 24%)',
          900: 'hsl(144, 61%, 20%)',
          950: 'hsl(145, 80%, 10%)'
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'system-ui',
          '"Segoe UI"',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          '"Helvetica Neue"',
          'sans-serif'
        ],
      },
      fontSize: {
        'ios-caption2': ['0.6875rem', { lineHeight: '1.091', fontWeight: '400' }],
        'ios-caption1': ['0.75rem', { lineHeight: '1.167', fontWeight: '400' }],
        'ios-footnote': ['0.8125rem', { lineHeight: '1.077', fontWeight: '400' }],
        'ios-subhead': ['0.9375rem', { lineHeight: '1.2', fontWeight: '400' }],
        'ios-callout': ['1rem', { lineHeight: '1.375', fontWeight: '400' }],
        'ios-body': ['1.0625rem', { lineHeight: '1.235', fontWeight: '400' }],
        'ios-headline': ['1.0625rem', { lineHeight: '1.235', fontWeight: '600' }],
        'ios-title3': ['1.25rem', { lineHeight: '1.3', fontWeight: '400' }],
        'ios-title2': ['1.375rem', { lineHeight: '1.273', fontWeight: '400' }],
        'ios-title1': ['1.75rem', { lineHeight: '1.214', fontWeight: '400' }],
        'ios-largetitle': ['2.125rem', { lineHeight: '1.176', fontWeight: '400' }],
      },
      spacing: {
        'safe-top': 'var(--sat, 0px)',
        'safe-bottom': 'var(--sab, 0px)',
        'safe-left': 'var(--sal, 0px)',
        'safe-right': 'var(--sar, 0px)',
      },
      height: {
        screen: ['100vh', '100dvh'],
      },
      minHeight: {
        screen: ['100vh', '100dvh'],
      },
      maxHeight: {
        screen: ['100vh', '100dvh'],
      },
    },
  },
  plugins: [],
};