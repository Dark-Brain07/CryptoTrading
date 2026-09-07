export interface StockToken {
  ticker: string;
  name: string;
  contractAddress: `0x${string}`;
  decimals: number;
  issuer: string; // e.g. "Dinari / Backed"
  category: 'DeFi' | 'Blue Chip' | 'AI' | 'Social' | 'Finance' | 'Tech' | 'ETF' | 'Semiconductors' | 'Custom';
  underlyingSymbol: string;
  referencePriceUSD: number;
  poolAddress?: `0x${string}`;
  iconUrl?: string;
}

export interface PortfolioAllocation {
  ticker: string;
  name: string;
  contractAddress: `0x${string}`;
  percentage: number; // e.g., 60
  amountUSD: number;   // e.g., 60.00
  estimatedShares: number;
  currentPriceUSD: number;
}

export interface TradeIntent {
  rawPrompt: string;
  totalBudgetUSD: number;
  allocations: PortfolioAllocation[];
  mode: 'autonomous_agent' | 'self_custody';
  slippageBps: number;
}

export interface ExecutionStep {
  id: string;
  title: string;
  detail?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  txHash?: string;
  explorerUrl?: string;
}

export interface ExecutionResult {
  success: boolean;
  totalAllocatedUSD: number;
  allocations: {
    ticker: string;
    shares: number;
    amountUSD: number;
    txHash: string;
    explorerUrl: string;
  }[];
  overallTxHash?: string;
  timestamp: number;
  network: 'Base Mainnet';
  gasUsedUSD: number;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  steps?: ExecutionStep[];
  executionResult?: ExecutionResult;
  timestamp: number;
}

export interface PortfolioHolding {
  ticker: string;
  name: string;
  balance: number;
  balanceUSD: number;
  currentPrice: number;
  change24h: number;
  allocationPercentage: number;
  contractAddress: `0x${string}`;
  explorerUrl: string;
  iconUrl?: string;
}

export interface PreparedTransaction {
  to: `0x${string}`;
  data: `0x${string}`;
  value: string; // hex or string representation of wei
  description: string;
  ticker: string;
  amountUSD: number;
}

export interface GasTrackerData {
  baseFeeGwei: number;
  priorityFeeGwei: number;
  estimatedSwapCostUSD: number;
  blockNumber: number;
  timestamp: number;
}
