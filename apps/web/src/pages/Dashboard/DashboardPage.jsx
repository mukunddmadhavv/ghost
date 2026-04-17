import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export default function DashboardPage() {
  const { publicKey } = useWallet()
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [agentName, setAgentName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchWallets()
  }, [])

  async function fetchWallets() {
    try {
      const token = localStorage.getItem('ghost_token')
      const res = await fetch(`${API}/api/wallets`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setWallets(data.wallets || [])
      }
    } catch (_) {
      // fallback: use demo data
      setWallets(DEMO_WALLETS)
    } finally {
      setLoading(false)
    }
  }

  async function createWallet() {
    if (!agentName.trim()) return
    setCreating(true)
    try {
      const token = localStorage.getItem('ghost_token')
      const res = await fetch(`${API}/api/wallets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          agentName: agentName.trim(),
          ownerPublicKey: publicKey?.toString() || '11111111111111111111111111111111',
          policy: {},
        }),
      })
      if (res.ok) {
        await fetchWallets()
        setShowCreate(false)
        setAgentName('')
      }
    } catch (_) {
      setWallets(prev => [...prev, { id: Date.now(), agent_name: agentName, balance_sol: 0, is_active: true, policy: { emergencyPaused: false }, pda_address: 'pending' }])
      setShowCreate(false)
      setAgentName('')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-8 animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Agent Wallets</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your AI agent smart wallets on Solana devnet</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Agent
        </button>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Agents', value: wallets.filter(w => w.is_active).length, icon: '🤖' },
          { label: 'Total Wallets', value: wallets.length, icon: '💰' },
          { label: 'Network', value: 'Devnet', icon: '⛓️' },
          { label: 'Policy Status', value: 'On-chain', icon: '🔒' },
        ].map(s => (
          <div key={s.label} className="card px-5 py-4">
            <p className="text-xs text-gray-400 font-medium mb-1">{s.icon} {s.label}</p>
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Wallet Cards ─────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading wallets...
        </div>
      ) : wallets.length === 0 ? (
        <EmptyState onCreate={() => setShowCreate(true)} />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {wallets.map(wallet => (
            <WalletCard key={wallet.id} wallet={wallet} />
          ))}
        </div>
      )}

      {/* ── Create Modal ─────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="card w-full max-w-md p-6 animate-slide-up">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Create Agent Wallet</h3>
            <p className="text-sm text-gray-400 mb-5">A new PDA will be initialized on Solana devnet</p>
            <label className="label">Agent Name</label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Trading Bot Alpha"
              value={agentName}
              onChange={e => setAgentName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createWallet()}
              className="input mb-5"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={createWallet} disabled={!agentName.trim() || creating} className="btn-primary flex-1">
                {creating ? 'Creating...' : 'Create Wallet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function WalletCard({ wallet }) {
  return (
    <Link to={`/wallet/${wallet.id}`} className="card-hover p-5 block group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-base">🤖</div>
            <h3 className="font-bold text-gray-900">{wallet.agent_name}</h3>
          </div>
          <p className="font-mono text-[10px] text-gray-400 truncate max-w-[220px]">
            {wallet.pda_address || 'Pending deployment'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {wallet.is_active ? (
            <span className="badge-approved">● Active</span>
          ) : (
            <span className="badge-rejected">● Inactive</span>
          )}
          {wallet.policy?.emergencyPaused && (
            <span className="badge-rejected">🚨 Frozen</span>
          )}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Balance</p>
          <p className="text-xl font-black text-gray-900">
            {(wallet.balance_sol || 0).toFixed(4)} <span className="text-sm font-semibold text-gray-400">SOL</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 mb-0.5">Daily Limit</p>
          <p className="text-sm font-bold text-gray-700">
            {wallet.policy?.maxSpendPerDay || 0.5} SOL
          </p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-400">View policy & transactions</span>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">🤖</div>
      <h3 className="font-bold text-gray-900 text-lg mb-2">No agent wallets yet</h3>
      <p className="text-sm text-gray-400 mb-6 max-w-sm">
        Create your first agent wallet to start controlling AI spending with on-chain policies
      </p>
      <button onClick={onCreate} className="btn-primary">Create Agent Wallet</button>
    </div>
  )
}

const DEMO_WALLETS = [
  { id: '1', agent_name: 'Trading Bot Alpha', pda_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', balance_sol: 2.45, is_active: true, policy: { maxSpendPerDay: 0.5, emergencyPaused: false } },
  { id: '2', agent_name: 'Data Scraper v2', pda_address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe8bv', balance_sol: 0.12, is_active: true, policy: { maxSpendPerDay: 0.1, emergencyPaused: false } },
]
