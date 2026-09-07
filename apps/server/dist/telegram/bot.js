"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeTelegramBot = initializeTelegramBot;
const telegraf_1 = require("telegraf");
const config_1 = require("../config");
const portfolioStore_1 = require("../services/portfolioStore");
const formatters_1 = require("./formatters");
const agent_1 = require("../agent/agent");
const shared_1 = require("@baseindex/shared");
const userWalletStore_1 = require("./userWalletStore");
const aerodromeExecution_1 = require("../services/aerodromeExecution");
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const chains_1 = require("viem/chains");
const blockchain_1 = require("../services/blockchain");
let bot = null;
function initializeTelegramBot() {
    if (!config_1.isTelegramConfigured) {
        console.log('📱 Telegram Bot: TELEGRAM_BOT_TOKEN not provided. (Telegram bot interface inactive; web terminal active)');
        return null;
    }
    try {
        bot = new telegraf_1.Telegraf(config_1.config.TELEGRAM_BOT_TOKEN);
        // /start command
        bot.start(async (ctx) => {
            const welcome = `🤖 *Welcome to BaseIndex Agent!*\n\n` +
                `Your autonomous Chat-to-Trade Crypto & Stock Portfolio Builder on *Base Mainnet* (Chain ID 8453).\n\n` +
                `💼 *Agentic Smart Wallet:*\n` +
                `• /wallet - View your Base deposit address & live balances\n` +
                `• /createwallet - Generate a 1-click autonomous Base wallet\n` +
                `• /import <key> - Import existing funded wallet (e.g. from Web App)\n` +
                `• /backup - Securely reveal private key & export JSON file\n` +
                `• /withdraw <amount> <address> - Withdraw funds to your main wallet\n\n` +
                `📊 *Trading & Portfolio:*\n` +
                `• /portfolio - View your current token allocations\n` +
                `• /help - Usage guide and supported assets\n\n` +
                `*Trade naturally on Aerodrome DEX:*\n` +
                `_"Buy $0.10 of AERO"_\n` +
                `_"Buy 0.10 of VIRTUAL"_\n` +
                `_"Allocate $10 across 60% AERO and 40% WETH"_`;
            try {
                await ctx.replyWithMarkdown(welcome, telegraf_1.Markup.inlineKeyboard([
                    [telegraf_1.Markup.button.callback('💳 My Wallet', 'btn_wallet'), telegraf_1.Markup.button.callback('📊 My Portfolio', 'btn_portfolio')],
                    [telegraf_1.Markup.button.url('🌐 Open Web App', 'https://baseindex-agent.vercel.app')]
                ]));
            }
            catch (err) {
                console.error('Error sending /start reply:', err);
                await ctx.reply(welcome.replace(/[*_`]/g, ''));
            }
        });
        // Global bot error handler to keep polling resilient
        bot.catch((err, ctx) => {
            console.error(`Telegram Bot error on update ${ctx.updateType}:`, err?.message || err);
        });
        // /wallet command
        bot.command('wallet', async (ctx) => {
            const userId = `tg_${ctx.from.id}`;
            let wallet = userWalletStore_1.telegramWalletStore.getWallet(userId);
            if (!wallet) {
                await ctx.replyWithMarkdown(`⚡ *No Agentic Wallet Linked Yet*\n\n` +
                    `You can generate a new 1-click autonomous wallet or import your existing funded key from the Web App.\n\n` +
                    `• Click */createwallet* to generate a fresh Base wallet\n` +
                    `• Or send */import <your_private_key>* to link your funded wallet`, telegraf_1.Markup.inlineKeyboard([
                    [telegraf_1.Markup.button.callback('✨ Create Wallet Now', 'btn_create_wallet')]
                ]));
                return;
            }
            await ctx.sendChatAction('typing');
            const scan = await (0, blockchain_1.scanWalletLiveHoldings)(wallet.address);
            const explorerLink = `${shared_1.BASE_EXPLORER_URL}/address/${wallet.address}`;
            let walletMsg = `💼 *Your BaseIndex Wallet & Holdings*\n\n` +
                `• *Network:* Base Mainnet (Chain ID 8453)\n` +
                `• *Deposit Address:*\n\`${wallet.address}\`\n` +
                `• *Total Estimated Value:* ~$${scan.totalUSD.toFixed(2)} USD\n\n` +
                `💰 *Every Token in Your Wallet (Exact Live Balances):*\n`;
            for (const h of scan.holdings) {
                const displayBal = h.formattedBalance || (h.balance < 0.0001 ? h.balance.toFixed(8) : h.balance.toFixed(4));
                const valUSD = (h.balanceUSD || 0).toFixed(2);
                walletMsg += `• *${h.ticker}:* \`${displayBal} ${h.ticker}\` ($${valUSD})\n`;
            }
            walletMsg += `\n🔍 [View on BaseScan](${explorerLink})\n\n` +
                `_Minimum micro-amounts & dust are fully tracked with up to 8-decimal precision!_`;
            await ctx.replyWithMarkdown(walletMsg, telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('🛡️ Backup Key', 'btn_backup'), telegraf_1.Markup.button.callback('📤 Withdraw', 'btn_withdraw_info')],
                [telegraf_1.Markup.button.callback('🔄 Refresh Balances', 'btn_wallet'), telegraf_1.Markup.button.callback('📊 Full Portfolio', 'btn_portfolio')]
            ]));
        });
        // /createwallet command
        bot.command('createwallet', async (ctx) => {
            const userId = `tg_${ctx.from.id}`;
            const wallet = userWalletStore_1.telegramWalletStore.createWallet(userId);
            await ctx.replyWithMarkdown(`✨ *Agentic Trading Wallet Generated!*\n\n` +
                `• *Base Deposit Address:*\n\`${wallet.address}\`\n\n` +
                `⚠️ *SECURITY NOTICE:*\n` +
                `Your wallet is 100% self-custodial. Type */backup* right now to download your Keystore backup JSON and store your private key securely.\n\n` +
                `To start trading, deposit a small amount of Base USDC and ETH (e.g. $1-$5 USDC + 0.0005 ETH).`, telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('🛡️ Backup Key Now', 'btn_backup')],
                [telegraf_1.Markup.button.callback('💳 Check Balances', 'btn_wallet')]
            ]));
        });
        // /import command (SENSITIVE TASK)
        bot.command('import', async (ctx) => {
            const userId = `tg_${ctx.from.id}`;
            const text = ctx.message.text.trim();
            const parts = text.split(/\s+/);
            // Immediately delete user's message containing private key from chat history for sensitivity
            try {
                await ctx.deleteMessage();
            }
            catch (e) {
                // ignore
            }
            if (parts.length < 2) {
                await ctx.replyWithMarkdown(`🔑 *How to Import Your Private Key:*\n\n` +
                    `Send: \`/import <your_64_character_private_key>\`\n` +
                    `Or send: \`/import <pasted_json_keystore>\`\n\n` +
                    `🛡️ *Privacy Protection:* The bot instantly deletes your message from Telegram chat so your key is never stored in chat logs.`);
                return;
            }
            const rawKey = parts.slice(1).join(' ');
            try {
                const wallet = userWalletStore_1.telegramWalletStore.importWallet(userId, rawKey);
                const balances = await userWalletStore_1.telegramWalletStore.getBalances(wallet.address);
                await ctx.replyWithMarkdown(`✅ *Agentic Wallet Imported Successfully!*\n\n` +
                    `• *Address:* \`${wallet.address}\`\n` +
                    `• *USDC Balance:* \`$${balances.usdc.toFixed(2)} USDC\`\n` +
                    `• *ETH Balance:* \`${balances.eth.toFixed(4)} ETH\`\n` +
                    `• *Network:* Base Mainnet (8453)\n\n` +
                    `Your wallet is ready! You can now execute live swaps by saying:\n` +
                    `_"Buy $0.10 of AERO"_`, telegraf_1.Markup.inlineKeyboard([
                    [telegraf_1.Markup.button.callback('💳 View Wallet & Balances', 'btn_wallet')]
                ]));
            }
            catch (err) {
                await ctx.reply(`❌ Import failed: ${err?.message || 'Invalid key format. Expected 64-character hex string (0x...).'}`);
            }
        });
        // Support direct JSON file upload
        bot.on('document', async (ctx) => {
            const doc = ctx.message.document;
            if (!doc || !doc.file_name?.toLowerCase().endsWith('.json')) {
                return;
            }
            try {
                await ctx.deleteMessage();
            }
            catch (e) { }
            try {
                await ctx.sendChatAction('typing');
                const fileLink = await ctx.telegram.getFileLink(doc.file_id);
                const res = await fetch(fileLink.href);
                const text = await res.text();
                const userId = `tg_${ctx.from.id}`;
                const wallet = userWalletStore_1.telegramWalletStore.importWallet(userId, text);
                const balances = await userWalletStore_1.telegramWalletStore.getBalances(wallet.address);
                await ctx.replyWithMarkdown(`✅ *Agentic Keystore JSON Imported Successfully!*\n\n` +
                    `• *Address:* \`${wallet.address}\`\n` +
                    `• *USDC Balance:* \`$${balances.usdc.toFixed(2)} USDC\`\n` +
                    `• *ETH Balance:* \`${balances.eth.toFixed(4)} ETH\`\n\n` +
                    `🛡️ *Security Notice:* Uploaded file parsed and removed from chat logs.`, telegraf_1.Markup.inlineKeyboard([
                    [telegraf_1.Markup.button.callback('💳 View Wallet & Balances', 'btn_wallet')]
                ]));
            }
            catch (err) {
                await ctx.reply(`❌ Could not import JSON file: ${err?.message || 'Invalid format.'}`);
            }
        });
        // /backup command (SENSITIVE TASK)
        bot.command('backup', async (ctx) => {
            const userId = `tg_${ctx.from.id}`;
            const wallet = userWalletStore_1.telegramWalletStore.getWallet(userId);
            if (!wallet) {
                await ctx.reply('No wallet found. Use /createwallet or /import first.');
                return;
            }
            const keyWarning = `🔐 *SENSITIVE: Agentic Wallet Private Key*\n\n` +
                `\`${wallet.privateKey}\`\n\n` +
                `• *Public Address:* \`${wallet.address}\`\n` +
                `• *Network:* Base Mainnet (Chain ID 8453)\n\n` +
                `⚠️ *SECURITY NOTICE:*\n` +
                `1. Copy this private key and save it securely in a password manager.\n` +
                `2. You can import this key into MetaMask or Coinbase Wallet anytime.\n` +
                `3. *Delete this message once saved.* Never share this key with anyone!`;
            await ctx.replyWithMarkdown(keyWarning);
            try {
                const jsonContent = userWalletStore_1.telegramWalletStore.generateBackupJson(wallet);
                const buffer = Buffer.from(jsonContent, 'utf-8');
                await ctx.replyWithDocument({
                    source: buffer,
                    filename: `baseindex-agentic-wallet-${wallet.address.substring(0, 8)}.json`
                }, {
                    caption: '📁 Encrypted Keystore Backup JSON (Store offline)'
                });
            }
            catch (e) {
                console.warn('Could not send JSON backup document:', e);
            }
        });
        // /withdraw command
        bot.command('withdraw', async (ctx) => {
            const userId = `tg_${ctx.from.id}`;
            const wallet = userWalletStore_1.telegramWalletStore.getWallet(userId);
            if (!wallet) {
                await ctx.reply('No wallet found. Use /createwallet or /import first.');
                return;
            }
            const text = ctx.message.text.trim();
            const parts = text.split(/\s+/).filter(Boolean);
            if (parts.length < 3) {
                await ctx.replyWithMarkdown(`📤 *How to Withdraw Funds:*\n\n` +
                    `• *Withdraw ETH:*\n` +
                    `\`/withdraw <amount> ETH <destination_address>\`\n` +
                    `*Example:* \`/withdraw 0.001 ETH 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045\`\n` +
                    `*Withdraw All ETH:* \`/withdraw all ETH 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045\`\n\n` +
                    `• *Withdraw USDC:*\n` +
                    `\`/withdraw <amount> USDC <destination_address>\`\n` +
                    `*Example:* \`/withdraw 5 USDC 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045\`\n\n` +
                    `_Funds will be broadcasted directly from your wallet on Base Mainnet._`);
                return;
            }
            // Find 0x address
            const toAddress = parts.find(p => p.startsWith('0x') && p.length === 42);
            if (!toAddress) {
                await ctx.reply('Please provide a valid 42-character Base destination address (0x...).');
                return;
            }
            // Detect asset: ETH or USDC (default to ETH if 'eth' or fractional < 0.05, else USDC)
            const isExplicitETH = parts.some(p => p.toUpperCase() === 'ETH' || p.toUpperCase() === 'WETH');
            const isExplicitUSDC = parts.some(p => p.toUpperCase() === 'USDC' || p.toUpperCase() === 'USD');
            const isAll = parts.some(p => p.toLowerCase() === 'all' || p.toLowerCase() === 'max' || p.toLowerCase() === 'everything');
            const numPart = parts.find(p => !p.startsWith('0x') && !['ETH', 'USDC', 'WETH', 'USD', 'ALL', 'MAX'].includes(p.toUpperCase()) && !isNaN(parseFloat(p)));
            const parsedAmount = numPart ? parseFloat(numPart) : 0;
            const isETH = isExplicitETH || (!isExplicitUSDC && parsedAmount > 0 && parsedAmount < 0.05);
            await ctx.sendChatAction('typing');
            try {
                const account = (0, accounts_1.privateKeyToAccount)(wallet.privateKey);
                const walletClient = (0, viem_1.createWalletClient)({
                    account,
                    chain: chains_1.base,
                    transport: (0, viem_1.fallback)([
                        (0, viem_1.http)('https://base.llamarpc.com'),
                        (0, viem_1.http)('https://1rpc.io/base'),
                        (0, viem_1.http)('https://mainnet.base.org')
                    ])
                });
                if (isETH) {
                    const balanceRaw = await blockchain_1.publicClient.getBalance({ address: account.address });
                    const balanceETH = parseFloat((0, viem_1.formatUnits)(balanceRaw, 18));
                    if (balanceETH <= 0.00003) {
                        await ctx.reply(`❌ Insufficient ETH balance to withdraw. You currently have ${balanceETH.toFixed(5)} ETH.`);
                        return;
                    }
                    let sendValue;
                    let displayAmount;
                    if (isAll || parsedAmount <= 0 || parsedAmount >= balanceETH) {
                        const gasPrice = await blockchain_1.publicClient.getGasPrice();
                        const estimatedGas = 21000n * gasPrice * 2n;
                        if (balanceRaw <= estimatedGas) {
                            await ctx.reply(`❌ ETH balance (${balanceETH.toFixed(5)} ETH) is too small to cover the gas fee.`);
                            return;
                        }
                        sendValue = balanceRaw - estimatedGas;
                        displayAmount = parseFloat((0, viem_1.formatUnits)(sendValue, 18));
                    }
                    else {
                        sendValue = (0, viem_1.parseUnits)(parsedAmount.toFixed(6), 18);
                        displayAmount = parsedAmount;
                    }
                    const txHash = await walletClient.sendTransaction({
                        to: toAddress,
                        value: sendValue
                    });
                    await blockchain_1.publicClient.waitForTransactionReceipt({ hash: txHash });
                    const explorerUrl = `https://basescan.org/tx/${txHash}`;
                    await ctx.replyWithMarkdown(`📤 *ETH Withdrawal Confirmed on Base Mainnet!*\n\n` +
                        `• *Amount Sent:* \`${displayAmount.toFixed(6)} ETH\`\n` +
                        `• *Destination:* \`${toAddress}\`\n` +
                        `• *Status:* Confirmed ✅\n` +
                        `• *BaseScan Explorer:* [View Confirmed Transaction](${explorerUrl})`);
                }
                else {
                    // USDC Withdrawal
                    const usdcBalance = await (0, blockchain_1.getOnChainTokenBalance)(shared_1.BASE_USDC.contractAddress, account.address, shared_1.BASE_USDC.decimals);
                    if (usdcBalance <= 0) {
                        await ctx.reply(`❌ You have $0.00 USDC in your wallet to withdraw.`);
                        return;
                    }
                    const sendAmount = (isAll || parsedAmount <= 0 || parsedAmount >= usdcBalance) ? usdcBalance : parsedAmount;
                    const amountRaw = (0, viem_1.parseUnits)(sendAmount.toFixed(6), shared_1.BASE_USDC.decimals);
                    const txHash = await walletClient.writeContract({
                        address: shared_1.BASE_USDC.contractAddress,
                        abi: shared_1.ERC20_ABI,
                        functionName: 'transfer',
                        args: [toAddress, amountRaw]
                    });
                    await blockchain_1.publicClient.waitForTransactionReceipt({ hash: txHash });
                    const explorerUrl = `https://basescan.org/tx/${txHash}`;
                    await ctx.replyWithMarkdown(`📤 *USDC Withdrawal Confirmed on Base Mainnet!*\n\n` +
                        `• *Amount Sent:* \`$${sendAmount.toFixed(2)} USDC\`\n` +
                        `• *Destination:* \`${toAddress}\`\n` +
                        `• *Status:* Confirmed ✅\n` +
                        `• *BaseScan Explorer:* [View Confirmed Transaction](${explorerUrl})`);
                }
            }
            catch (err) {
                await ctx.reply(`❌ Withdrawal failed: ${err?.message || 'Transaction error'}`);
            }
        });
        // /deposit command
        bot.command('deposit', async (ctx) => {
            const userId = `tg_${ctx.from.id}`;
            const wallet = userWalletStore_1.telegramWalletStore.getWallet(userId);
            if (!wallet) {
                await ctx.reply('No wallet found. Use /createwallet first.');
                return;
            }
            await ctx.replyWithMarkdown(`📥 *Deposit USDC on Base Mainnet*\n\n` +
                `Send Base USDC (and a tiny fraction of ETH for gas) to:\n` +
                `\`${wallet.address}\`\n\n` +
                `Your agent will detect funds immediately!`, telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('🔄 Check Balance', 'btn_wallet')]
            ]));
        });
        // Inline button callbacks
        bot.action('btn_wallet', async (ctx) => {
            await ctx.answerCbQuery();
            const userId = `tg_${ctx.from.id}`;
            const wallet = userWalletStore_1.telegramWalletStore.getWallet(userId);
            if (!wallet) {
                await ctx.reply('No wallet linked. Send /createwallet or /import <key>.');
                return;
            }
            const scan = await (0, blockchain_1.scanWalletLiveHoldings)(wallet.address);
            let msg = `💼 *Wallet Status & Holdings (Base Mainnet):*\n` +
                `• *Address:* \`${wallet.address}\`\n` +
                `• *Total Value:* ~$${scan.totalUSD.toFixed(2)} USD\n\n` +
                `💰 *Token Balances (Exact Precision):*\n`;
            for (const h of scan.holdings) {
                const displayBal = h.formattedBalance || (h.balance < 0.0001 ? h.balance.toFixed(8) : h.balance.toFixed(4));
                msg += `• *${h.ticker}:* \`${displayBal} ${h.ticker}\` ($${h.balanceUSD.toFixed(2)})\n`;
            }
            msg += `\n[View on BaseScan](https://basescan.org/address/${wallet.address})`;
            await ctx.replyWithMarkdown(msg);
        });
        bot.action('btn_create_wallet', async (ctx) => {
            await ctx.answerCbQuery();
            const userId = `tg_${ctx.from.id}`;
            const wallet = userWalletStore_1.telegramWalletStore.createWallet(userId);
            await ctx.replyWithMarkdown(`✨ *Wallet Generated!*\nAddress: \`${wallet.address}\`\n\nRun /backup immediately to save your key.`);
        });
        bot.action('btn_backup', async (ctx) => {
            await ctx.answerCbQuery();
            const userId = `tg_${ctx.from.id}`;
            const wallet = userWalletStore_1.telegramWalletStore.getWallet(userId);
            if (!wallet) {
                await ctx.reply('No wallet linked.');
                return;
            }
            await ctx.replyWithMarkdown(`🔐 *Private Key:*\n\`${wallet.privateKey}\`\n\n⚠️ *Save offline & delete this message for safety.*`);
        });
        bot.action('btn_withdraw_info', async (ctx) => {
            await ctx.answerCbQuery();
            await ctx.replyWithMarkdown(`📤 *Withdrawal:*\nType: \`/withdraw <amount> ETH <destination_address>\` or \`/withdraw <amount> USDC <destination_address>\``);
        });
        bot.action('btn_portfolio', async (ctx) => {
            await ctx.answerCbQuery();
            const userId = `tg_${ctx.from.id}`;
            const wallet = userWalletStore_1.telegramWalletStore.getWallet(userId);
            if (wallet) {
                const scan = await (0, blockchain_1.scanWalletLiveHoldings)(wallet.address);
                const message = (0, formatters_1.formatPortfolioTelegram)(scan.holdings, scan.totalUSD, wallet.address);
                await ctx.replyWithMarkdown(message, { link_preview_options: { is_disabled: true } });
                return;
            }
            const holdings = portfolioStore_1.portfolioStore.getHoldings(userId);
            const totalUSD = portfolioStore_1.portfolioStore.getTotalValueUSD(userId);
            const message = (0, formatters_1.formatPortfolioTelegram)(holdings, totalUSD);
            await ctx.replyWithMarkdown(message, { link_preview_options: { is_disabled: true } });
        });
        // /portfolio command
        bot.command('portfolio', async (ctx) => {
            const userId = `tg_${ctx.from.id}`;
            const wallet = userWalletStore_1.telegramWalletStore.getWallet(userId);
            if (wallet) {
                await ctx.sendChatAction('typing');
                const scan = await (0, blockchain_1.scanWalletLiveHoldings)(wallet.address);
                const message = (0, formatters_1.formatPortfolioTelegram)(scan.holdings, scan.totalUSD, wallet.address);
                await ctx.replyWithMarkdown(message, { link_preview_options: { is_disabled: true } });
                return;
            }
            const holdings = portfolioStore_1.portfolioStore.getHoldings(userId);
            const totalUSD = portfolioStore_1.portfolioStore.getTotalValueUSD(userId);
            const message = (0, formatters_1.formatPortfolioTelegram)(holdings, totalUSD);
            await ctx.replyWithMarkdown(message, { link_preview_options: { is_disabled: true } });
        });
        // /help command
        bot.command('help', async (ctx) => {
            const help = `📈 *BaseIndex Agent Telegram Guide*\n\n` +
                `*Wallet Commands:*\n` +
                `• /wallet - Check address & live balances\n` +
                `• /createwallet - Create unique agentic wallet\n` +
                `• /import <key> - Import private key or Keystore JSON\n` +
                `• /backup - Reveal private key & download JSON backup\n` +
                `• /withdraw <amount> <address> - Withdraw funds to personal wallet\n` +
                `• /deposit - View deposit address & instructions\n\n` +
                `*Real On-Chain DEX Trading Commands:*\n` +
                `• /portfolio - View your current holdings\n` +
                `• \`Buy $0.10 of AERO\`\n` +
                `• \`Buy 0.10 of VIRTUAL\`\n` +
                `• \`Buy $0.50 of 0x940181a94A35A4569E4529A3CDfB74e38FD98631\`\n` +
                `• \`Allocate $10 across 50% AERO and 50% WETH\`\n\n` +
                `*Supported Base Tokens:*\n` +
                `AERO, WETH, cbBTC, VIRTUAL, DEGEN, USDC & any custom ERC-20 contract with Aerodrome liquidity!`;
            await ctx.replyWithMarkdown(help);
        });
        // Natural language trading and conversational processing
        bot.on('text', async (ctx) => {
            const text = ctx.message.text.trim();
            if (text.startsWith('/'))
                return;
            const userId = `tg_${ctx.from.id}`;
            const userWallet = userWalletStore_1.telegramWalletStore.getWallet(userId);
            const textLower = text.toLowerCase();
            // Check if this is a sell / liquidate / swap to ETH or USDC intent
            const isSellIntent = textLower.includes('sell') ||
                textLower.includes('liquidate') ||
                textLower.includes('dump') ||
                textLower.includes('cash out');
            if (isSellIntent) {
                if (!userWallet) {
                    await ctx.replyWithMarkdown(`⚡ *No Active Agentic Wallet Linked Yet*\n\n` +
                        `To sell tokens on Base Mainnet, you need to link your wallet.\n\n` +
                        `Send: \`/import <your_private_key>\` to link your funded wallet.`);
                    return;
                }
                const supportedTokens = ['AERO', 'WETH', 'CBBTC', 'VIRTUAL', 'DEGEN', 'NVDA', 'TSLA', 'SPY'];
                let fromToken = 'AERO';
                const contractMatch = text.match(/0x[a-fA-F0-9]{40}/);
                if (contractMatch && contractMatch[0].toLowerCase() !== userWallet.address.toLowerCase()) {
                    fromToken = contractMatch[0];
                }
                else {
                    for (const tok of supportedTokens) {
                        const re = new RegExp(`\\b${tok}\\b|\\$${tok}`, 'i');
                        if (re.test(text)) {
                            fromToken = tok;
                            break;
                        }
                    }
                }
                let toToken = 'ETH';
                if (textLower.includes('to usdc') || textLower.includes('into usdc') || textLower.includes('for usdc') || textLower.includes('to usd')) {
                    toToken = 'USDC';
                }
                else if (textLower.includes('to eth') || textLower.includes('for eth') || textLower.includes('into eth')) {
                    toToken = 'ETH';
                }
                else if (textLower.includes('to weth') || textLower.includes('for weth')) {
                    toToken = 'WETH';
                }
                const isAll = textLower.includes('all') || textLower.includes('100%') || textLower.includes('everything');
                const amountMatch = text.match(/(?:\$|\b)(\d+(?:\.\d+)?|\.\d+)/);
                const amountToSell = (!isAll && amountMatch) ? parseFloat(amountMatch[1]) : undefined;
                await ctx.replyWithMarkdown(`⏳ *Executing 100% Real Swap on Base Mainnet (Aerodrome DEX)...*\n\n` +
                    `• *Action:* Sell \`${fromToken}\` &rarr; \`${toToken}\`\n` +
                    `• *Wallet:* \`${userWallet.address}\`\n` +
                    `• *Router:* Aerodrome Router (\`0xcF77...4E43\`)`);
                try {
                    const result = await (0, aerodromeExecution_1.executeServerSellOrSwapOnAerodrome)({
                        privateKey: userWallet.privateKey,
                        fromTokenOrSymbol: fromToken,
                        toTokenOrSymbol: toToken,
                        amountToSell,
                        isAll,
                        userId
                    });
                    const sellCard = `⚡ *Base Mainnet On-Chain Swap Confirmed!*\n\n` +
                        `✅ *Liquidated:* \`${result.amountSold.toFixed(6)} ${result.fromSymbol}\`\n` +
                        `💰 *Received:* \`${result.amountReceived.toFixed(6)} ${result.toSymbol}\`\n` +
                        `⛽ *Gas Incurred:* \`~$${result.gasUsedUSD.toFixed(4)} USD\`\n\n` +
                        `🔍 *BaseScan Explorer:*\n[View Confirmed Transaction](${result.explorerUrl})\n\n` +
                        `_Funds have been credited directly to your Base deposit address!_`;
                    await ctx.replyWithMarkdown(sellCard, { link_preview_options: { is_disabled: false } });
                    return;
                }
                catch (sellErr) {
                    console.error('Server Aerodrome sell error:', sellErr);
                    await ctx.replyWithMarkdown(`❌ *On-Chain Swap Failed:*\n${sellErr?.message || 'Transaction error on Base node'}`);
                    return;
                }
            }
            // Check if this is a buy/trade intent
            const isTradeIntent = textLower.includes('buy') ||
                textLower.includes('trade') ||
                textLower.includes('swap') ||
                textLower.includes('allocate') ||
                textLower.includes('invest') ||
                text.includes('$');
            if (isTradeIntent) {
                if (!userWallet) {
                    await ctx.replyWithMarkdown(`⚡ *No Active Agentic Wallet Linked Yet*\n\n` +
                        `To execute 100% REAL trades on Base Mainnet, you need an Agentic Wallet with USDC & ETH.\n\n` +
                        `1️⃣ **Use your existing funded wallet from the Web App:**\n` +
                        `Send: \`/import <your_private_key>\`\n` +
                        `_(Your message is instantly deleted from chat for security!)_\n\n` +
                        `2️⃣ **Or generate a fresh wallet:**\n` +
                        `Click /createwallet and send USDC + ETH to your new address.`, telegraf_1.Markup.inlineKeyboard([
                        [telegraf_1.Markup.button.callback('✨ Create Wallet Now', 'btn_create_wallet')]
                    ]));
                    return;
                }
                // Fetch live balances
                const balances = await userWalletStore_1.telegramWalletStore.getBalances(userWallet.address);
                // Parse USD amount
                const amountMatch = text.match(/(?:\$|\b)(\d+(?:\.\d+)?|\.\d+)/);
                const amountUSD = amountMatch ? parseFloat(amountMatch[1]) : 0.10;
                // Parse target token
                const supportedTokens = ['AERO', 'WETH', 'CBBTC', 'VIRTUAL', 'DEGEN', 'NVDA', 'TSLA', 'SPY'];
                let targetToken = 'AERO';
                // Check for 0x contract address
                const contractMatch = text.match(/0x[a-fA-F0-9]{40}/);
                if (contractMatch && contractMatch[0].toLowerCase() !== userWallet.address.toLowerCase()) {
                    targetToken = contractMatch[0];
                }
                else {
                    for (const tok of supportedTokens) {
                        const re = new RegExp(`\\b${tok}\\b|\\$${tok}`, 'i');
                        if (re.test(text)) {
                            targetToken = tok;
                            break;
                        }
                    }
                }
                // Validate balances
                if (balances.usdc < amountUSD) {
                    await ctx.replyWithMarkdown(`❌ *Insufficient USDC Balance on Base Mainnet*\n\n` +
                        `• *Your Wallet:* \`${userWallet.address}\`\n` +
                        `• *Required:* \`$${amountUSD.toFixed(2)} USDC\`\n` +
                        `• *Available:* \`$${balances.usdc.toFixed(2)} USDC\`\n\n` +
                        `💰 *Deposit USDC:* Send Base USDC to your address above to execute real swaps.`, telegraf_1.Markup.inlineKeyboard([
                        [telegraf_1.Markup.button.callback('🔄 Refresh Balance', 'btn_wallet')]
                    ]));
                    return;
                }
                if (balances.eth < 0.00003) {
                    await ctx.replyWithMarkdown(`❌ *Insufficient ETH for Gas on Base Mainnet*\n\n` +
                        `• *Your Wallet:* \`${userWallet.address}\`\n` +
                        `• *ETH Balance:* \`${balances.eth.toFixed(5)} ETH\`\n` +
                        `• *Required:* \`~0.0001 ETH\` (~$0.001 USD)\n\n` +
                        `⛽ *Deposit ETH:* Send a small fraction of Base ETH for transaction gas.`);
                    return;
                }
                // Execute REAL On-Chain DEX Swap
                const statusMsg = await ctx.replyWithMarkdown(`⏳ *Executing 100% Real Swap on Base Mainnet (Aerodrome DEX)...*\n\n` +
                    `• *Swapping:* \`$${amountUSD.toFixed(2)} USDC\` &rarr; \`${targetToken}\`\n` +
                    `• *Signing with Wallet:* \`${userWallet.address}\`\n` +
                    `• *Router:* Aerodrome Router (\`0xcF77...4E43\`)`);
                try {
                    const result = await (0, aerodromeExecution_1.executeServerBuyOnAerodrome)({
                        privateKey: userWallet.privateKey,
                        targetTokenOrSymbol: targetToken,
                        amountUSD,
                        userId
                    });
                    const successCard = `⚡ *Base Mainnet DEX Swap Confirmed On-Chain!*\n\n` +
                        `✅ *Delivered:* \`${result.amountOutTokens.toFixed(6)} ${result.symbol}\`\n` +
                        `💰 *Swapped:* \`$${result.amountInUSD.toFixed(2)} USDC\`\n` +
                        `⛽ *Gas Incurred:* \`~$${result.gasUsedUSD.toFixed(4)} USD\`\n\n` +
                        `🔍 *BaseScan Explorer:*\n[View On-Chain Receipt](${result.explorerUrl})\n\n` +
                        `_Tokens are now in your wallet address! Use /portfolio to see your updated holdings._`;
                    await ctx.replyWithMarkdown(successCard, { link_preview_options: { is_disabled: false } });
                    return;
                }
                catch (swapErr) {
                    console.error('Server Aerodrome swap error:', swapErr);
                    await ctx.replyWithMarkdown(`❌ *On-Chain Execution Failed:*\n${swapErr?.message || 'Transaction error on Base node'}`);
                    return;
                }
            }
            // Fallback to conversational natural language assistant
            const balances = userWallet ? await userWalletStore_1.telegramWalletStore.getBalances(userWallet.address) : { usdc: 0, eth: 0 };
            const walletMeta = userWallet
                ? { address: userWallet.address, usdcBalance: balances.usdc, ethBalance: balances.eth }
                : undefined;
            try {
                const result = await (0, agent_1.processNaturalLanguageIntent)(text, userWallet?.address || userId, walletMeta);
                await ctx.replyWithMarkdown(result.reply, { link_preview_options: { is_disabled: true } });
            }
            catch (err) {
                await ctx.reply(`❌ Processing error: ${err?.message || 'Unknown error'}`);
            }
        });
        bot.launch(() => {
            console.log('🚀 Telegram Trading Bot is LIVE and listening on Base Mainnet (@CryptoStocksTrd_bot).');
        }).catch((err) => {
            console.warn('Could not launch Telegram bot:', err);
        });
        // Graceful stop
        process.once('SIGINT', () => bot?.stop('SIGINT'));
        process.once('SIGTERM', () => bot?.stop('SIGTERM'));
        return bot;
    }
    catch (err) {
        console.warn('Error creating Telegram bot instance:', err);
        return null;
    }
}
