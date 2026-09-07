import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: 'var(--bg-app)',
          900: 'var(--bg-panel)',
          800: 'var(--bg-card)',
          700: 'var(--bg-elevated)',
          border: 'var(--border-color)',
          textPrimary: 'var(--text-primary)',
          textSecondary: 'var(--text-secondary)',
          textMuted: 'var(--text-muted)'
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
