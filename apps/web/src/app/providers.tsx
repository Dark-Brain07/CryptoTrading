'use client';

import React, { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from '../config/wagmi';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import '@rainbow-me/rainbowkit/styles.css';

function RainbowKitWithTheme({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <RainbowKitProvider
      theme={
        theme === 'dark'
          ? darkTheme({
              accentColor: '#0052FF',
              accentColorForeground: '#FFFFFF',
              borderRadius: 'medium',
              fontStack: 'system',
              overlayBlur: 'small'
            })
          : lightTheme({
              accentColor: '#0052FF',
              accentColorForeground: '#FFFFFF',
              borderRadius: 'medium',
              fontStack: 'system',
              overlayBlur: 'small'
            })
      }
    >
      {children}
    </RainbowKitProvider>
  );
}

export function Web3Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 10_000
      }
    }
  }));

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RainbowKitWithTheme>
            {children}
          </RainbowKitWithTheme>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
