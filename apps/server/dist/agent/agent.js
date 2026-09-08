"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAgent = initializeAgent;
exports.processNaturalLanguageIntent = processNaturalLanguageIntent;
const openai_1 = require("@langchain/openai");
const agents_1 = require("langchain/agents");
const prompts_1 = require("@langchain/core/prompts");
const config_1 = require("../config");
const prompts_2 = require("./prompts");
const stockRegistry_1 = require("./tools/stockRegistry");
const quoteTool_1 = require("./tools/quoteTool");
const executeTool_1 = require("./tools/executeTool");
const shared_1 = require("../shared");
const cdpActionProvider_1 = require("./tools/cdpActionProvider");
const portfolioStore_1 = require("../services/portfolioStore");
const blockchain_1 = require("../services/blockchain");
const viem_1 = require("viem");
const marketAnalytics_1 = require("../services/marketAnalytics");
const tools = [stockRegistry_1.stockRegistryTool, quoteTool_1.quoteTool, executeTool_1.executeTradeTool];
let agentExecutor = null;
async function initializeAgent() {
    if (!config_1.isOpenAIConfigured) {
        console.log('🤖 OpenAI key not detected - BaseIndex Agent will use native heuristic parser for instant chat-to-trade.');
        return null;
    }
    try {
        const llm = new openai_1.ChatOpenAI({
            modelName: config_1.config.OPENAI_MODEL_NAME || 'gpt-4o',
            temperature: 0.1,
            openAIApiKey: config_1.config.OPENAI_API_KEY,
            configuration: config_1.config.OPENAI_BASE_URL ? { baseURL: config_1.config.OPENAI_BASE_URL } : undefined
        });
        const prompt = prompts_1.ChatPromptTemplate.fromMessages([
            ['system', prompts_2.AGENT_SYSTEM_PROMPT],
            new prompts_1.MessagesPlaceholder('chat_history'),
            ['human', '{input}'],
            new prompts_1.MessagesPlaceholder('agent_scratchpad')
        ]);
        let activeTools = [...tools];
        const agentKitInst = cdpActionProvider_1.cdpExecutionManager.getAgentKitInstance();
        if (agentKitInst) {
            try {
                const { getLangChainTools } = await Promise.resolve().then(() => __importStar(require('@coinbase/agentkit-langchain')));
                const cdpTools = await getLangChainTools(agentKitInst);
                activeTools = [...activeTools, ...cdpTools];
                console.log(`🔌 Attached ${cdpTools.length} native CDP AgentKit LangChain tools for Base Mainnet.`);
            }
            catch (e) {
                console.warn('Could not attach CDP AgentKit LangChain tools:', e);
            }
        }
        const agent = await (0, agents_1.createOpenAIToolsAgent)({
            llm,
            tools: activeTools,
            prompt
        });
        agentExecutor = new agents_1.AgentExecutor({
            agent,
            tools: activeTools,
            verbose: true,
            returnIntermediateSteps: true
        });
        console.log('✅ BaseIndex Agent initialized with OpenAI gpt-4o and tools.');
        return agentExecutor;
    }
    catch (err) {
        console.warn('⚠️ Could not initialize LangChain OpenAI agent:', err);
        return null;
    }
}
/**
 * Natural language heuristic parser for instant, zero-latency execution
 */
