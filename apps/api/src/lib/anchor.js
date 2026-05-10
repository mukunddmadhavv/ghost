const { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const anchor = require('@coral-xyz/anchor');
const path = require('path');
const fs   = require('fs');

const RPC_URL    = process.env.SOLANA_RPC_URL  || 'https://api.devnet.solana.com';
const PROGRAM_ID = process.env.PROGRAM_ID      || 'HkWBDfjJnNMURCwJqyRCVfY8a8FT1MnKMdQVpFGke72b';

// Load IDL from bundled location (works on Render)
const IDL_PATH = path.join(__dirname, '../idl/ghost_wallet.json');

let _program = null;
let _connection = null;

function getConnection() {
  if (!_connection) {
    _connection = new Connection(RPC_URL, 'confirmed');
  }
  return _connection;
}

let _wallet = null;

function getRelayerWallet() {
  if (_wallet) return _wallet;

  _wallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  };

  try {
    if (process.env.RELAYER_KEYPAIR) {
      const secret = JSON.parse(process.env.RELAYER_KEYPAIR);
      const keypair = Keypair.fromSecretKey(new Uint8Array(secret));
      _wallet = new anchor.Wallet(keypair);
    } else {
      const keypairPath = path.join(require('os').homedir(), '.config', 'solana', 'id.json');
      if (fs.existsSync(keypairPath)) {
        const secret = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
        const keypair = Keypair.fromSecretKey(new Uint8Array(secret));
        _wallet = new anchor.Wallet(keypair);
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not load local wallet, using dummy wallet.', err.message);
  }
  return _wallet;
}

function loadProgram() {
  if (_program) return _program;

  // Fallback for local development if bundled IDL missing
  let actualPath = IDL_PATH;
  if (!fs.existsSync(actualPath)) {
    actualPath = path.join(__dirname, '../../../../anchor/target/idl/ghost_wallet.json');
  }

  if (!fs.existsSync(actualPath)) {
    console.warn('⚠️  Anchor IDL not found — on-chain calls will be skipped.');
    return null;
  }

  const idl = JSON.parse(fs.readFileSync(actualPath, 'utf8'));
  const connection = getConnection();

  // Load Relayer Wallet to pay for smart contract execution gas fees
  const wallet = getRelayerWallet();

  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });

  _program = new anchor.Program(idl, provider);
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
    
    // Anchor JS automatically camelCases fields from the IDL
    return {
      owner: wallet.owner.toString(),
      agentName: wallet.agentName,
      totalSpentToday: wallet.totalSpentToday.toNumber() / LAMPORTS_PER_SOL,
      lastResetAt: wallet.lastResetAt.toNumber(),
      policy: {
        maxSpendPerDay: wallet.policy.maxSpendPerDay.toNumber() / LAMPORTS_PER_SOL,
        allowedRecipients: wallet.policy.allowedRecipients.map(p => p.toString()),
        timeRestriction: {
          enabled: wallet.policy.timeRestriction.enabled,
          startHour: wallet.policy.timeRestriction.startHour,
          endHour: wallet.policy.timeRestriction.endHour,
        },
        requireApprovalAbove: wallet.policy.requireApprovalAbove.toNumber() / LAMPORTS_PER_SOL,
        emergencyPaused: wallet.policy.emergencyPaused,
      },
    };
  } catch (err) {
    console.warn(`Could not fetch on-chain wallet for PDA ${pdaAddressStr}:`, err.message);
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
  getRelayerWallet,
  LAMPORTS_PER_SOL,
  PROGRAM_ID,
};
