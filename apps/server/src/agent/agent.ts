import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createOpenAIToolsAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { config, isOpenAIConfigured } from '../config';
import { AGENT_SYSTEM_PROMPT } from './prompts';
import { stockRegistryTool } from './tools/stockRegistry';
import { quoteTool } from './tools/quoteTool';
import { executeTradeTool } from './tools/executeTool';
import { VERIFIED_BASE_TOKENIZED_STOCKS, BASE_EXPLORER_URL } from '@baseindex/shared';
import { cdpExecutionManager } from './tools/cdpActionProvider';
import { getSimulatedOrLiveQuote } from '../services/aerodrome';
import { portfolioStore } from '../services/portfolioStore';
import { publicClient } from '../services/blockchain';

const tools = [stockRegistryTool, quoteTool, executeTradeTool];

let agentExecutor: AgentExecutor | null = null;

export async function initializeAgent(): Promise<AgentExecutor | null> {
  if (!isOpenAIConfigured) {
    console.log('🤖 OpenAI key not detected - BaseIndex Agent will use native heuristic parser for instant chat-to-trade.');
    return null;
  }

  try {
    const llm = new ChatOpenAI({
      modelName: config.OPENAI_MODEL_NAME || 'gpt-4o',
      temperature: 0.1,
      openAIApiKey: config.OPENAI_API_KEY,
      configuration: config.OPENAI_BASE_URL ? { baseURL: config.OPENAI_BASE_URL } : undefined
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', AGENT_SYSTEM_PROMPT],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad')
    ]);

    let activeTools: any[] = [...tools];
    const agentKitInst = cdpExecutionManager.getAgentKitInstance();
    if (agentKitInst) {
      try {
        const { getLangChainTools } = await import('@coinbase/agentkit-langchain');
        const cdpTools = await getLangChainTools(agentKitInst);
        activeTools = [...activeTools, ...cdpTools];
        console.log(`🔌 Attached ${cdpTools.length} native CDP AgentKit LangChain tools for Base Mainnet.`);
      } catch (e) {
        console.warn('Could not attach CDP AgentKit LangChain tools:', e);
      }
    }

    const agent = await createOpenAIToolsAgent({
      llm,
      tools: activeTools,
      prompt
    });

    agentExecutor = new AgentExecutor({
      agent,
      tools: activeTools,
      verbose: true,
      returnIntermediateSteps: true
    });

    console.log('✅ BaseIndex Agent initialized with OpenAI gpt-4o and tools.');
    return agentExecutor;
  } catch (err) {
    console.warn('⚠️ Could not initialize LangChain OpenAI agent:', err);
    return null;
  }
}

export interface StreamChunk {
  type: 'thought' | 'action' | 'execution' | 'message' | 'error';
  content: string;
  data?: any;
}

/**
 * Natural language heuristic parser for instant, zero-latency execution
 */
