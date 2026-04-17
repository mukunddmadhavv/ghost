import { useState, useEffect, useRef } from 'react'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export default function AuditLogPage() {
  const [logs, setLogs] = useState(DEMO_LOGS)
  const [filter, setFilter] = useState('ALL')
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    // Connect to SSE stream
    const token = localStorage.getItem('ghost_token')
    if (token) {
      const es = new EventSource(`${API}/api/audit/stream?token=${token}`)
      es.addEventListener('connected', () => setConnected(true))
      es.addEventListener('audit', (e) => {
        const log = JSON.parse(e.data)
        setLogs(prev => [log, ...prev])
      })
      es.onerror = () => setConnected(false)
      return () => es.close()
    }
  }, [])

  const filtered = filter === 'ALL' ? logs : logs.filter(l => l.status === filter)

  return (
    <div className="p-8 animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Audit Log</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-400 text-sm">Every action your agents take, on-chain</p>
            <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${connected ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {connected ? 'Live' : 'Demo'}
            </span>
          </div>
        </div>
        {/* Filter */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {['ALL', 'APPROVED', 'REJECTED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f === 'ALL' ? '📋 All' : f === 'APPROVED' ? '✅ Approved' : '❌ Rejected'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats bar ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card px-5 py-4">
          <p className="text-xs text-gray-400 font-medium mb-1">Total Transactions</p>
          <p className="text-2xl font-black text-gray-900">{logs.length}</p>
        </div>
        <div className="card px-5 py-4">
          <p className="text-xs text-gray-400 font-medium mb-1">✅ Approved</p>
          <p className="text-2xl font-black text-green-600">
            {logs.filter(l => l.status === 'APPROVED').length}
          </p>
        </div>
        <div className="card px-5 py-4">
          <p className="text-xs text-gray-400 font-medium mb-1">❌ Rejected by Policy</p>
          <p className="text-2xl font-black text-red-500">
            {logs.filter(l => l.status === 'REJECTED').length}
          </p>
        </div>
      </div>

      {/* ── Log Table ──────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipient</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((log, i) => (
                <tr key={log.id || i} className="hover:bg-gray-50 transition-colors animate-fade-in">
                  <td className="px-5 py-3.5">
                    <span className={log.status === 'APPROVED' ? 'badge-approved' : 'badge-rejected'}>
                      {log.status === 'APPROVED' ? '✅ Approved' : '❌ Rejected'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-gray-900">{log.agent_name || 'Trading Bot'}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-gray-500 truncate block max-w-[160px]">
                      {log.recipient_address}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-gray-900">{log.amount_sol} SOL</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {log.rejection_reason ? (
                      <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded font-medium max-w-[200px] truncate block">
                        {log.rejection_reason}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

const DEMO_LOGS = [
  { id: '1', status: 'APPROVED', agent_name: 'Trading Bot Alpha', recipient_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', amount_sol: 0.01, rejection_reason: null, created_at: new Date().toISOString() },
  { id: '2', status: 'REJECTED', agent_name: 'Trading Bot Alpha', recipient_address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe8bv', amount_sol: 2.0, rejection_reason: 'DAILY_LIMIT_EXCEEDED: Would spend 2.5 SOL, limit is 0.5 SOL', created_at: new Date(Date.now() - 120000).toISOString() },
  { id: '3', status: 'APPROVED', agent_name: 'Data Scraper v2', recipient_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', amount_sol: 0.001, rejection_reason: null, created_at: new Date(Date.now() - 300000).toISOString() },
  { id: '4', status: 'REJECTED', agent_name: 'Data Scraper v2', recipient_address: '9xNQSBN9ck4VqMXC47aKWmpKAUsPFaE5UnVPRy5vPGXM', amount_sol: 0.05, rejection_reason: 'RECIPIENT_NOT_ALLOWED: Address not in allowlist', created_at: new Date(Date.now() - 600000).toISOString() },
  { id: '5', status: 'APPROVED', agent_name: 'Trading Bot Alpha', recipient_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', amount_sol: 0.001, rejection_reason: null, created_at: new Date(Date.now() - 900000).toISOString() },
]
