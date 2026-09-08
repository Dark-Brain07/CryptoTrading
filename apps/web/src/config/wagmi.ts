import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';
import { http } from 'viem';

import { baseTransport } from '../lib/baseRpc';

// Ensure a fallback Project ID if env is empty so RainbowKit works reliably
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'b4916a49594f83e20e854d924151e39a';

export const wagmiConfig = getDefaultConfig({
  appName: 'BaseIndex Agent',
  projectId,
  chains: [base], // Strictly Base Mainnet
  transports: {
    [base.id]: baseTransport
  },
  ssr: true,
});
