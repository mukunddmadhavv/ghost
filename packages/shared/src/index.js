const LAMPORTS_PER_SOL = 1_000_000_000

function solToLamports(sol) {
  return Math.floor(sol * LAMPORTS_PER_SOL)
}

function lamportsToSol(lamports) {
  return lamports / LAMPORTS_PER_SOL
}

function shortenAddress(address, chars = 4) {
  if (!address) return ''
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

const DEFAULT_POLICY = {
  maxSpendPerDay: 0.5,
  allowedRecipients: [],
  timeRestriction: { enabled: false, startHour: 0, endHour: 23 },
  requireApprovalAbove: 1.0,
  emergencyPaused: false,
}

const SOLANA_EXPLORER_BASE = 'https://explorer.solana.com'

function explorerTxUrl(signature, cluster = 'devnet') {
  return `${SOLANA_EXPLORER_BASE}/tx/${signature}?cluster=${cluster}`
}

function explorerAddressUrl(address, cluster = 'devnet') {
  return `${SOLANA_EXPLORER_BASE}/address/${address}?cluster=${cluster}`
}

module.exports = {
  LAMPORTS_PER_SOL,
  solToLamports,
  lamportsToSol,
  shortenAddress,
  DEFAULT_POLICY,
  explorerTxUrl,
  explorerAddressUrl,
}
