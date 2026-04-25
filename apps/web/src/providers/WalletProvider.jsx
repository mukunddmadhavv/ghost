import { useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'

const NETWORK = import.meta.env.VITE_SOLANA_NETWORK || 'devnet'
const RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(NETWORK)

export function WalletAdapterProvider({ children }) {
  const wallets = useMemo(() => [], [])

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
