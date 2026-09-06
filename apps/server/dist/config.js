"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTelegramConfigured = exports.isOpenAIConfigured = exports.isLiveCDPConfigured = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('4000'),
    NODE_ENV: zod_1.z.string().default('development'),
    FRONTEND_URL: zod_1.z.string().default('http://localhost:3000'),
    // AI Brain
    OPENAI_API_KEY: zod_1.z.string().optional(),
    OPENAI_BASE_URL: zod_1.z.string().optional(),
    OPENAI_MODEL_NAME: zod_1.z.string().default('gpt-4o'),
    // CDP AgentKit (Base Mainnet)
    CDP_API_KEY_NAME: zod_1.z.string().optional(),
    CDP_API_KEY_PRIVATE_KEY: zod_1.z.string().optional(),
    CDP_WALLET_DATA: zod_1.z.string().optional(),
    // Base Mainnet RPC
    BASE_RPC_URL: zod_1.z.string().default('https://mainnet.base.org'),
    BASE_CHAIN_ID: zod_1.z.coerce.number().default(8453),
    // Telegram Bot
    TELEGRAM_BOT_TOKEN: zod_1.z.string().optional(),
    TELEGRAM_WEBHOOK_URL: zod_1.z.string().optional(),
    // Safeguards
    MAX_SLIPPAGE_BPS: zod_1.z.coerce.number().default(50),
    MAX_SINGLE_TRADE_USD: zod_1.z.coerce.number().default(10000)
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.format());
    process.exit(1);
}
exports.config = parsed.data;
exports.isLiveCDPConfigured = Boolean(exports.config.CDP_API_KEY_NAME && exports.config.CDP_API_KEY_PRIVATE_KEY);
exports.isOpenAIConfigured = Boolean(exports.config.OPENAI_API_KEY && exports.config.OPENAI_API_KEY.trim().length > 5);
exports.isTelegramConfigured = Boolean(exports.config.TELEGRAM_BOT_TOKEN && exports.config.TELEGRAM_BOT_TOKEN.includes(':'));
