import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000'),
  FRONTEND_URL: z.string().default('https://baseindex-agent.vercel.app'),
  
  // AI Brain
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().default('https://api.groq.com/openai/v1'),
  OPENAI_MODEL_NAME: z.string().default('openai/gpt-oss-120b'),
  
  // CDP AgentKit (Base Mainnet)
  CDP_API_KEY_NAME: z.string().optional(),
  CDP_API_KEY_PRIVATE_KEY: z.string().optional(),
  CDP_WALLET_DATA: z.string().optional(),
  
  // Base Mainnet RPC
  BASE_RPC_URL: z.string().default('https://mainnet.base.org'),
  BASE_CHAIN_ID: z.coerce.number().default(8453),
  
  // Telegram Bot
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_URL: z.string().optional(),
  
  // Safeguards
  MAX_SLIPPAGE_BPS: z.coerce.number().default(50),
  MAX_SINGLE_TRADE_USD: z.coerce.number().default(10000)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
export const isLiveCDPConfigured = Boolean(config.CDP_API_KEY_NAME && config.CDP_API_KEY_PRIVATE_KEY);
export const isOpenAIConfigured = Boolean(config.OPENAI_API_KEY && config.OPENAI_API_KEY.trim().length > 5);
export const isTelegramConfigured = Boolean(config.TELEGRAM_BOT_TOKEN && config.TELEGRAM_BOT_TOKEN.includes(':'));
