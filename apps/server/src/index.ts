import express from 'express';
import cors from 'cors';
import { config } from './config';
import { chatRouter } from './routes/chat';
import { portfolioRouter } from './routes/portfolio';
import { initializeAgent } from './agent/agent';
import { initializeTelegramBot } from './telegram/bot';

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Permit frontend connection from Vercel & localhost
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health Check for Render
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    network: 'Base Mainnet',
    chainId: config.BASE_CHAIN_ID,
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/chat', chatRouter);
app.use('/api/portfolio', portfolioRouter);

// Start Server & Subsystems
async function startServer() {
  const port = parseInt(config.PORT, 10) || 4000;
  
  const server = app.listen(port, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 BaseIndex Agent Server listening on port ${port}`);
    console.log(`🌐 Network: Base Mainnet (Chain ID: ${config.BASE_CHAIN_ID})`);
    console.log(`⚡ Health Check: http://localhost:${port}/health`);
    console.log(`=================================================\n`);
  });

  // Initialize Telegram Bot immediately so it is online instantly
  try {
    initializeTelegramBot();
  } catch (e) {
    console.warn('Telegram initialization non-fatal error:', e);
  }

  // Initialize AI Agent Executor in background
  initializeAgent().catch((e) => {
    console.warn('Agent initialization non-fatal error:', e);
  });
}

startServer().catch((err) => {
  console.error('Fatal startup error in BaseIndex Agent Server:', err);
  process.exit(1);
});
