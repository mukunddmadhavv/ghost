import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PolicyEditor from '../../components/PolicyEditor.jsx'
import { RevealCopy } from '../../components/ui/reveal-copy'
import { Badge } from '../../components/ui/badge'

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
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('policy')

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
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">🤖</div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 truncate">{wallet.agent_name}</h1>
            <div className="mt-1.5 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">PDA:</span>
                <RevealCopy value={wallet.pda_address} chars={8} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">ID:</span>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 border border-gray-100 font-mono text-[10px] text-gray-500">
                  {wallet.id}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="sm:text-right bg-white p-4 rounded-xl border border-gray-100 sm:border-0 sm:p-0">
          <p className="text-xs text-gray-400 mb-0.5">Balance</p>
          <p className="text-2xl sm:text-3xl font-black text-gray-900">
            {(wallet.balance_sol || 0).toFixed(4)}
            <span className="text-sm sm:text-lg font-semibold text-gray-400 ml-1">SOL</span>
          </p>
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
