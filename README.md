# BaseIndex Agent (Base Mainnet)

> **Autonomous Chat-to-Trade Personalized Stock Index & Portfolio Builder on Base Mainnet** (interacting with live Coinbase Tokenized Equities).

[![Network: Base Mainnet](https://img.shields.io/badge/Network-Base%20Mainnet%20(8453)-0052FF.svg)](https://basescan.org)
[![CDP AgentKit](https://img.shields.io/badge/CDP-AgentKit-blue.svg)](https://docs.cdp.coinbase.com/agentkit/docs/welcome)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Hosted-black.svg)](https://vercel.com)
[![Render Deployment](https://img.shields.io/badge/Render-Backend-46E3B7.svg)](https://render.com)

---

## Overview

**BaseIndex Agent** bridges natural language portfolio management with live on-chain execution on **Base Mainnet**. Users can instruct the agent in plain English (e.g. *"Allocate $1,000 across 60% NVDA and 40% TSLA"*), and the agent calculates fractional share distributions, verifies real pool depth and slippage via **Aerodrome Slipstream** and **Uniswap V3**, and executes the swaps via **Coinbase Developer Platform (CDP) AgentKit** MPC wallets.

### Key Capabilities
- **Autonomous Conversational Trading:** Natural language intent parsing powered by LangChain and `gpt-4o`.
- **Live Tokenized Stocks on Base:** Direct routing to verified Base Mainnet contracts for **TSLA, NVDA, AAPL, MSFT, SPY, COIN, AMZN, and GOOGL**.
- **Institutional Guardrails:** 50 bps (0.5%) maximum guaranteed slippage constraint, oracle price validation, and multi-asset batching.
- **Dual Interfaces:**
  1. **Web App:** Next.js 14 App Router + RainbowKit + Wagmi + Tailwind CSS (Deep Obsidian & Base Electric Blue).
  2. **Telegram Trading Bot:** Telegraf bot running 24/7 on Render with `/portfolio` tracking and inline trading.
- **Strict Regulatory Geo-Fencing:** Vercel Edge Middleware detects and blocks US IP traffic (`x-vercel-ip-country === 'US'`) with a dedicated `/compliance` page.

---

## Monorepo Architecture

```
Trading Agent/
├── apps/
│   ├── web/               # Next.js 14 Web Application (Vercel)
│   │   ├── src/app/       # App Router, compliance page, providers
│   │   ├── src/components/# Terminal, Doughnut chart, Holdings table
│   │   ├── src/config/    # Wagmi & RainbowKit Base Mainnet config
│   │   └── src/middleware # Vercel Edge US Geo-blocking
│   └── server/            # Node.js/Express Backend & Agent (Render)
│       ├── src/agent/     # LangChain Agent, custom tools, prompts
│       ├── src/cdp/       # CDP AgentKit Base Mainnet MPC wallet
│       ├── src/telegram/  # Telegraf bot & rich markdown cards
│       ├── src/services/  # Viem client, Aerodrome router, portfolio store
│       └── src/routes/    # SSE streaming chat & portfolio APIs
└── packages/
    └── shared/            # Shared types, Base Mainnet constants & ABIs
```

---

## Quick Start

### 1. Configure Environment Variables
Copy `.env.example` to root or respective apps:
```bash
cp .env.example apps/server/.env
cp .env.example apps/web/.env.local
```

Fill in your credentials:
- `OPENAI_API_KEY`: For LangChain `gpt-4o` intent parsing.
- `CDP_API_KEY_NAME` & `CDP_API_KEY_PRIVATE_KEY`: From Coinbase Developer Platform for live Base Mainnet MPC wallet execution.
- `TELEGRAM_BOT_TOKEN`: From `@BotFather` for the Telegram interface.
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: From Reown / WalletConnect Cloud.

### 2. Install & Run Locally
```bash
# Install all dependencies across monorepo
npm install

# Start both Web (port 3000) and Server (port 4000)
npm run dev
```

Visit:
- **Web dApp:** `http://localhost:3000`
- **Backend API:** `http://localhost:4000/health`

---

## Verified Tokenized Stocks on Base Mainnet

| Ticker | Asset Name | Issuer / Protocol | Base Mainnet Contract Address |
|---|---|---|---|
| **TSLA** | Tesla Inc. Tokenized | Dinari dShare | `0x40167F47f9f74aC084323E9528f802dFFB69315A` |
| **NVDA** | NVIDIA Corp Tokenized | Dinari dShare | `0x94833215D4dbD1ee9542D5e592750e33B6C90B61` |
| **AAPL** | Apple Inc. Tokenized | Dinari dShare | `0xc5c73961FaC1aE6dE2378D00d33e144dF83b8D67` |
| **MSFT** | Microsoft Corp Tokenized | Dinari dShare | `0xD62Ebe5b0728c0638C4402693892F1b0d2dBE2Ce` |
| **SPY** | S&P 500 ETF Trust Tokenized | Dinari dShare | `0x991873ea2f6B63B66E0FaeA61C2C97F37d1d2360` |
| **COIN** | Coinbase Global Inc. Tokenized | Dinari dShare | `0x718a97fA6EcC3D4d47DFF73d4e8E871583D995e8` |
| **AMZN** | Amazon.com Inc. Tokenized | Dinari dShare | `0x8435d32906b3e64bF8862F81c4eAb462A0D523fB` |
| **GOOGL** | Alphabet Inc. Tokenized | Dinari dShare | `0x199321f4229988C784400569aBE64aae39818815` |
| **USDC** | Native USD Coin | Circle (Base Native) | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |

---

## Deployment Guide

### Deploying Frontend to Vercel
1. Link `apps/web` as the root directory in the Vercel dashboard.
2. Set Environment Variables:
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - `NEXT_PUBLIC_BASE_RPC_URL`: `https://mainnet.base.org`
   - `NEXT_PUBLIC_API_URL`: Your deployed Render backend URL.
3. Geo-fencing is automatically activated via `apps/web/src/middleware.ts` using Vercel's edge network.

### Deploying Backend & Agent to Render
1. Create a **Web Service** on Render pointing to `apps/server`.
2. Set Build Command: `npm install && npm run build`
3. Set Start Command: `npm start`
4. Provide environment variables: `OPENAI_API_KEY`, `CDP_API_KEY_NAME`, `CDP_API_KEY_PRIVATE_KEY`, `TELEGRAM_BOT_TOKEN`.
