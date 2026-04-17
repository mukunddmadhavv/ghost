#!/bin/bash
# deploy-anchor.sh — Deploy the ghost-wallet program to Solana devnet
# Run from the repo root: bash scripts/deploy-anchor.sh

set -e

echo "🚀 Deploying ghost-wallet to Solana devnet..."

# Set PATH for Solana CLI
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Check SOL balance
BALANCE=$(solana balance --url devnet | awk '{print $1}')
echo "💰 Wallet balance: $BALANCE SOL"

# Minimum SOL needed to deploy (~2.5 SOL for account rent)
NEEDED=2.5
if (( $(echo "$BALANCE < $NEEDED" | bc -l 2>/dev/null || echo 1) )); then
  echo "⚠️  Need at least $NEEDED SOL to deploy. Requesting airdrop..."
  solana airdrop 3 --url devnet || echo "Airdrop rate limited — try: https://faucet.solana.com"
fi

# Build
echo "🔨 Building Anchor program..."
cd "$(dirname "$0")/../anchor"
anchor build

# Deploy
echo "📡 Deploying to devnet..."
anchor deploy --provider.cluster devnet

# Get deployed program ID
PROGRAM_ID=$(solana address -k target/deploy/anchor-keypair.json)
echo ""
echo "✅ Deployed! Program ID: $PROGRAM_ID"
echo ""
echo "📝 Next steps:"
echo "   1. Update apps/api/.env → PROGRAM_ID=$PROGRAM_ID"
echo "   2. Update apps/web/.env → VITE_PROGRAM_ID=$PROGRAM_ID"
echo "   3. Restart the API server"
