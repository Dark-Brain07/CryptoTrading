"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPortfolioTelegram = formatPortfolioTelegram;
exports.formatExecutionTelegram = formatExecutionTelegram;
function formatPortfolioTelegram(holdings, totalUSD) {
    let text = `💼 *BaseIndex Agent — Live Portfolio*\n`;
    text += `*Network:* Base Mainnet (Chain ID 8453)\n`;
    text += `*Total Value:* $${totalUSD.toFixed(2)} USD\n\n`;
    for (const h of holdings) {
        const changeSign = h.change24h >= 0 ? '+' : '';
        text += `🔹 *${h.ticker}* (${h.name.split(' ')[0]})\n`;
        text += `   Shares: \`${h.balance}\` | Value: \`$${h.balanceUSD.toFixed(2)}\`\n`;
        text += `   Weight: \`${h.allocationPercentage}%\` | 24h: \`${changeSign}${h.change24h}%\`\n`;
        text += `   [View Token on BaseScan](${h.explorerUrl})\n\n`;
    }
    text += `_Chat with me anytime to rebalance or execute new index allocations!_`;
    return text;
}
function formatExecutionTelegram(result) {
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
