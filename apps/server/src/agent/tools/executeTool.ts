import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { cdpExecutionManager } from './cdpActionProvider';
import { buildClientPreparedTransactions } from '../../services/aerodrome';

export const executeTradeTool = new DynamicStructuredTool({
  name: 'execute_tokenized_index_trade',
  description: 'Executes an on-chain purchase of tokenized stocks on Base Mainnet. Can handle single stocks or a diversified index basket.',
  schema: z.object({
    allocations: z.array(
      z.object({
        ticker: z.string().describe('Stock symbol, e.g. NVDA'),
        amountUSD: z.number().describe('USD dollar amount allocated to this stock')
      })
    ).describe('List of stocks and amounts to purchase'),
    mode: z.enum(['autonomous_agent', 'self_custody']).optional().default('autonomous_agent'),
    walletAddress: z.string().optional().describe('Recipient address if in self-custody mode')
  }),
  func: async ({ allocations, mode, walletAddress }) => {
    try {
      const results = [];

      for (const item of allocations) {
        const outcome = await cdpExecutionManager.executeStockSwap({
          ticker: item.ticker,
          amountUSD: item.amountUSD,
          walletKey: walletAddress || 'default'
        });
        results.push(outcome);
      }

      const totalUSD = allocations.reduce((sum, i) => sum + i.amountUSD, 0);

      // If self-custody mode, also prepare calldata
      let preparedTxs = undefined;
      if (mode === 'self_custody' && walletAddress && walletAddress.startsWith('0x')) {
        preparedTxs = buildClientPreparedTransactions(walletAddress as `0x${string}`, allocations);
      }

      return JSON.stringify({
        success: true,
        network: 'Base Mainnet (Chain ID 8453)',
        totalAllocatedUSD: totalUSD,
        trades: results,
        preparedTransactions: preparedTxs,
        message: `Successfully executed index allocation of $${totalUSD.toFixed(2)} on Base Mainnet.`
      });
    } catch (err: any) {
      return JSON.stringify({
        success: false,
        error: err?.message || 'Execution error on Base Mainnet'
      });
    }
  }
});