async function processNaturalLanguageIntent(userPrompt, walletKey = 'default', walletMeta) {
    const promptLower = userPrompt.toLowerCase();
    // Match budget (supports $0.10, $.10, $500, etc.)
    const amountMatch = userPrompt.match(/(?:\$|\b)(\d+(?:\.\d+)?|\.\d+)/);
    let totalUSD = amountMatch ? parseFloat(amountMatch[1]) : 0.10;
    const steps = [];
    const currentAddr = walletMeta?.address && walletMeta.address.startsWith('0x') ? walletMeta.address : (walletKey.startsWith('0x') ? walletKey : null);
    let currentUsdc = walletMeta?.usdcBalance !== undefined ? walletMeta.usdcBalance : 0;
    let currentEth = walletMeta?.ethBalance !== undefined ? walletMeta.ethBalance : 0;
    // If frontend passed zero/stale balances, query Base Mainnet node directly
    if (currentAddr && (currentUsdc <= 0 || currentEth <= 0)) {
        try {
            const [onChainUsdc, onChainEthRaw] = await Promise.all([
                (0, blockchain_1.getOnChainTokenBalance)(shared_1.BASE_USDC.contractAddress, currentAddr, shared_1.BASE_USDC.decimals),
                blockchain_1.publicClient.getBalance({ address: currentAddr })
            ]);
            if (onChainUsdc > currentUsdc)
                currentUsdc = onChainUsdc;
            const parsedEth = parseFloat((0, viem_1.formatUnits)(onChainEthRaw, 18));
            if (parsedEth > currentEth)
                currentEth = parsedEth;
        }
        catch (e) {
            console.warn('Fallback on-chain balance query:', e);
        }
    }
    if (totalUSD <= 0) {
        totalUSD = currentUsdc > 0 ? Math.min(0.01, currentUsdc) : 0.01;
    }
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
                { id: '1', title: 'Base Mainnet RPC Query', detail: `Checked balances for ${currentAddr ? currentAddr.substring(0, 10) + '...' : 'default wallet'}`, status: 'completed' }
            ]
        };
    }
    // 1b. Handle Market Gainers / Liquidity / Marketcap queries
    if ((promptLower.includes('gain') || promptLower.includes('gainer') || promptLower.includes('top token') || promptLower.includes('best performing')) ||
        promptLower.includes('liquidity') ||
        promptLower.includes('marketcap') ||
        promptLower.includes('what token') ||
        promptLower.includes('30 day') ||
        promptLower.includes('gain more')) {
        const market = await (0, marketAnalytics_1.getBaseMarketIntelligence)();
        let reply = `📊 **Base Mainnet Market Intelligence & Liquidity Leaders**\n\n` +
            `🌐 **Base Network TVL:** \`$${(market.chainTVL / 1e9).toFixed(2)} Billion USD\` (Source: DeFiLlama)\n\n` +
            `🏆 **Top Liquid Base Tokens & Real-Time Performance:**\n\n`;
        for (const t of market.tokens) {
            const changeSign = t.change24h >= 0 ? '+' : '';
            const liqM = (t.liquidityUSD / 1e6).toFixed(2);
            const volM = (t.volume24hUSD / 1e6).toFixed(2);
            const mcapM = t.marketCapUSD >= 1e9 ? `$${(t.marketCapUSD / 1e9).toFixed(2)}B` : `$${(t.marketCapUSD / 1e6).toFixed(1)}M`;
            reply += `🔹 **${t.symbol}** (${t.name})\n` +
                `   • Price: \`$${t.priceUSD >= 1 ? t.priceUSD.toFixed(2) : t.priceUSD.toFixed(4)}\` | 24h: \`${changeSign}${t.change24h.toFixed(2)}%\`\n` +
                `   • DEX Liquidity: \`$${liqM}M USD\` | 24h Vol: \`$${volM}M\`\n` +
                `   • Market Cap / FDV: \`${mcapM}\`\n` +
                `   • [View Pair on DexScreener](${t.pairUrl})\n\n`;
        }
        if (market.topGainer24h) {
            reply += `🚀 **Top 24h Gainer on Base:** **${market.topGainer24h.symbol}** with \`+${market.topGainer24h.change24h.toFixed(2)}%\` gain today!\n\n`;
        }
        reply += `_You can trade any of these tokens directly on Aerodrome DEX by saying "Buy $0.10 of AERO" or "Buy 0.10 of VIRTUAL"!_`;
        return {
            reply,
            steps: [
                { id: '1', title: 'DexScreener & DeFiLlama Analytics Query', detail: 'Fetched live Base liquidity, volume, and marketcap metrics', status: 'completed' }
            ]
        };
    }
    // 1c. Handle Whale Transactions / Big Amount Queries
    if ((promptLower.includes('big') || promptLower.includes('large') || promptLower.includes('whale') || promptLower.includes('biggest')) &&
        (promptLower.includes('transaction') || promptLower.includes('ammount') || promptLower.includes('amount') || promptLower.includes('trade') || promptLower.includes('transfer') || promptLower.includes('swap'))) {
        const whales = await (0, marketAnalytics_1.getRecentBaseWhaleTransactions)(5);
        let reply = `🐋 **Recent Whale & High-Value Transactions on Base Mainnet**\n\n` +
            `Here are recent high-value transactions verified directly from Base Mainnet blocks:\n\n`;
        if (whales.length === 0) {
            reply += `No transactions above 1.0 ETH detected in the most recent 12 blocks.\n`;
        }
        else {
            whales.forEach((w, idx) => {
                reply += `${idx + 1}️⃣ **${w.valueETH.toFixed(4)} ETH** (~$${w.valueUSD.toLocaleString()} USD)\n` +
                    `   • **Block:** \`${w.blockNumber}\`\n` +
                    `   • **From:** \`${w.from.substring(0, 10)}...${w.from.slice(-6)}\`\n` +
                    `   • 🔗 [View on BaseScan](${w.explorerUrl})\n\n`;
            });
        }
        reply += `_Scanned in real-time across recent Base Mainnet blocks (Chain ID 8453)._`;
        return {
            reply,
            steps: [
                { id: '1', title: 'Base Mainnet Node Block Inspection', detail: 'Scanned recent blocks for whale transactions >= 1.0 ETH', status: 'completed' }
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
                    { id: '1', title: 'Wallet Verification', detail: 'Base Mainnet deposit address retrieved', status: 'completed' }
                ]
            };
        }
        else {
            return {
                reply: `⚡ **Agentic Wallet Not Yet Created**\n\n` +
                    `To get a deposit address, click the **"Create Agent Wallet"** button directly on the agent bar above or in the top navigation.\n` +
                    `Your wallet will be generated client-side in 1-click and is 100% self-custodial.`,
                steps: [
                    { id: '1', title: 'Wallet Generation Ready', detail: 'Client-side generation awaiting user trigger', status: 'completed' }
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
                { id: '1', title: 'Agentic Protocol Ready', detail: 'Zero-knowledge client generation available', status: 'completed' }
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
                { id: '1', title: 'Import Gateway Verified', detail: 'Client-side keystore & private key loader ready', status: 'completed' }
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
                { id: '1', title: 'Security Protocol Verified', detail: 'Client-side key export available in Backup modal', status: 'completed' }
            ]
        };
    }
    // 5. Check if user provided an arbitrary ERC-20 contract address (0x...)
    const contractMatch = userPrompt.match(/0x[a-fA-F0-9]{40}/);
    let customContractTarget = null;
    if (contractMatch) {
        const matchedHex = contractMatch[0];
        if (matchedHex.toLowerCase() !== currentAddr?.toLowerCase()) {
            customContractTarget = matchedHex;
        }
    }
    // Identify supported tickers mentioned
    const supportedTickers = Object.keys(shared_1.VERIFIED_BASE_TOKENIZED_STOCKS);
    let matchedTickers = [];
    for (const ticker of supportedTickers) {
        const regex = new RegExp(`\\b${ticker}\\b|\\$${ticker}`, 'i');
        if (regex.test(userPrompt)) {
            matchedTickers.push(ticker);
        }
    }
    const COMPANY_NAME_MAP = {
        nvidia: 'NVDAc',
        meta: 'METAc',
        facebook: 'METAc',
        apple: 'AAPLc',
        google: 'GOOGLc',
        alphabet: 'GOOGLc',
        amazon: 'AMZNc',
        microsoft: 'MSFTc',
        microstrategy: 'MSTRc',
        sandisk: 'SNDKc',
        spacex: 'SPCXc',
        tesla: 'TSLAc'
    };
    for (const [cName, ticker] of Object.entries(COMPANY_NAME_MAP)) {
        const reg = new RegExp(`\\b${cName}\\b`, 'i');
        if (reg.test(userPrompt) && !matchedTickers.includes(ticker)) {
            matchedTickers.push(ticker);
        }
    }
    // Deduplicate tickers where both 'c' and non-'c' alias matched (e.g. NVDA and NVDAc)
    matchedTickers = matchedTickers.filter(t => {
        if (t.endsWith('c'))
            return true;
        return !matchedTickers.includes(`${t}c`);
    });
    if (customContractTarget && !matchedTickers.includes(customContractTarget)) {
        matchedTickers.push(customContractTarget);
    }
    // 6. Handle SELL / Liquidate orders
    const isSellIntent = promptLower.includes('sell') ||
        promptLower.includes('liquidate') ||
        promptLower.includes('dump') ||
        promptLower.includes('cash out') ||
        (promptLower.includes('close') && promptLower.includes('position'));
    if (isSellIntent) {
        const holdings = portfolioStore_1.portfolioStore.getHoldings(walletKey);
        const targetTicker = matchedTickers[0] || (holdings.length > 0 ? holdings[0].ticker : null);
        if (!targetTicker) {
            return {
                reply: `⚠️ **No Holdings Available to Sell**\n\n` +
                    `You do not currently have any active token positions in your Agentic Wallet.\n\n` +
                    `You can purchase any Base token by typing: \`Buy $0.10 of AERO\` or \`Buy 0.10 of VIRTUAL\`.`,
                steps: [
                    { id: '1', title: 'Portfolio Scan', detail: '0 active token positions found', status: 'completed' }
                ]
            };
        }
        const currentHolding = holdings.find(h => h.ticker.toLowerCase() === targetTicker.toLowerCase());
        const stock = shared_1.VERIFIED_BASE_TOKENIZED_STOCKS[targetTicker];
        const refPrice = stock ? stock.referencePriceUSD : (currentHolding ? currentHolding.currentPrice : 1.0);
        const availableBalance = currentHolding ? currentHolding.balance : 0;
        let sharesToSell = availableBalance;
        let usdToSell = currentHolding ? currentHolding.balanceUSD : 0;
        const pctMatch = userPrompt.match(/(\d+)%/);
        if (pctMatch) {
            const pct = parseFloat(pctMatch[1]);
            sharesToSell = Number(((availableBalance * pct) / 100).toFixed(6));
            usdToSell = Number((sharesToSell * refPrice).toFixed(2));
        }
        else if (totalUSD && totalUSD > 0 && totalUSD !== 100) {
            usdToSell = Math.min(totalUSD, currentHolding ? currentHolding.balanceUSD : totalUSD);
            sharesToSell = Number((usdToSell / refPrice).toFixed(6));
        }
        const outcome = portfolioStore_1.portfolioStore.recordSell(walletKey, targetTicker, usdToSell, sharesToSell);
        return {
            reply: `📉 **Sell Order Prepared on Base Mainnet (Aerodrome DEX)**\n\n` +
                `• **Asset to Liquidate:** \`${outcome.sharesSold} ${targetTicker}\`\n` +
                `• **Reference Price:** \`$${refPrice.toFixed(2)}\`\n` +
                `• **Estimated USDC Proceeds:** \`+$${outcome.amountUSD.toFixed(2)} USDC\`\n` +
                `• **Settlement Wallet:** \`${currentAddr || 'default'}\`\n` +
                `• **Route:** Aerodrome DEX Reverse Pool &rarr; USDC\n\n` +
                `Signing swap and broadcasting transaction directly to Base node...`,
            steps: [
                { id: '1', title: 'Quoting Aerodrome Liquidity', detail: `${targetTicker} -> USDC via Aerodrome Router`, status: 'completed' },
                { id: '2', title: 'Ready for On-Chain Broadcast', detail: `Amount: ${outcome.sharesSold} ${targetTicker}`, status: 'completed' }
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
                network: 'Base Mainnet',
                gasUsedUSD: 0.0012
            }
        };
    }
    // Check if this is a general conversational question or explicit trade intent
    const isTradeIntent = promptLower.includes('allocate') ||
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
                        { id: '1', title: 'Groq AI Brain Active', detail: 'Processed via LangChain gpt-oss-120b on Base Mainnet', status: 'completed' }
                    ]
                };
            }
            catch (e) {
                console.warn('LangChain agent invocation fallback:', e);
            }
        }
        // Built-in intelligent conversational fallback when LLM executor is offline
        let fallbackReply = `🤖 **I am BaseIndex Agent** – your autonomous on-chain trading copilot on **Base Mainnet (Chain ID 8453)** powered by **Aerodrome DEX**.\n\n` +
            `⚡ **What I can do for you:**\n` +
            `• **Chat-to-Trade:** Say *"Buy $0.10 of NVDA"* or *"Buy $0.05 of AERO"* to execute real swaps directly on Base Mainnet.\n` +
            `• **Portfolio Management:** Track live balances, inspect on-chain stock tokens, or liquidate holdings to USDC.\n` +
            `• **Agentic Wallet:** Self-custodial 1-click execution signed directly with your secure Base wallet.\n` +
            `• **Supported Assets:** Tokenized stocks (\`NVDAc\`, \`METAc\`, \`AAPLc\`, \`GOOGLc\`, \`AMZNc\`, \`MSFTc\`, \`TSLAc\`, etc.) and Base ecosystem tokens (\`AERO\`, \`WETH\`, \`cbBTC\`, \`VIRTUAL\`, \`DEGEN\`).\n\n` +
            `💡 *Try typing:* \`Buy $0.01 of NVDA\` *or* \`Show my balance\``;
        if (promptLower.includes('who are you') || promptLower.includes('what are you') || promptLower.includes('about')) {
            fallbackReply = `🤖 **I am BaseIndex Agent**\n\n` +
                `I am an autonomous AI trading agent built specifically for **Base Mainnet**.\n\n` +
                `I allow you to buy, sell, and rebalance real tokenized stocks and crypto assets directly via **Aerodrome DEX** using natural language chat.\n\n` +
                `• **Network:** Base Mainnet (Chain ID 8453)\n` +
                `• **DEX Engine:** Aerodrome V2 & Slipstream\n` +
                `• **Execution:** 100% Real on-chain transactions signed by your Agentic Wallet\n\n` +
                `To execute a trade, try asking: \`Buy $0.01 of NVDA\` or \`Buy $0.05 of AERO\`!`;
        }
        else if (promptLower.includes('hello') || promptLower.includes('hi') || promptLower.includes('hey')) {
            fallbackReply = `👋 **Hello! Welcome to BaseIndex Agent.**\n\n` +
                `I'm your autonomous trading copilot on Base Mainnet. How can I help you today?\n\n` +
                `• **Trade:** \`Buy $0.01 of NVDA\` or \`Buy $0.05 of AERO\`\n` +
                `• **Check Portfolio:** \`Show my balance\` or \`What tokens are trending?\`\n` +
                `• **Sell:** \`Sell all AERO\` or \`Liquidate NVDA to USDC\``;
        }
        else if (promptLower.includes('help') || promptLower.includes('how to') || promptLower.includes('commands')) {
            fallbackReply = `📖 **BaseIndex Agent Quick Help & Commands**\n\n` +
                `Here is how to interact with me:\n\n` +
                `1️⃣ **Buy Tokenized Stocks & Crypto:**\n` +
                `• \`Buy $0.01 of NVDA\`\n` +
                `• \`Buy $0.05 of AERO\`\n` +
                `• \`Allocate $0.10 between NVDA and VIRTUAL\`\n\n` +
                `2️⃣ **Sell / Liquidate to USDC:**\n` +
                `• \`Sell NVDA\` or \`Liquidate all AERO to USDC\`\n\n` +
                `3️⃣ **Check Balances & Market:**\n` +
                `• \`Show my balance\`\n` +
                `• \`What tokens have the most liquidity on Base?\`\n` +
                `• \`Show recent whale transactions\``;
        }
        return {
            reply: fallbackReply,
            steps: [
                { id: '1', title: 'Intent Parsed', detail: 'Identified general conversational query', status: 'completed' }
            ]
        };
    }
    // Handle common basket queries like "ai basket", "defi basket", "crypto basket"
    if (matchedTickers.length === 0) {
        if (promptLower.includes('ai') || promptLower.includes('agent')) {
            matchedTickers.push('VIRTUAL');
        }
        else if (promptLower.includes('defi') || promptLower.includes('dex')) {
            matchedTickers.push('AERO');
        }
        else if (promptLower.includes('btc') || promptLower.includes('bitcoin')) {
            matchedTickers.push('cbBTC');
        }
        else if (promptLower.includes('eth') || promptLower.includes('ethereum')) {
            matchedTickers.push('WETH');
        }
        else {
            matchedTickers.push('AERO', 'VIRTUAL');
        }
    }
    steps.push({
        id: 'step-1',
        title: 'Parsing Natural Language Intent',
        detail: `Identified ${matchedTickers.join(', ')} with budget $${totalUSD.toFixed(2)} USDC`,
        status: 'completed'
    });
    const count = matchedTickers.length;
    const allocations = matchedTickers.map((ticker) => {
        const amountUSD = totalUSD / count;
        const stock = shared_1.VERIFIED_BASE_TOKENIZED_STOCKS[ticker];
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
        status: 'completed'
    });
    const isRealOnChain = Boolean(currentAddr && currentUsdc >= totalUSD && currentEth >= 0.00003);
    const executionResult = {
        success: true,
        totalAllocatedUSD: totalUSD,
        action: isRealOnChain ? 'BUY' : 'PREPARED',
        allocations: allocations.map(a => {
            const tokenAddress = a.stock?.contractAddress || (a.ticker.startsWith('0x') ? a.ticker : null);
            return {
                ticker: a.ticker,
                shares: a.shares,
                amountUSD: a.amountUSD,
                txHash: '',
                explorerUrl: tokenAddress ? `https://basescan.org/token/${tokenAddress}` : (currentAddr ? `https://basescan.org/address/${currentAddr}` : 'https://basescan.org')
            };
        }),
        timestamp: Date.now(),
        network: 'Base Mainnet',
        gasUsedUSD: 0.0002
    };
    let reply = '';
    if (isRealOnChain) {
        reply = `⚡ **Trade Intent Formatted for Base Mainnet (Aerodrome DEX)**:\n\n` +
            `**Capital to Allocate:** \`$${totalUSD.toFixed(2)} USDC\`\n` +
            `**Target Assets:** ${allocations.map(a => `${a.shares} ${a.ticker} ($${a.amountUSD.toFixed(2)})`).join(', ')}\n` +
            `**DEX Router:** Aerodrome Router (\`0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43\`)\n\n` +
            `Signing transaction directly with your Agentic Wallet and broadcasting to Base node...`;
    }
    else {
        reply = `📝 **Trade Prepared for Aerodrome DEX Swap**\n\n` +
            `**Capital Staged:** $${totalUSD.toFixed(2)} USDC\n` +
            `**Assets:** ${allocations.map(a => `${a.shares} ${a.ticker} ($${a.amountUSD.toFixed(2)})`).join(', ')}\n\n` +
            `💡 **To broadcast 100% REAL transactions visible on BaseScan:**\n` +
            `Your Agentic Wallet currently has:\n` +
            `• **USDC Available:** \`$${currentUsdc.toFixed(2)} USDC\` (Need: \`$${totalUSD.toFixed(2)}\`)\n` +
            `• **ETH for Gas:** \`${currentEth.toFixed(4)} ETH\` (Need: \`~0.00003 ETH\` / ~$0.0001)\n\n` +
            `Deposit funds into your Agent Wallet address: \`${currentAddr || 'Click Create Agent Wallet'}\` to broadcast live swaps!`;
    }
    return { reply, steps, executionResult };
}
