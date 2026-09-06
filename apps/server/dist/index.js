"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const chat_1 = require("./routes/chat");
const portfolio_1 = require("./routes/portfolio");
const agent_1 = require("./agent/agent");
const bot_1 = require("./telegram/bot");
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: '*', // Permit frontend connection from Vercel & localhost
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
// Health Check for Render
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        network: 'Base Mainnet',
        chainId: config_1.config.BASE_CHAIN_ID,
        timestamp: new Date().toISOString()
    });
});
// Mount Routes
app.use('/api/chat', chat_1.chatRouter);
app.use('/api/portfolio', portfolio_1.portfolioRouter);
// Start Server & Subsystems
async function startServer() {
    const port = parseInt(config_1.config.PORT, 10) || 4000;
    const server = app.listen(port, () => {
        console.log(`\n=================================================`);
        console.log(`🚀 BaseIndex Agent Server listening on port ${port}`);
        console.log(`🌐 Network: Base Mainnet (Chain ID: ${config_1.config.BASE_CHAIN_ID})`);
        console.log(`⚡ Health Check: http://localhost:${port}/health`);
        console.log(`=================================================\n`);
    });
    // Initialize AI Agent Executor and Telegram Bot in background
    try {
        await (0, agent_1.initializeAgent)();
    }
    catch (e) {
        console.warn('Agent initialization non-fatal error:', e);
    }
    try {
        (0, bot_1.initializeTelegramBot)();
    }
    catch (e) {
        console.warn('Telegram initialization non-fatal error:', e);
    }
}
startServer().catch((err) => {
    console.error('Fatal startup error in BaseIndex Agent Server:', err);
    process.exit(1);
});
