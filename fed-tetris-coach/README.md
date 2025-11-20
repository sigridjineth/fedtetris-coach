# FedTetris Coach Studio 🧩🧠

**FedTetris Coach Studio** is an AI-powered Tetris platform that turns gameplay into a shared "Strategy Asset". By combining **FLock.io's Federated Learning & AI**, **KV Caching**, and **Base Blockchain**, it creates a global "Tetris Brain" that coaches players in real-time.

## 🚀 Key Features

*   **Real-time AI Coach:** Uses **FLock.io (Qwen-32b)** to analyze your board and suggest the best moves.
*   **Federated KV Cache:** A 3-layer caching system (Memory -> SQLite -> FLock API) that "learns" from every player. Once a strategy for a specific board state is generated, it's cached and shared globally, reducing latency and API costs.
*   **Strategy Snapshots:** (Concept) Gameplay logs are aggregated to create verifiable "Strategy Assets" (NFTs) on Base.
*   **Base Mini App Ready:** Fully integrated with **Coinbase Wallet** and **OnchainKit**.
*   **Network Resilience:** Robust AI polling with timeouts, retries, and exponential backoff ensures smooth gameplay even on slow networks.

## 🏗 Architecture

### Frontend (`/frontend`)
*   **Next.js (App Router):** Modern React framework.
*   **Tetris Engine:** Custom React hook-based game loop.
*   **AI Coach Panel:** Real-time sidebar showing recommended moves, explanations, and the **Source** of the advice (e.g., `L1_KV_STORE` vs `FLOCK_GENERATE`).
*   **Wallet Integration:** Uses `@coinbase/onchainkit` and `wagmi` to connect user wallets and sign replays.
*   **Stack:** Tailwind CSS, OnchainKit (UI).

### Backend (`/backend`)
*   **Node.js / Express:** Lightweight API server.
*   **L0 Cache:** In-memory Map for sub-millisecond hot access.
*   **L1 Cache:** **AgentFS (SQLite)** for persistent storage of strategies and replays.
*   **FLock Client:** OpenAI-compatible client connecting to FLock's decentralized AI network.

## 🛠 Setup & Run

### Prerequisites
*   Node.js 18+
*   FLock API Key (Optional for demo, defaults to mock)

### 1. Backend Setup
```bash
cd backend
npm install
# Create a .env file based on .env.example
cp .env.example .env
# Start the server
npm run dev
```
The backend will run on `http://localhost:3001`. Database `agentfs.db` will be created automatically.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to play!

## 📝 Project Status (Hackathon)

### ✅ Implemented
*   **Full Tetris Game Loop & Engine.**
*   **Federated KV Cache Logic:** L0/L1/L2 hierarchy is fully functional.
*   **FLock Integration:** Client is wired up to call Qwen (graceful fallback to mock if key is missing).
*   **Wallet Connection:** Users can connect Coinbase/Base wallets via OnchainKit.
*   **Replay Upload:** Game logs are uploaded to the backend upon "Game Over", linked to the user's wallet address.
*   **Replay Schema:** Database stores episodes, steps, and strategy snapshots.
*   **Robust Networking:** Frontend handles API timeouts and race conditions gracefully.

### 🚧 Roadmap
*   **Strategy Minting:** Convert cached strategies into tradable NFTs on Base.
*   **Fee Sharing:** Distribute x402 fees to users who contributed valuable replay data.

## 🏆 Hackathon Goals
This project demonstrates **"KV Cache as a Service"** and **"Strategy-as-an-Asset"** on Base. By proving that we can cache and reuse AI reasoning for complex game states, we show a path toward scalable, decentralized AI agents that learn from the community.
