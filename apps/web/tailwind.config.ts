import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#080A0F',
          900: '#0E121A',
          800: '#141A24',
          700: '#1A2230',
          border: '#1E2638'
        },
        base: {
          blue: '#0052FF',
          blueHover: '#0045D8',
          blueGlow: 'rgba(0, 82, 255, 0.25)'
        },
        emerald: {
          roi: '#10B981',
          glow: 'rgba(16, 185, 129, 0.2)'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};

export default config;
