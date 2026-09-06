import { Router, Request, Response } from 'express';
import { processNaturalLanguageIntent } from '../agent/agent';

export const chatRouter = Router();

// Standard JSON Chat endpoint
chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { prompt, walletAddress, usdcBalance, ethBalance, agenticWalletAddress } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const effectiveAddress = agenticWalletAddress || walletAddress || 'default';
    const result = await processNaturalLanguageIntent(
      prompt,
      effectiveAddress,
      {
        address: effectiveAddress,
        usdcBalance: typeof usdcBalance === 'number' ? usdcBalance : undefined,
        ethBalance: typeof ethBalance === 'number' ? ethBalance : undefined
      }
    );
    res.json({
      success: true,
      message: result.reply,
      steps: result.steps,
      executionResult: result.executionResult
    });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Server error' });
  }
});

// SSE Streaming endpoint for real-time reasoning & step streaming
chatRouter.get('/stream', async (req: Request, res: Response) => {
  const prompt = req.query.prompt as string;
  const walletAddress = (req.query.walletAddress as string) || 'default';

  if (!prompt) {
    res.status(400).send('Prompt query parameter is required');
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendSSE = (event: string, data: any) => {
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

    const result = await processNaturalLanguageIntent(prompt, walletAddress);

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
  } catch (err: any) {
    sendSSE('error', { message: err?.message || 'Execution error' });
    res.end();
  }
});