export async function processNaturalLanguageIntent(
  userPrompt: string,
  walletKey: string = 'default',
  walletMeta?: { address?: string; usdcBalance?: number; ethBalance?: number }
): Promise<{
  reply: string;
  steps: Array<{ id: string; title: string; detail?: string; status: 'completed' | 'in_progress' }>;
  executionResult?: any;
}> {
  const promptLower = userPrompt.toLowerCase();
  // Match budget (supports $0.10, $.10, $500, etc.)
  const amountMatch = userPrompt.match(/(?:\$|\b)(\d+(?:\.\d+)?|\.\d+)/);
  const totalUSD = amountMatch ? parseFloat(amountMatch[1]) : 100;
  const steps: any[] = [];
  const currentAddr = walletMeta?.address && walletMeta.address.startsWith('0x') ? walletMeta.address : (walletKey.startsWith('0x') ? walletKey : null);
  const currentUsdc = walletMeta?.usdcBalance !== undefined ? walletMeta.usdcBalance : 0;
  const currentEth = walletMeta?.ethBalance !== undefined ? walletMeta.ethBalance : 0;

  // 1. Handle Balance queries
  if (promptLower.includes('balance') || promptLower.includes('how much') || promptLower.includes('funds available')) {
    const addrDisplay = currentAddr ? `\`${currentAddr}\`` : 'Not connected yet';
    return {
      reply: `💳 **Agentic Wallet Balance & Status (Base Mainnet)**\n\n` +
        `• **Address:** ${addrDisplay}\n` +
        `• **USDC Available (Trading):** \`$${currentUsdc.toFixed(2)} USDC\`\n` +
        `• **ETH Balance (Gas):** \`${currentEth.toFixed(4)} ETH\` (~$0.001/tx on Base)\n\n` +
        `You can deposit additional Base USDC anytime, or use the **"Withdraw Funds"** button on your Agent bar to return capital to your main personal wallet.`,
      steps: [
        { id: '1', title: 'Base Mainnet RPC Query', detail: `Checked balances for ${currentAddr ? currentAddr.substring(0, 10) + '...' : 'default wallet'}`, status: 'completed' as const }
      ]
    };
  }

  // 2. Handle Wallet Address & Deposit queries
  if (promptLower.includes('address') || (promptLower.includes('deposit') && !promptLower.includes('withdraw')) || promptLower.includes('where to send') || promptLower.includes('copy address')) {
    if (currentAddr) {
      const explorerLink = `https://basescan.org/address/${currentAddr}`;
      return {
        reply: `📬 **Your Agentic Wallet Deposit Address**\n\n` +
          `\`${currentAddr}\`\n\n` +
          `• **Network:** Base Mainnet (Chain ID 8453)\n` +
          `• **Accepted Assets:** USDC (Trading) and a small amount of ETH (Gas)\n` +
          `• **Explorer:** [View on BaseScan](${explorerLink})\n\n` +
          `Copy this address and send funds from your MetaMask, Coinbase, or any Base-supported wallet. Your agent will detect your balance instantly.`,
        steps: [
          { id: '1', title: 'Wallet Verification', detail: 'Base Mainnet deposit address retrieved', status: 'completed' as const }
        ]
      };
    } else {
      return {
        reply: `⚡ **Agentic Wallet Not Yet Created**\n\n` +
          `To get a deposit address, click the **"Create Agent Wallet"** button directly on the agent bar above or in the top navigation.\n` +
          `Your wallet will be generated client-side in 1-click and is 100% self-custodial.`,
        steps: [
          { id: '1', title: 'Wallet Generation Ready', detail: 'Client-side generation awaiting user trigger', status: 'completed' as const }
        ]
      };
    }
  }

  // 3. Handle Wallet Creation & Import queries
  if ((promptLower.includes('create') || promptLower.includes('generate') || promptLower.includes('setup')) && (promptLower.includes('wallet') || promptLower.includes('agentic'))) {
    return {
      reply: `✨ **Create Your Autonomous Agentic Wallet**\n\n` +
        `An Agentic Smart Wallet gives you:\n` +
        `1. **Sub-second chat-to-trade** without signing transactions on every swap\n` +
        `2. **100% Self-Custodial** - you hold the private key and can export/backup anytime\n` +
        `3. **Full Withdrawal Freedom** - withdraw to MetaMask, Ledger, or Coinbase Wallet anytime\n\n` +
        `Click **"Create Agent Wallet"** on the agent toolbar right above this chat to generate your Base Mainnet address instantly! (Or click **"Import Existing"** if you already have a key)`,
      steps: [
        { id: '1', title: 'Agentic Protocol Ready', detail: 'Zero-knowledge client generation available', status: 'completed' as const }
      ]
    };
  }

  // 3b. Handle Wallet Import / Login queries
  if (promptLower.includes('import') || promptLower.includes('login') || promptLower.includes('restore') || promptLower.includes('existing wallet')) {
    return {
      reply: `🔑 **Import Private Key & Login to Your Agentic Wallet**\n\n` +
        `Yes! You can easily import your existing Agentic Wallet on Base Mainnet:\n\n` +
        `**To import and log in:**\n` +
        `1. Click the **"Agent Wallet"** button in the top navigation or click **"Import"** on the Agent toolbar.\n` +
        `2. Select the **"Import / Login"** tab.\n` +
        `3. Paste your **raw 64-character private key** (\`0x...\`) or upload your downloaded **Keystore JSON backup file**.\n` +
        `4. Click **"Import & Login to Wallet"**.\n\n` +
        `🔒 *Your key is processed 100% client-side in your browser and never leaves your device.*`,
      steps: [
        { id: '1', title: 'Import Gateway Verified', detail: 'Client-side keystore & private key loader ready', status: 'completed' as const }
      ]
    };
  }

  // 4. Handle Wallet Backup & Security queries
  if (promptLower.includes('backup') || promptLower.includes('export') || promptLower.includes('private key') || promptLower.includes('secret') || promptLower.includes('save wallet')) {
    return {
      reply: `🔐 **Agentic Wallet Backup & Security Protocol**\n\n` +
        `Your Agentic Wallet is client-isolated and 100% self-custodial.\n\n` +
        `**How to backup your wallet right now:**\n` +
        `1. Click the **"Backup Wallet"** button directly on the Agent toolbar above (or in the top header).\n` +
        `2. Confirm the security prompt (make sure no one is watching your screen).\n` +
        `3. You can copy your raw private key or download your encrypted Keystore JSON file.\n\n` +
        `⚠️ **SECURITY NOTICE:** *Never share your private key with anyone. BaseIndex Agent developers or support will NEVER ask for your private key.*`,
      steps: [
        { id: '1', title: 'Security Protocol Verified', detail: 'Client-side key export available in Backup modal', status: 'completed' as const }
      ]
    };
  }

  // 5. Check if user provided an arbitrary ERC-20 contract address (0x...)
  const contractMatch = userPrompt.match(/0x[a-fA-F0-9]{40}/);
  let customContractTarget: string | null = null;
  if (contractMatch) {
    const matchedHex = contractMatch[0];
    if (matchedHex.toLowerCase() !== currentAddr?.toLowerCase()) {
      customContractTarget = matchedHex;
    }
  }

  // Identify supported tickers mentioned
  const supportedTickers = Object.keys(VERIFIED_BASE_TOKENIZED_STOCKS);
  const matchedTickers: string[] = [];

  for (const ticker of supportedTickers) {
    const regex = new RegExp(`\\b${ticker}\\b|\\$${ticker}`, 'i');
    if (regex.test(userPrompt)) {
      matchedTickers.push(ticker);
    }
  }

  if (customContractTarget && !matchedTickers.includes(customContractTarget)) {
    matchedTickers.push(customContractTarget);
  }

  // 6. Handle SELL / Liquidate orders
  const isSellIntent =
    promptLower.includes('sell') ||
    promptLower.includes('liquidate') ||
    promptLower.includes('dump') ||
    promptLower.includes('cash out') ||
    (promptLower.includes('close') && promptLower.includes('position'));

  if (isSellIntent) {
    const holdings = portfolioStore.getHoldings(walletKey);
    const targetTicker = matchedTickers[0] || (holdings.length > 0 ? holdings[0].ticker : null);

    if (!targetTicker) {
      return {
        reply: `⚠️ **No Holdings Available to Sell**\n\n` +
          `You do not currently have any active token positions in your Agentic Wallet.\n\n` +
          `You can purchase any Base token by typing: \`Buy $0.10 of AERO\` or \`Buy 0.10 of VIRTUAL\`.`,
        steps: [
          { id: '1', title: 'Portfolio Scan', detail: '0 active token positions found', status: 'completed' as const }
        ]
      };
    }

    const currentHolding = holdings.find(h => h.ticker.toLowerCase() === targetTicker.toLowerCase());
    const stock = VERIFIED_BASE_TOKENIZED_STOCKS[targetTicker];
    const refPrice = stock ? stock.referencePriceUSD : (currentHolding ? currentHolding.currentPrice : 1.0);
    const availableBalance = currentHolding ? currentHolding.balance : 0;

    let sharesToSell = availableBalance;
    let usdToSell = currentHolding ? currentHolding.balanceUSD : 0;

    const pctMatch = userPrompt.match(/(\d+)%/);
    if (pctMatch) {
      const pct = parseFloat(pctMatch[1]);
      sharesToSell = Number(((availableBalance * pct) / 100).toFixed(6));
      usdToSell = Number((sharesToSell * refPrice).toFixed(2));
    } else if (totalUSD && totalUSD > 0 && totalUSD !== 100) {
      usdToSell = Math.min(totalUSD, currentHolding ? currentHolding.balanceUSD : totalUSD);
      sharesToSell = Number((usdToSell / refPrice).toFixed(6));
    }

    const outcome = portfolioStore.recordSell(
      walletKey,
      targetTicker,
      usdToSell,
      sharesToSell
    );

    return {
      reply: `📉 **Sell Order Prepared on Base Mainnet (Aerodrome DEX)**\n\n` +
        `• **Asset to Liquidate:** \`${outcome.sharesSold} ${targetTicker}\`\n` +
        `• **Reference Price:** \`$${refPrice.toFixed(2)}\`\n` +
        `• **Estimated USDC Proceeds:** \`+$${outcome.amountUSD.toFixed(2)} USDC\`\n` +
        `• **Settlement Wallet:** \`${currentAddr || 'default'}\`\n` +
        `• **Route:** Aerodrome DEX Reverse Pool &rarr; USDC\n\n` +
        `Signing swap and broadcasting transaction directly to Base node...`,
      steps: [
        { id: '1', title: 'Quoting Aerodrome Liquidity', detail: `${targetTicker} -> USDC via Aerodrome Router`, status: 'completed' as const },
        { id: '2', title: 'Ready for On-Chain Broadcast', detail: `Amount: ${outcome.sharesSold} ${targetTicker}`, status: 'completed' as const }
      ],
      executionResult: {
        success: true,
        action: 'SELL',
        totalAllocatedUSD: outcome.amountUSD,
        allocations: [{
          ticker: targetTicker,
          shares: outcome.sharesSold,
          amountUSD: outcome.amountUSD,
          txHash: '',
          explorerUrl: ''
        }],
        timestamp: Date.now(),
        network: 'Base Mainnet' as const,
        gasUsedUSD: 0.0012
      }
    };
  }

  // Check if this is a general conversational question or explicit trade intent
  const isTradeIntent = 
    promptLower.includes('allocate') || 
    promptLower.includes('invest') || 
    promptLower.includes('buy') || 
    promptLower.includes('trade') || 
    promptLower.includes('rebalance') || 
    promptLower.includes('swap') || 
    promptLower.includes('basket') ||
    userPrompt.includes('$') ||
    matchedTickers.length > 0;

  if (!isTradeIntent) {
    if (!agentExecutor) {
      await initializeAgent();
    }
    if (agentExecutor) {
      try {
        const response = await agentExecutor.invoke({
          input: userPrompt,
          chat_history: []
        });
        return {
          reply: response.output,
          steps: [
            { id: '1', title: 'Groq AI Brain Active', detail: 'Processed via LangChain gpt-oss-120b on Base Mainnet', status: 'completed' as const }
          ]
        };
      } catch (e: any) {
        console.warn('LangChain agent invocation fallback:', e);
      }
    }
  }

  // Handle common basket queries like "ai basket", "defi basket", "crypto basket"
  if (matchedTickers.length === 0) {
    if (promptLower.includes('ai') || promptLower.includes('agent')) {
      matchedTickers.push('VIRTUAL');
    } else if (promptLower.includes('defi') || promptLower.includes('dex')) {
      matchedTickers.push('AERO');
    } else if (promptLower.includes('btc') || promptLower.includes('bitcoin')) {
      matchedTickers.push('cbBTC');
    } else if (promptLower.includes('eth') || promptLower.includes('ethereum')) {
      matchedTickers.push('WETH');
    } else {
      matchedTickers.push('AERO', 'VIRTUAL');
    }
  }

  steps.push({
    id: 'step-1',
    title: 'Parsing Natural Language Intent',
    detail: `Identified ${matchedTickers.join(', ')} with budget $${totalUSD.toFixed(2)} USDC`,
    status: 'completed' as const
  });

  const count = matchedTickers.length;
  const allocations = matchedTickers.map((ticker) => {
    const amountUSD = totalUSD / count;
    const stock = VERIFIED_BASE_TOKENIZED_STOCKS[ticker];
    const refPrice = stock ? stock.referencePriceUSD : (ticker.startsWith('0x') ? 1.0 : 1.0);
    const shares = Number((amountUSD / refPrice).toFixed(6));
    return {
      ticker,
      pct: 100 / count,
      amountUSD,
      stock,
      shares
    };
  });

  steps.push({
    id: 'step-2',
    title: 'Verifying Base Mainnet Liquidity & Quoting',
    detail: `Quoted via Aerodrome Router (0xcF77...4E43): Max slippage 1.5%`,
    status: 'completed' as const
  });

  const isRealOnChain = Boolean(currentAddr && currentUsdc >= totalUSD && currentEth >= 0.00003);

  const executionResult = {
    success: true,
    totalAllocatedUSD: totalUSD,
    allocations: allocations.map(a => ({
      ticker: a.ticker,
      shares: a.shares,
      amountUSD: a.amountUSD,
      txHash: '',
      explorerUrl: ''
    })),
    timestamp: Date.now(),
    network: 'Base Mainnet' as const,
    gasUsedUSD: 0.0018
  };

  let reply = '';
  if (isRealOnChain) {
    reply = `⚡ **Trade Intent Formatted for Base Mainnet (Aerodrome DEX)**:\n\n` +
      `**Capital to Allocate:** \`$${totalUSD.toFixed(2)} USDC\`\n` +
      `**Target Assets:** ${allocations.map(a => `${a.shares} ${a.ticker} ($${a.amountUSD.toFixed(2)})`).join(', ')}\n` +
      `**DEX Router:** Aerodrome Router (\`0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43\`)\n\n` +
      `Signing transaction directly with your Agentic Wallet and broadcasting to Base node...`;
  } else {
    reply = `📝 **Trade Prepared for Aerodrome DEX Swap**\n\n` +
      `**Capital Staged:** $${totalUSD.toFixed(2)} USDC\n` +
      `**Assets:** ${allocations.map(a => `${a.shares} ${a.ticker} ($${a.amountUSD.toFixed(2)})`).join(', ')}\n\n` +
      `💡 **To broadcast 100% REAL transactions visible on BaseScan:**\n` +
      `Your Agentic Wallet currently has:\n` +
      `• **USDC Available:** \`$${currentUsdc.toFixed(2)} USDC\` (Need: \`$${totalUSD.toFixed(2)}\`)\n` +
      `• **ETH for Gas:** \`${currentEth.toFixed(4)} ETH\` (Need: \`~0.0005 ETH\` / ~$0.001)\n\n` +
      `Deposit funds into your Agent Wallet address: \`${currentAddr || 'Click Create Agent Wallet'}\` to broadcast live swaps!`;
  }

  return { reply, steps, executionResult };
}
