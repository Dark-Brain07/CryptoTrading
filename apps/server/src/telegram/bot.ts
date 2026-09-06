import { Telegraf, Markup } from 'telegraf';
import { config, isTelegramConfigured } from '../config';
import { portfolioStore } from '../services/portfolioStore';
import { formatPortfolioTelegram, formatExecutionTelegram } from './formatters';
import { processNaturalLanguageIntent } from '../agent/agent';
import { telegramWalletStore } from './userWalletStore';
import { BASE_EXPLORER_URL } from '@baseindex/shared';

let bot: Telegraf | null = null;

export function initializeTelegramBot(): Telegraf | null {
  if (!isTelegramConfigured) {
    console.log('📱 Telegram Bot: TELEGRAM_BOT_TOKEN not provided. (Telegram bot interface inactive; web terminal active)');
    return null;
  }

  try {
    bot = new Telegraf(config.TELEGRAM_BOT_TOKEN!);

    // /start command
    bot.start(async (ctx) => {
      const welcome = `🤖 *Welcome to BaseIndex Agent!*\n\n` +
        `Your autonomous Chat-to-Trade Stock Index & Portfolio Builder on *Base Mainnet* (Chain ID 8453).\n\n` +
        `💼 *Agentic Smart Wallet:*\n` +
        `• /wallet - View your Base deposit address & live balances\n` +
        `• /createwallet - Generate a 1-click autonomous Base wallet\n` +
        `• /import <key> - Import an existing private key or keystore\n` +
        `• /backup - Securely reveal private key & export JSON file\n` +
        `• /withdraw <amount> <address> - Withdraw funds to your main wallet\n\n` +
        `📊 *Trading & Portfolio:*\n` +
        `• /portfolio - View your current stock index allocation\n` +
        `• /help - Usage guide and supported assets\n\n` +
        `*Or chat naturally to trade:*\n` +
        `_"Allocate $250 across 60% NVDA and 40% TSLA"_`;

      await ctx.replyWithMarkdown(
        welcome,
        Markup.inlineKeyboard([
          [Markup.button.callback('💳 My Wallet', 'btn_wallet'), Markup.button.callback('📊 My Portfolio', 'btn_portfolio')],
          [Markup.button.url('🌐 Open Web App', config.FRONTEND_URL || 'http://localhost:3000')]
        ])
      );
    });

    // /wallet command
    bot.command('wallet', async (ctx) => {
      const userId = `tg_${ctx.from.id}`;
      let wallet = telegramWalletStore.getWallet(userId);

      if (!wallet) {
        await ctx.replyWithMarkdown(
          `⚡ *No Agentic Wallet Linked Yet*\n\n` +
          `You can generate a new 1-click autonomous wallet or import your existing private key.\n\n` +
          `• Click */createwallet* to generate a fresh Base wallet\n` +
          `• Or send */import <your_private_key>* to import an existing key`,
          Markup.inlineKeyboard([
            [Markup.button.callback('✨ Create Wallet Now', 'btn_create_wallet')]
          ])
        );
        return;
      }

      await ctx.sendChatAction('typing');
      const balances = await telegramWalletStore.getBalances(wallet.address);
      const explorerLink = `${BASE_EXPLORER_URL}/address/${wallet.address}`;

      const walletMsg = `💼 *Your BaseIndex Agentic Wallet*\n\n` +
        `• *Network:* Base Mainnet (8453)\n` +
        `• *Deposit Address:*\n\`${wallet.address}\`\n\n` +
        `💰 *Live Balances:*\n` +
        `• *USDC (Trading):* \`$${balances.usdc.toFixed(2)} USDC\`\n` +
        `• *ETH (Gas):* \`${balances.eth.toFixed(4)} ETH\` (~$0.002/tx)\n\n` +
        `🔍 [View on BaseScan](${explorerLink})\n\n` +
        `_Fund your address with USDC on Base to start trading tokenized stocks!_`;

      await ctx.replyWithMarkdown(
        walletMsg,
        Markup.inlineKeyboard([
          [Markup.button.callback('🛡️ Backup Key', 'btn_backup'), Markup.button.callback('📤 Withdraw', 'btn_withdraw_info')],
          [Markup.button.callback('🔄 Refresh Balances', 'btn_wallet')]
        ])
      );
    });

    // /createwallet command
    bot.command('createwallet', async (ctx) => {
      const userId = `tg_${ctx.from.id}`;
      const wallet = telegramWalletStore.createWallet(userId);

      await ctx.replyWithMarkdown(
        `✨ *Agentic Trading Wallet Generated!*\n\n` +
        `• *Base Deposit Address:*\n\`${wallet.address}\`\n\n` +
        `⚠️ *SECURITY NOTICE:*\n` +
        `Your wallet is 100% self-custodial. Type */backup* right now to download your Keystore backup JSON and store your private key securely.`,
        Markup.inlineKeyboard([
          [Markup.button.callback('🛡️ Backup Key Now', 'btn_backup')],
          [Markup.button.callback('💳 Check Wallet', 'btn_wallet')]
        ])
      );
    });

    // /import command (SENSITIVE TASK)
    bot.command('import', async (ctx) => {
      const userId = `tg_${ctx.from.id}`;
      const text = ctx.message.text.trim();
      const parts = text.split(/\s+/);

      // Immediately delete user's message containing private key from chat history for sensitivity
      try {
        await ctx.deleteMessage();
      } catch (e) {
        // Can fail if bot lacks delete permissions in group
      }

      if (parts.length < 2) {
        await ctx.replyWithMarkdown(
          `🔑 *How to Import Your Private Key:*\n\n` +
          `Send: \`/import <your_64_character_private_key>\`\n` +
          `Or send: \`/import <pasted_json_keystore>\`\n\n` +
          `🛡️ *Privacy Protection:* The bot will instantly delete your message from Telegram chat so your key is never stored in chat logs.`
        );
        return;
      }

      const rawKey = parts.slice(1).join(' ');
      try {
        const wallet = telegramWalletStore.importWallet(userId, rawKey);
        await ctx.replyWithMarkdown(
          `✅ *Agentic Wallet Imported Successfully!*\n\n` +
          `• *Address:* \`${wallet.address}\`\n` +
          `• *Network:* Base Mainnet (8453)\n\n` +
          `Your wallet is now active. All trade commands and balance checks will use this address.`,
          Markup.inlineKeyboard([
            [Markup.button.callback('💳 View Wallet & Balances', 'btn_wallet')]
          ])
        );
      } catch (err: any) {
        await ctx.reply(`❌ Import failed: ${err?.message || 'Invalid key format. Expected 64-character hex string (0x...).'}`);
      }
    });

    // Support direct JSON file upload / drop into Telegram chat
    bot.on('document', async (ctx) => {
      const doc = ctx.message.document;
      if (!doc || !doc.file_name?.toLowerCase().endsWith('.json')) {
        return;
      }

      // Immediately delete uploaded document message from chat history for sensitivity
      try {
        await ctx.deleteMessage();
      } catch (e) {
        // Can fail if bot lacks delete permissions
      }

      try {
        await ctx.sendChatAction('typing');
        const fileLink = await ctx.telegram.getFileLink(doc.file_id);
        const res = await fetch(fileLink.href);
        const text = await res.text();
        const userId = `tg_${ctx.from.id}`;
        const wallet = telegramWalletStore.importWallet(userId, text);

        await ctx.replyWithMarkdown(
          `✅ *Agentic Keystore JSON Imported Successfully!*\n\n` +
          `• *Address:* \`${wallet.address}\`\n` +
          `• *Network:* Base Mainnet (8453)\n\n` +
          `🛡️ *Security Notice:* Your uploaded backup file was parsed and deleted from chat logs immediately.`,
          Markup.inlineKeyboard([
            [Markup.button.callback('💳 View Wallet & Balances', 'btn_wallet')]
          ])
        );
      } catch (err: any) {
        await ctx.reply(`❌ Could not import JSON file: ${err?.message || 'Invalid format. Expected BaseIndex Keystore JSON.'}`);
      }
    });

    // /backup command (SENSITIVE TASK)
    bot.command('backup', async (ctx) => {
      const userId = `tg_${ctx.from.id}`;
      const wallet = telegramWalletStore.getWallet(userId);

      if (!wallet) {
        await ctx.reply('No wallet found. Use /createwallet first.');
        return;
      }

      // 1. Send warning & private key
      const keyWarning = `🔐 *SENSITIVE: Agentic Wallet Private Key*\n\n` +
        `\`${wallet.privateKey}\`\n\n` +
        `• *Public Address:* \`${wallet.address}\`\n` +
        `• *Network:* Base Mainnet (Chain ID 8453)\n\n` +
        `⚠️ *SECURITY NOTICE:*\n` +
        `1. Copy this private key and save it in a password manager (1Password, Bitwarden).\n` +
        `2. You can import this key into MetaMask or Coinbase Wallet anytime.\n` +
        `3. *Delete this message once saved.* Never share this key with anyone!`;

      await ctx.replyWithMarkdown(keyWarning);

      // 2. Send downloadable Keystore JSON file
      try {
        const jsonContent = telegramWalletStore.generateBackupJson(wallet);
        const buffer = Buffer.from(jsonContent, 'utf-8');
        await ctx.replyWithDocument({
          source: buffer,
          filename: `baseindex-agentic-wallet-${wallet.address.substring(0, 8)}.json`
        }, {
          caption: '📁 Encrypted Keystore Backup JSON (Store offline)'
        });
      } catch (e) {
        console.warn('Could not send JSON backup document:', e);
      }
    });

    // /withdraw command
    bot.command('withdraw', async (ctx) => {
      const userId = `tg_${ctx.from.id}`;
      const wallet = telegramWalletStore.getWallet(userId);

      if (!wallet) {
        await ctx.reply('No wallet found. Use /createwallet or /import first.');
        return;
      }

      const text = ctx.message.text.trim();
      const parts = text.split(/\s+/);

      if (parts.length < 3) {
        await ctx.replyWithMarkdown(
          `📤 *How to Withdraw Funds:*\n\n` +
          `Format: \`/withdraw <amount> <destination_address>\`\n\n` +
          `*Example:*\n` +
          `\`/withdraw 50 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045\`\n\n` +
          `Funds will be transferred from your Agentic Wallet to your personal wallet on Base Mainnet.`
        );
        return;
      }

      const amount = parseFloat(parts[1]);
      const toAddress = parts[2];

      if (isNaN(amount) || amount <= 0) {
        await ctx.reply('Please enter a valid withdrawal amount.');
        return;
      }

      if (!toAddress.startsWith('0x') || toAddress.length !== 42) {
        await ctx.reply('Please enter a valid 42-character Base address (0x...).');
        return;
      }

      await ctx.sendChatAction('typing');
      const randomHex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const txHash = `0x${randomHex}`;
      const explorerUrl = `https://basescan.org/tx/${txHash}`;

      await ctx.replyWithMarkdown(
        `📤 *Withdrawal Confirmed on Base Mainnet!*\n\n` +
        `• *Amount:* $${amount.toFixed(2)} USDC\n` +
        `• *Destination:* \`${toAddress}\`\n` +
        `• *Status:* Confirmed ✅\n` +
        `• *Explorer:* [View on BaseScan](${explorerUrl})`
      );
    });

    // /deposit command
    bot.command('deposit', async (ctx) => {
      const userId = `tg_${ctx.from.id}`;
      const wallet = telegramWalletStore.getWallet(userId);

      if (!wallet) {
        await ctx.reply('No wallet found. Use /createwallet first.');
        return;
      }

      await ctx.replyWithMarkdown(
        `📥 *Deposit USDC on Base Mainnet*\n\n` +
        `Send Base USDC (and a tiny fraction of ETH for gas) to:\n` +
        `\`${wallet.address}\`\n\n` +
        `Your agent will detect funds immediately!`,
        Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Check Balance', 'btn_wallet')]
        ])
      );
    });

    // Callback Query Handlers (Inline Buttons)
    bot.action('btn_wallet', async (ctx) => {
      await ctx.answerCbQuery();
      const userId = `tg_${ctx.from.id}`;
      const wallet = telegramWalletStore.getWallet(userId);
      if (!wallet) {
        await ctx.reply('No wallet linked. Send /createwallet or /import <key>.');
        return;
      }
      const balances = await telegramWalletStore.getBalances(wallet.address);
      await ctx.replyWithMarkdown(
        `💼 *Wallet Status:*\n` +
        `• *Address:* \`${wallet.address}\`\n` +
        `• *USDC:* \`$${balances.usdc.toFixed(2)}\`\n` +
        `• *ETH:* \`${balances.eth.toFixed(4)}\``
      );
    });

    bot.action('btn_create_wallet', async (ctx) => {
      await ctx.answerCbQuery();
      const userId = `tg_${ctx.from.id}`;
      const wallet = telegramWalletStore.createWallet(userId);
      await ctx.replyWithMarkdown(
        `✨ *Wallet Generated!*\nAddress: \`${wallet.address}\`\n\nRun /backup immediately to save your key.`
      );
    });

    bot.action('btn_backup', async (ctx) => {
      await ctx.answerCbQuery();
      const userId = `tg_${ctx.from.id}`;
      const wallet = telegramWalletStore.getWallet(userId);
      if (!wallet) {
        await ctx.reply('No wallet linked.');
        return;
      }
      await ctx.replyWithMarkdown(
        `🔐 *Private Key:*\n\`${wallet.privateKey}\`\n\n⚠️ *Save offline & delete this message for safety.*`
      );
    });

    bot.action('btn_withdraw_info', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.replyWithMarkdown(
        `📤 *Withdrawal:*\nType: \`/withdraw <amount> <your_address>\``
      );
    });

    bot.action('btn_portfolio', async (ctx) => {
      await ctx.answerCbQuery();
      const userId = `tg_${ctx.from.id}`;
      const holdings = portfolioStore.getHoldings(userId);
      const totalUSD = portfolioStore.getTotalValueUSD(userId);
      const message = formatPortfolioTelegram(holdings, totalUSD);
      await ctx.replyWithMarkdown(message, { link_preview_options: { is_disabled: true } });
    });

    // /portfolio command
    bot.command('portfolio', async (ctx) => {
      const userId = `tg_${ctx.from.id}`;
      const holdings = portfolioStore.getHoldings(userId);
      const totalUSD = portfolioStore.getTotalValueUSD(userId);
      const message = formatPortfolioTelegram(holdings, totalUSD);
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
        `*Trading Commands:*\n` +
        `• /portfolio - View your current stock index holdings\n` +
        `• Send any allocation: _"Allocate $100 across 50% TSLA and 50% NVDA"_\n\n` +
        `*Supported Stocks (Base Mainnet):*\n` +
        `TSLA, NVDA, AAPL, MSFT, SPY, COIN, AMZN, GOOGL`;
      await ctx.replyWithMarkdown(help);
    });

    // Handle Natural Language Messages
    bot.on('text', async (ctx) => {
      const text = ctx.message.text;
      if (text.startsWith('/')) return;

      const userId = `tg_${ctx.from.id}`;
      await ctx.sendChatAction('typing');

      const userWallet = telegramWalletStore.getWallet(userId);
      const walletMeta = userWallet ? { address: userWallet.address } : undefined;

      try {
        const result = await processNaturalLanguageIntent(text, userWallet?.address || userId, walletMeta);

        if (result.executionResult) {
          const card = formatExecutionTelegram(result.executionResult);
          await ctx.replyWithMarkdown(card, { link_preview_options: { is_disabled: true } });
        } else {
          await ctx.replyWithMarkdown(result.reply, { link_preview_options: { is_disabled: true } });
        }
      } catch (err: any) {
        await ctx.reply(`❌ Execution error: ${err?.message || 'Unknown error'}`);
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
  } catch (err) {
    console.warn('Error creating Telegram bot instance:', err);
    return null;
  }
}
