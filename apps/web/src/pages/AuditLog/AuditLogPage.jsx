import { useState, useEffect, useRef } from 'react'
import { Loader2, ArrowRight, ExternalLink, History, Terminal as TerminalIcon, ShieldCheck, Activity, Search } from 'lucide-react'
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
        <Loader2 className="w-8 h-8 text-zinc-900 animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 animate-pulse">Syncing Ghost Ledger</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 relative pb-32 overflow-hidden selection:bg-emerald-100 selection:text-emerald-900">
      {/* ── Background elements ───────────────────────────────────── */}
      <div className="absolute inset-0 technical-grid opacity-60 pointer-events-none" />

      {/* ── Editorial Header ────────────────────────────────────── */}
      <div className="relative z-10 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 py-20">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-16">
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-50 border border-zinc-100">
                  <TerminalIcon className="w-3.5 h-3.5 text-zinc-900" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-900">
                    Live Operational Ledger
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]", connected ? "bg-emerald-500 animate-pulse" : "bg-zinc-200")} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900">
                    {connected ? 'Sync Stream Active' : 'Offline Ledger'}
                  </span>
                </div>
              </div>
              
              <h1 className="text-7xl font-black tracking-tighter leading-none editorial-heading">
                <span className="text-gradient-emerald">Transaction</span><br />
                <span className="font-serif-premium italic font-light text-zinc-900">Ledger.</span>
              </h1>

              <div className="flex flex-wrap gap-3 pt-6">
                {['ALL', 'APPROVED', 'REJECTED'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] transition-all px-8 py-3 rounded-full border",
                      filter === f 
                        ? "bg-zinc-900 border-zinc-900 text-white shadow-xl shadow-zinc-200" 
                        : "bg-white border-zinc-100 text-zinc-400 hover:text-zinc-900 hover:border-zinc-300"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics Bento Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full xl:w-auto">
              <div className="bento-card p-8 min-w-[240px] relative group border-none bg-zinc-50/50">
                <div className="absolute top-4 right-4 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
                  <Activity className="w-8 h-8" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900 mb-3 ml-1">Volume Executed</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-gradient-emerald tracking-tighter">
                    {logs.reduce((acc, l) => acc + (l.status === 'APPROVED' ? l.amount_sol : 0), 0).toFixed(4)}
                  </span>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">SOL</span>
                </div>
              </div>
              <div className="bento-card p-8 min-w-[240px] relative group border-none bg-zinc-50/50">
                <div className="absolute top-4 right-4 text-zinc-900/10 group-hover:text-zinc-900/20 transition-colors">
                  <Search className="w-8 h-8" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900 mb-3 ml-1">Processed Signals</p>
                <span className="text-5xl font-black text-zinc-900 tracking-tighter font-serif-premium italic">
                  {logs.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── The Boutique Timeline ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-8 py-24 relative z-10">
        {filteredLogs.length === 0 ? (
          <div className="py-40 text-center bento-card border-dashed border-2 border-zinc-100 bg-transparent rounded-[3rem]">
            <p className="text-zinc-300 text-[12px] font-black uppercase tracking-[0.5em]">No Cryptographic History Found</p>
          </div>
        ) : (
          <div className="relative space-y-4">
            {/* The technical vertical line */}
            <div className="absolute left-[39px] top-12 bottom-12 w-px bg-zinc-100" />

            {filteredLogs.map((log, i) => (
              <div key={log.id || i} className="group relative pl-24 transition-all duration-700">
                {/* Timeline node */}
                <div className={cn(
                  "absolute left-[35px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full z-10 transition-all duration-500 group-hover:scale-150 border-2 border-white",
                  log.status === 'APPROVED' 
                    ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                    : "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                )} />

                <div className="bento-card p-8 sm:p-10 rounded-[2.5rem] flex flex-col lg:flex-row lg:items-center justify-between gap-10 hover:border-zinc-900/10 hover:shadow-2xl hover:shadow-zinc-200/40 transition-all duration-700 bg-white relative overflow-hidden group/item">
                  <div className="flex-1 min-w-0 relative z-10">
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                       <div className="flex items-center gap-2 px-3 py-1 rounded bg-zinc-50 border border-zinc-100">
                          <span className="text-[10px] font-black text-zinc-400 tracking-wider">
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                          </span>
                       </div>
                       <span className="w-2 h-px bg-zinc-100" />
                       <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 group-hover/item:text-zinc-900 transition-colors">
                            {log.agent_wallets?.agent_name || log.agent_name || 'Protocol Engine'}
                          </span>
                          {log.status === 'APPROVED' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/40" />}
                       </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-baseline gap-4 mb-6">
                      <h3 className={cn(
                        "text-4xl font-black tracking-tighter uppercase",
                        log.status === 'APPROVED' ? "text-gradient-emerald" : "text-zinc-400"
                      )}>
                        {log.amount_sol.toFixed(4)} <span className="text-zinc-200 text-2xl font-light">SOL</span>
                      </h3>
                      <div className="flex items-center gap-3">
                         <span className="w-1 h-1 bg-zinc-100 rounded-full" />
                         <code className="text-[11px] font-mono text-zinc-400 truncate max-w-[240px] bg-zinc-50 px-3 py-1 rounded-lg border border-zinc-100/50">
                            {log.recipient_address}
                         </code>
                      </div>
                    </div>

                    <p className={cn(
                      "text-[13px] font-medium leading-relaxed max-w-3xl transition-colors tracking-tight",
                      log.status === 'REJECTED' ? "text-red-500/70" : "text-zinc-500 group-hover/item:text-zinc-700"
                    )}>
                      {log.rejection_reason || log.description || 'Verified cryptographic instruction executed via on-chain Program Derived Address.'}
                    </p>
                  </div>

                  {log.status === 'APPROVED' && (
                    <a 
                      href={`https://solscan.io/tx/${log.tx_signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative z-10 flex items-center gap-4 px-8 py-5 bg-zinc-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-zinc-200 group/btn"
                    >
                      <span className="relative z-10">Verify Signal</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="max-w-7xl mx-auto px-8 mt-48 border-t border-zinc-100 pt-20 pb-20 flex flex-col sm:flex-row items-center justify-between gap-10 relative z-10">
         <div className="flex items-center gap-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-300">Secure Audit // Ghost Protocol 2026</p>
         </div>
         <div className="flex gap-16">
            <a href="#" className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 hover:text-zinc-900 transition-colors">Documentation</a>
            <a href="#" className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 hover:text-zinc-900 transition-colors">Privacy</a>
         </div>
      </footer>
    </div>
  )
}
