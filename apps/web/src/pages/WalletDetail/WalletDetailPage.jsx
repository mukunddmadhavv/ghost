import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PolicyEditor from '../../components/PolicyEditor.jsx'

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
    <div className="p-8 animate-fade-in max-w-4xl">
      {/* ── Breadcrumb ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/dashboard" className="hover:text-gray-700 transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{wallet.agent_name}</span>
      </div>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">🤖</div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">{wallet.agent_name}</h1>
            <p className="font-mono text-xs text-gray-400 mt-0.5">{wallet.pda_address}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 mb-0.5">Balance</p>
          <p className="text-3xl font-black text-gray-900">
            {(wallet.balance_sol || 0).toFixed(4)}
            <span className="text-lg font-semibold text-gray-400 ml-1">SOL</span>
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
        <div key={log.id} className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={log.status === 'APPROVED' ? 'badge-approved' : 'badge-rejected'}>
              {log.status === 'APPROVED' ? '✅ Approved' : '❌ Rejected'}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">{log.description || 'Payment'}</p>
              <p className="font-mono text-xs text-gray-400 truncate max-w-[200px]">{log.recipient_address}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">{log.amount_sol} SOL</p>
            <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</p>
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
