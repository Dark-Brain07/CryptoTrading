"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTradeTool = void 0;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const cdpActionProvider_1 = require("./cdpActionProvider");
const aerodrome_1 = require("../../services/aerodrome");
exports.executeTradeTool = new tools_1.DynamicStructuredTool({
    name: 'execute_tokenized_index_trade',
    description: 'Executes an on-chain purchase of tokenized stocks on Base Mainnet. Can handle single stocks or a diversified index basket.',
    schema: zod_1.z.object({
        allocations: zod_1.z.array(zod_1.z.object({
            ticker: zod_1.z.string().describe('Stock symbol, e.g. NVDA'),
            amountUSD: zod_1.z.number().describe('USD dollar amount allocated to this stock')
        })).describe('List of stocks and amounts to purchase'),
        mode: zod_1.z.enum(['autonomous_agent', 'self_custody']).optional().default('autonomous_agent'),
        walletAddress: zod_1.z.string().optional().describe('Recipient address if in self-custody mode')
    }),
    func: async ({ allocations, mode, walletAddress }) => {
        try {
            const results = [];
            for (const item of allocations) {
                const outcome = await cdpActionProvider_1.cdpExecutionManager.executeStockSwap({
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
                preparedTxs = (0, aerodrome_1.buildClientPreparedTransactions)(walletAddress, allocations);
            }
            return JSON.stringify({
                success: true,
                network: 'Base Mainnet (Chain ID 8453)',
                totalAllocatedUSD: totalUSD,
                trades: results,
                preparedTransactions: preparedTxs,
                message: `Successfully executed index allocation of $${totalUSD.toFixed(2)} on Base Mainnet.`
            });
        }
        catch (err) {
            return JSON.stringify({
                success: false,
                error: err?.message || 'Execution error on Base Mainnet'
            });
        }
    }
});
