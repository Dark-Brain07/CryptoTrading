import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { Web3Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BaseIndex Agent | Autonomous Chat-to-Trade Stock Portfolios on Base',
  description: 'Institutional-grade autonomous stock index builder on Base Mainnet. Allocate real-world tokenized equities (TSLA, NVDA, AAPL, SPY) via natural language chat with CDP AgentKit.',
  icons: {
    icon: '/favicon.ico'
  },
  other: {
    'base:app_id': '6aa13b703ebd729e7bff107b'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="bg-obsidian-950">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('baseindex_theme') === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-obsidian-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-base-blue selection:text-white transition-colors duration-200`}>
        <Web3Providers>
          {children}
        </Web3Providers>
      </body>
    </html>
  );
}
