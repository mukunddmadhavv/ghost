const { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const anchor = require('@coral-xyz/anchor');
const path = require('path');
const fs   = require('fs');

const RPC_URL    = process.env.SOLANA_RPC_URL  || 'https://api.devnet.solana.com';
const PROGRAM_ID = process.env.PROGRAM_ID      || '3BKqA1CzLd27roSy4qi7T9S4LDdSVbndLasSb5dyMr6p';

// Load IDL from built anchor artifact
const IDL_PATH = path.join(__dirname, '../../../../anchor/target/idl/ghost_wallet.json');

let _program = null;
let _connection = null;

function getConnection() {
  if (!_connection) {
    _connection = new Connection(RPC_URL, 'confirmed');
  }
  return _connection;
}

function loadProgram() {
  if (_program) return _program;

  if (!fs.existsSync(IDL_PATH)) {
    console.warn('⚠️  Anchor IDL not found — on-chain calls will be skipped. Run: cd anchor && anchor build');
    return null;
  }

  const idl = JSON.parse(fs.readFileSync(IDL_PATH, 'utf8'));
  const connection = getConnection();

  // Use a dummy wallet for read-only operations;
  // real tx signing uses the user's wallet on frontend
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  };

  const provider = new anchor.AnchorProvider(connection, dummyWallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });

  _program = new anchor.Program(idl, new PublicKey(PROGRAM_ID), provider);
  return _program;
}

/**
 * Derive the PDA address for an agent wallet
 * Seeds: ["ghost-wallet", ownerPubkey, agentName]
 */
async function deriveWalletPDA(ownerPublicKeyStr, agentName) {
  const owner = new PublicKey(ownerPublicKeyStr);
  const program = new PublicKey(PROGRAM_ID);

  const [pda, bump] = await PublicKey.findProgramAddressSync(
    [
      Buffer.from('ghost-wallet'),
      owner.toBuffer(),
      Buffer.from(agentName),
    ],
    program
  );

  return { pda: pda.toString(), bump };
}

/**
 * Fetch on-chain wallet state (policy, spent today, etc.)
 */
async function fetchWalletOnChain(pdaAddressStr) {
  const program = loadProgram();
  if (!program) return null;

  try {
    const pda = new PublicKey(pdaAddressStr);
    const wallet = await program.account.agentWallet.fetch(pda);
    return {
      owner: wallet.owner.toString(),
      agentName: wallet.agentName,
      totalSpentToday: wallet.totalSpentToday.toNumber() / LAMPORTS_PER_SOL,
      lastResetAt: wallet.lastResetAt.toNumber(),
      policy: {
        maxSpendPerDay: wallet.policy.maxSpendPerDay.toNumber() / LAMPORTS_PER_SOL,
        allowedRecipients: wallet.policy.allowedRecipients.map(p => p.toString()),
        timeRestriction: wallet.policy.timeRestriction,
        requireApprovalAbove: wallet.policy.requireApprovalAbove.toNumber() / LAMPORTS_PER_SOL,
        emergencyPaused: wallet.policy.emergencyPaused,
      },
    };
  } catch (err) {
    console.warn('Could not fetch on-chain wallet:', err.message);
    return null;
  }
}

/**
 * Get SOL balance of a Solana address
 */
async function getBalance(publicKeyStr) {
  try {
    const conn = getConnection();
    const pubkey = new PublicKey(publicKeyStr);
    const lamports = await conn.getBalance(pubkey);
    return lamports / LAMPORTS_PER_SOL;
  } catch (err) {
    console.warn('Balance fetch failed:', err.message);
    return 0;
  }
}

/**
 * Get transaction details from signature
 */
async function getTransaction(signature) {
  try {
    const conn = getConnection();
    const tx = await conn.getTransaction(signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
    return tx;
  } catch {
    return null;
  }
}

module.exports = {
  getConnection,
  loadProgram,
  deriveWalletPDA,
  fetchWalletOnChain,
  getBalance,
  getTransaction,
  LAMPORTS_PER_SOL,
  PROGRAM_ID,
};
