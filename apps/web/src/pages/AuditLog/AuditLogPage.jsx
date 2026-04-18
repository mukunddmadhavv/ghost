import { useState, useEffect, useRef } from 'react'
import { Loader2, ArrowRight, ExternalLink, History } from 'lucide-react'
import { cn } from '../../lib/utils'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export default function AuditLogPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)

  const fetchLogs = async () => {
    const token = localStorage.getItem('ghost_token')
    if (!token) {
      setLoading(false)
      setError("Please login to view logs")
      return
    }

    try {
      setLoading(true)
      const res = await fetch(`${API}/api/audit?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch logs')
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    const token = localStorage.getItem('ghost_token')
    if (token) {
      const es = new EventSource(`${API}/api/audit/stream?token=${token}`)
      es.addEventListener('connected', () => setConnected(true))
      es.addEventListener('audit', (e) => {
        const log = JSON.parse(e.data)
        setLogs(prev => prev.some(l => l.id === log.id) ? prev : [log, ...prev])
      })
      es.onerror = () => setConnected(false)
      return () => es.close()
    }
  }, [])

  const filteredLogs = filter === 'ALL' ? logs : logs.filter(l => l.status === filter)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-8 h-8 text-black animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Syncing Ledger</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-32">
      {/* ── Editorial Header ────────────────────────────────────── */}
      <div className="bg-white border-b border-zinc-100 mb-12">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="bg-black text-white text-[8px] font-black uppercase tracking-[0.3em] px-2 py-1 rounded-sm">
                  Ledger v1.0
                </span>
                <div className="flex items-center gap-2">
                  <div className={cn("w-1 h-1 rounded-full", connected ? "bg-green-500" : "bg-zinc-200")} />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300">
                    {connected ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight leading-none">
                Transaction <span className="text-premium-green">Ledger.</span>
              </h1>
              <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                {['ALL', 'APPROVED', 'REJECTED'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "text-[9px] font-black uppercase tracking-[0.2em] transition-all px-3 py-1.5 border rounded-md",
                      filter === f ? "bg-zinc-900 border-zinc-900 text-white" : "bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Total Volume</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-premium-green tracking-tight">
                    {logs.reduce((acc, l) => acc + (l.status === 'APPROVED' ? l.amount_sol : 0), 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-300">SOL</span>
                </div>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Total Signals</p>
                <span className="text-2xl font-black text-zinc-900 tracking-tight">{logs.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── The Timeline Ledger ─────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6">
        {filteredLogs.length === 0 ? (
          <div className="py-24 text-center bg-white border border-zinc-50 rounded-2xl">
            <History className="w-10 h-10 text-zinc-50 mx-auto mb-4" />
            <p className="text-zinc-300 text-[9px] font-black uppercase tracking-[0.3em]">No matching records found</p>
          </div>
        ) : (
          <div className="relative space-y-px">
            {/* Vertical timeline line */}
            <div className="absolute left-[23px] top-6 bottom-6 w-[1px] bg-zinc-100" />

            {filteredLogs.map((log, i) => (
              <div key={log.id || i} className="group relative pl-16 py-4 transition-all duration-300">
                {/* Timeline node */}
                <div className={cn(
                  "absolute left-[20px] top-1/2 -translate-y-1/2 w-[7px] h-[7px] rounded-full z-10 border-2 transition-transform duration-300",
                  log.status === 'APPROVED' 
                    ? "bg-green-500 border-white shadow-[0_0_0_1px_rgba(34,197,94,0.1)]" 
                    : "bg-white border-red-400"
                )} />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 bg-white border border-transparent rounded-2xl transition-all duration-500 hover:border-zinc-100 hover:shadow-xl hover:shadow-zinc-200/20">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-300">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                       <span className="w-1 h-1 bg-zinc-100 rounded-full" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                          {log.agent_wallets?.agent_name || log.agent_name || 'System'}
                       </span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-2">
                      <h3 className={cn(
                        "text-xl sm:text-2xl font-black tracking-tighter",
                        log.status === 'APPROVED' ? "text-premium-green" : "text-zinc-900"
                      )}>
                        {log.amount_sol.toFixed(4)} <span className="text-zinc-300">SOL</span>
                      </h3>
                      <ArrowRight className="w-3 h-3 text-zinc-100 hidden sm:block" />
                      <code className="text-[9px] sm:text-[10px] font-mono text-zinc-300 truncate max-w-[150px] sm:max-w-none">
                        {log.recipient_address.slice(0, 8)}...{log.recipient_address.slice(-8)}
                      </code>
                    </div>

                    <p className={cn(
                      "text-[11px] font-medium leading-relaxed max-w-xl",
                      log.status === 'REJECTED' ? "text-red-400" : "text-zinc-500"
                    )}>
                      {log.rejection_reason || log.description || 'Verified execution via Ghost'}
                    </p>
                  </div>

                  {log.status === 'APPROVED' && (
                    <a 
                      href={`https://solscan.io/tx/${log.tx_signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-50 text-zinc-900 text-[9px] font-black uppercase tracking-widest border border-zinc-100 rounded-lg transition-all hover:bg-zinc-900 hover:text-white"
                    >
                      Verify
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="max-w-5xl mx-auto px-6 mt-32 border-t border-zinc-100 pt-12 flex items-center justify-between">
         <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-300">Ghost Ledger © 2026</p>
         <div className="flex gap-8">
            <a href="#" className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-black transition-colors">Documentation</a>
            <a href="#" className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-black transition-colors">Privacy</a>
         </div>
      </footer>
    </div>
  )
}
