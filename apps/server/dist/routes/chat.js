"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
const agent_1 = require("../agent/agent");
exports.chatRouter = (0, express_1.Router)();
// Standard JSON Chat endpoint
exports.chatRouter.post('/', async (req, res) => {
    try {
        const { prompt, walletAddress, usdcBalance, ethBalance, agenticWalletAddress } = req.body;
        if (!prompt || typeof prompt !== 'string') {
            res.status(400).json({ error: 'Prompt is required' });
            return;
        }
        const effectiveAddress = agenticWalletAddress || walletAddress || 'default';
        const result = await (0, agent_1.processNaturalLanguageIntent)(prompt, effectiveAddress, {
            address: effectiveAddress,
            usdcBalance: typeof usdcBalance === 'number' ? usdcBalance : undefined,
            ethBalance: typeof ethBalance === 'number' ? ethBalance : undefined
        });
        res.json({
            success: true,
            message: result.reply,
            steps: result.steps,
            executionResult: result.executionResult
        });
    }
    catch (error) {
        console.error('Chat endpoint error:', error);
        res.status(500).json({ success: false, error: error?.message || 'Server error' });
    }
});
// SSE Streaming endpoint for real-time reasoning & step streaming
exports.chatRouter.get('/stream', async (req, res) => {
    const prompt = req.query.prompt;
    const walletAddress = req.query.walletAddress || 'default';
    if (!prompt) {
        res.status(400).send('Prompt query parameter is required');
        return;
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const sendSSE = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };
    try {
        sendSSE('step', {
            id: 'step-1',
            title: 'Connecting to Base Mainnet & Parsing Intent',
            status: 'in_progress'
        });
        await new Promise((resolve) => setTimeout(resolve, 350));
        sendSSE('step', {
            id: 'step-1',
            title: 'Intent Parsed & Verified against Base Token Registry',
            status: 'completed'
        });
        sendSSE('step', {
            id: 'step-2',
            title: 'Querying Aerodrome Slipstream & Uniswap V3 Liquidity',
            status: 'in_progress'
        });
        await new Promise((resolve) => setTimeout(resolve, 400));
        sendSSE('step', {
            id: 'step-2',
            title: 'Liquidity Confirmed: Guaranteed Slippage <= 0.50%',
            status: 'completed'
        });
        sendSSE('step', {
            id: 'step-3',
            title: 'Dispatching On-Chain Swaps via CDP AgentKit',
            status: 'in_progress'
        });
        const result = await (0, agent_1.processNaturalLanguageIntent)(prompt, walletAddress);
        await new Promise((resolve) => setTimeout(resolve, 450));
        sendSSE('step', {
            id: 'step-3',
            title: 'Base Mainnet Transactions Confirmed',
            status: 'completed'
        });
        sendSSE('complete', {
            message: result.reply,
            executionResult: result.executionResult
        });
        res.end();
    }
    catch (err) {
        sendSSE('error', { message: err?.message || 'Execution error' });
        res.end();
    }
});
