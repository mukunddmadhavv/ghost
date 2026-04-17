const { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

const connection = new Connection(RPC_URL, 'confirmed');

/**
 * Get SOL balance of an address in SOL (not lamports)
 */
async function getBalance(publicKeyStr) {
  try {
    const pubkey = new PublicKey(publicKeyStr);
    const lamports = await connection.getBalance(pubkey);
    return lamports / LAMPORTS_PER_SOL;
  } catch (err) {
    throw new Error(`Invalid public key: ${publicKeyStr}`);
  }
}

/**
 * Airdrop SOL on devnet (for testing)
 */
async function requestAirdrop(publicKeyStr, solAmount = 1) {
  const pubkey = new PublicKey(publicKeyStr);
  const lamports = solAmount * LAMPORTS_PER_SOL;
  const sig = await connection.requestAirdrop(pubkey, lamports);
  await connection.confirmTransaction(sig);
  return sig;
}

/**
 * Derive a PDA for an agent wallet
 * Seeds: ["ghost-wallet", owner_pubkey, agent_name]
 */
async function deriveWalletPDA(ownerPubkeyStr, agentName, programId) {
  const owner = new PublicKey(ownerPubkeyStr);
  const program = new PublicKey(programId);

  const [pda, bump] = await PublicKey.findProgramAddress(
    [
      Buffer.from('ghost-wallet'),
      owner.toBuffer(),
      Buffer.from(agentName),
    ],
    program
  );
  return { pda: pda.toString(), bump };
}

module.exports = {
  connection,
  getBalance,
  requestAirdrop,
  deriveWalletPDA,
  LAMPORTS_PER_SOL,
};
