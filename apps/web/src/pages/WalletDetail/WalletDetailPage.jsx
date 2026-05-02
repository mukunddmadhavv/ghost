import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import * as anchor from '@coral-xyz/anchor'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { Buffer } from 'buffer'
import toast from 'react-hot-toast'
import PolicyEditor from '../../components/PolicyEditor.jsx'
import { RevealCopy } from '../../components/ui/reveal-copy'
import { Badge } from '../../components/ui/badge'

if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer
}

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const DEMO_WALLET = {
  id: 'demo',
  agent_name: 'Trading Bot Alpha',
  pda_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  balance_sol: 2.4500,
  is_active: true,
  policy: {
    maxSpendPerDay: 0.5,
    allowedRecipients: [],
    timeRestriction: { enabled: true, startHour: 9, endHour: 21 },
    requireApprovalAbove: 1.0,
    emergencyPaused: false,
  },
}

export default function WalletDetailPage() {
  const { id } = useParams()
  const { connection } = useConnection()
  const { publicKey, signTransaction, signAllTransactions } = useWallet()
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('policy')
  const [isDeploying, setIsDeploying] = useState(false)

  useEffect(() => {
    fetchWallet()
  }, [id])

  async function fetchWallet() {
    try {
      const token = localStorage.getItem('ghost_token')
      const res = await fetch(`${API}/api/wallets/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setWallet(data.wallet)
      } else {
        setWallet(DEMO_WALLET)
      }
    } catch {
      setWallet(DEMO_WALLET)
    } finally {
      setLoading(false)
    }
  }

  async function deployToChain() {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet first')
      return
    }

    setIsDeploying(true)
    const tId = toast.loading(`Deploying ${wallet.agent_name} to Solana...`)

    try {
      const idlRes = await fetch(`${API}/api/idl`)
      if (!idlRes.ok) throw new Error('Could not fetch Anchor IDL')
      const idl = await idlRes.json()

      const provider = new anchor.AnchorProvider(
        connection,
        {
          publicKey: publicKey,
          signTransaction: signTransaction,
          signAllTransactions: signAllTransactions,
        },
        { commitment: 'confirmed' }
      )

      const program = new anchor.Program(idl, provider)

      const [walletPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('ghost-wallet'),
          publicKey.toBuffer(),
          Buffer.from(wallet.agent_name),
        ],
        program.programId
      )

      const tx = await program.methods
        .initializeWallet(
          wallet.agent_name,
          publicKey, // agent_pubkey
          new anchor.BN(0.5 * 1e9),
          [],
          false,
          0,
          23,
          new anchor.BN(1.0 * 1e9)
        )
        .accounts({
          wallet: walletPda,
          owner: publicKey,
          system_program: SystemProgram.programId,
        })
        .rpc()

      toast.success('Wallet initialized on-chain!', { id: tId })
      setTimeout(() => fetchWallet(), 2000)
    } catch (err) {
      console.error(err)
      toast.error(`Deployment failed: ${err.message}`, { id: tId })
    } finally {
      setIsDeploying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading wallet...
      </div>
    )
  }

  if (!wallet) return <div className="p-8 text-gray-400">Wallet not found</div>

  return (
    <div className="p-4 sm:p-8 animate-fade-in max-w-4xl">
      {/* ── Breadcrumb ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/dashboard" className="hover:text-gray-700 transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{wallet.agent_name}</span>
      </div>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-2xl flex-shrink-0 shadow-lg shadow-zinc-200">🤖</div>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 truncate tracking-tighter uppercase">{wallet.agent_name}</h1>
              {wallet.on_chain ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Live</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-50 border border-zinc-100">
                  <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Draft</span>
                </div>
              )}
            </div>
            <div className="mt-1.5 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">PDA:</span>
                <RevealCopy value={wallet.pda_address} chars={8} className="bg-zinc-50/50" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-6">
          {!wallet.on_chain && (
            <button
              onClick={deployToChain}
              disabled={isDeploying}
              className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-zinc-200 hover:scale-105 active:scale-95 transition-all"
            >
              {isDeploying ? 'Deploying...' : 'Init Vault →'}
            </button>
          )}
          <div className="sm:text-right bg-white p-4 rounded-xl border border-gray-100 sm:border-0 sm:p-0">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Balance</p>
            <p className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tighter">
              {(wallet.balance_sol || 0).toFixed(4)}
              <span className="text-sm font-bold text-gray-400 ml-2 tracking-widest">SOL</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-6 w-fit">
        {['policy', 'history'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all capitalize ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'policy' ? '🧠 Policy' : '📖 History'}
          </button>
        ))}
      </div>

      {/* ── Policy Tab ─────────────────────────────────────────────── */}
      {activeTab === 'policy' && (
        <PolicyEditor
          policy={wallet.policy}
          walletId={wallet.id}
          onSave={(updatedPolicy) => {
            setWallet(w => ({ ...w, policy: updatedPolicy }))
          }}
        />
      )}

      {/* ── History Tab ─────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <TransactionHistory walletId={wallet.id} />
      )}
    </div>
  )
}

function TransactionHistory({ walletId }) {
  const [logs, setLogs] = useState(DEMO_LOGS)

  return (
    <div className="card divide-y divide-gray-50">
      <div className="px-6 py-4">
        <h3 className="font-bold text-gray-900">Transaction History</h3>
      </div>
      {logs.map(log => (
        <div key={log.id} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="mt-1 sm:mt-0 flex-shrink-0">
              {log.status === 'APPROVED' ? (
                <Badge variant="success">Approved</Badge>
              ) : (
                <Badge variant="destructive">Rejected</Badge>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{log.description || 'Payment'}</p>
              <div className="mt-1">
                <RevealCopy value={log.recipient_address} chars={6} />
              </div>
            </div>
          </div>
          <div className="flex sm:flex-col justify-between items-end gap-1 px-3 sm:px-0 py-2 sm:py-0 bg-gray-50 sm:bg-transparent rounded-lg">
            <p className="text-sm font-black text-gray-900 whitespace-nowrap">{log.amount_sol} SOL</p>
            <p className="text-[10px] text-gray-400">{new Date(log.created_at).toLocaleDateString()} · {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

const DEMO_LOGS = [
  { id: '1', status: 'APPROVED', description: 'API payment', recipient_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', amount_sol: 0.01, created_at: new Date().toISOString() },
  { id: '2', status: 'REJECTED', description: 'Over limit', recipient_address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe8bv', amount_sol: 2.0, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', status: 'APPROVED', description: 'Data feed', recipient_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', amount_sol: 0.001, created_at: new Date(Date.now() - 7200000).toISOString() },
]
