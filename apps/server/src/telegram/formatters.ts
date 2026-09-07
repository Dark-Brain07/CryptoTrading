import { PortfolioHolding } from '../shared';

export function formatPortfolioTelegram(holdings: any[], totalUSD: number, walletAddress?: string): string {
  let text = `💼 *BaseIndex Agent — Live On-Chain Portfolio*\n`;
  text += `*Network:* Base Mainnet (Chain ID 8453)\n`;
  if (walletAddress) {
    text += `*Wallet:* \`${walletAddress}\`\n`;
  }
  text += `*Total Value:* ~$${totalUSD.toFixed(2)} USD\n\n`;

  const activeHoldings = holdings.filter(h => (h.balance || 0) > 0);
  const zeroHoldings = holdings.filter(h => (h.balance || 0) === 0);

  if (activeHoldings.length > 0) {
    text += `💰 *Active Token Holdings on Base:*\n`;
    for (const h of activeHoldings) {
      const changeSign = (h.change24h || 0) >= 0 ? '+' : '';
      const displayAmount = h.formattedBalance || (h.balance < 0.0001 ? h.balance.toFixed(8) : h.balance.toFixed(4));
      text += `🔹 *${h.ticker}* (${h.name || h.ticker})\n`;
      text += `   Balance: \`${displayAmount} ${h.ticker}\` | Value: \`$${(h.balanceUSD || 0).toFixed(2)}\`\n`;
      if (h.allocationPercentage > 0) {
        text += `   Weight: \`${h.allocationPercentage}%\` | 24h: \`${changeSign}${h.change24h || 0}%\`\n`;
      }
      text += `   [View on BaseScan](${h.explorerUrl})\n\n`;
    }
  }

  if (zeroHoldings.length > 0) {
    text += `🪙 *Other Supported Tokens:*\n`;
    const tokensList = zeroHoldings.map(h => `${h.ticker} (0)`).join(', ');
    text += `_${tokensList}_\n\n`;
  }

  text += `_Chat to trade, e.g. "Buy $0.10 of AERO" or "Sell all AERO to ETH"!_`;
  return text;
}

export function formatExecutionTelegram(result: any): string {
  let text = `⚡ *Base Mainnet Execution Confirmed!*\n\n`;
  text += `*Total Invested:* $${result.totalAllocatedUSD.toFixed(2)} USDC\n`;
  text += `*Gas Incurred:* ~$${result.gasUsedUSD.toFixed(4)} USD\n\n`;
  text += `*Purchased Assets:*\n`;

  for (const alloc of result.allocations) {
    text += `✅ *${alloc.ticker}*: \`${alloc.shares}\` shares ($${alloc.amountUSD.toFixed(2)})\n`;
    text += `   🔗 [View BaseScan TX](${alloc.explorerUrl})\n`;
  }

  return text;
}
