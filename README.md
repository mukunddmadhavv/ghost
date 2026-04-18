# tryghost.dev

> AI Agent Smart Wallet on Solana — Trust infrastructure for autonomous AI payments.

**"We're not building a wallet. We're building trust for AI money."**

## Monorepo Structure

```
tryghost/
├── apps/
│   ├── web/          # React + Vite + Tailwind CSS (→ Netlify)
│   └── api/          # Node.js + Express + Supabase (→ Render)
├── packages/
│   └── shared/       # Shared constants, types, utils
└── anchor/           # Solana on-chain program (Anchor + Rust)
```

## Quick Start

```bash
# Install all dependencies
npm install

# Run both frontend and backend in dev mode
npm run dev

# Run individually
npm run dev:web
npm run dev:api
```

## Environment Variables

Copy `.env.example` files in both `apps/web` and `apps/api` and fill in your values.

## Deployment

- **Frontend** → Netlify (base dir: `apps/web`, build: `npm run build`, publish: `dist`)
- **Backend** → Render (root dir: `apps/api`, start: `node src/index.js`)
- **Solana Program** → `anchor deploy --provider.cluster devnet`

## Key Features

- 🛡️ **Hashed API Keys**: Secure, one-time reveal secret keys for agent authentication.
- ⛓️ **On-Chain Policy Engine**: Spending limits and allowlists enforced by Solana PDAs.
- 🤖 **Agent Vaults**: Program-derived addresses (PDAs) dedicated to autonomous bot capital.
- 📜 **Live Audit Trail**: real-time streaming of all approved and rejected agent transactions.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS v3 |
| Backend | Node.js, Express.js, SHA-256 Hashing |
| Database | Supabase (PostgreSQL) |
| Blockchain | Solana Devnet, Anchor (Rust) |
| Deployment | Netlify + Render |





