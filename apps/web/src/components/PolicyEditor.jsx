import { useState } from 'react'
import toast from 'react-hot-toast'
import { SplitToEdit } from './ui/split-to-edit'
import { ShieldCheck, Zap, Clock, Users, ArrowRight, Save, ShieldAlert } from 'lucide-react'

/**
 * PolicyEditor — The Premium Boutique Control Center
 * Live-editable rules that enforce on-chain spending policies
 */
export default function PolicyEditor({ policy: initialPolicy, walletId, onSave }) {
  const [policy, setPolicy] = useState(initialPolicy || {
    maxSpendPerDay: 0.5,
    allowedRecipients: [],
    timeRestriction: { enabled: false, startHour: 9, endHour: 21 },
    requireApprovalAbove: 1.0,
    emergencyPaused: false,
  })
  const [newRecipient, setNewRecipient] = useState('')
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  function update(key, value) {
    setPolicy(p => ({ ...p, [key]: value }))
    setHasChanges(true)
  }

  function updateTimeRestriction(key, value) {
    setPolicy(p => ({
      ...p,
      timeRestriction: { ...p.timeRestriction, [key]: value },
    }))
    setHasChanges(true)
  }

  function addRecipient() {
    const addr = newRecipient.trim()
    if (!addr || addr.length < 32) {
      toast.error('Enter a valid Solana address (32+ characters)')
      return
    }
    if (policy.allowedRecipients.includes(addr)) {
      toast.error('Address already in allowlist')
      return
    }
    update('allowedRecipients', [...policy.allowedRecipients, addr])
    setNewRecipient('')
  }

  function removeRecipient(addr) {
    update('allowedRecipients', policy.allowedRecipients.filter(a => a !== addr))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
      const token = localStorage.getItem('ghost_token')
      const res = await fetch(`${API}/api/wallets/${walletId}/policy`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ policy }),
      })
      if (!res.ok) throw new Error('Failed to save policy')
      toast.success('✅ On-Chain Policy Synchronized')
      setHasChanges(false)
      onSave?.(policy)
    } catch (err) {
      toast.error('Encryption/Sync failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="bento-card p-10 flex flex-col md:flex-row md:items-center justify-between gap-12 relative overflow-hidden">
        <div className="absolute inset-0 technical-grid opacity-10 pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            <ShieldCheck className="w-3 h-3" />
            V1 Security Standard
          </div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter leading-none editorial-heading">
            Policy <span className="font-serif-premium italic font-light text-zinc-400">Engine.</span>
          </h1>
          <p className="text-sm text-zinc-500 font-medium tracking-tight max-w-sm">
            Rules defined here are cryptographically enforced on the Solana blockchain.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6">
          {hasChanges && (
             <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Local State</p>
                <p className="text-xs font-bold text-zinc-400">Unsaved Changes</p>
             </div>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`
              group relative px-10 py-4 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-zinc-200 transition-all duration-500
              ${(!hasChanges || saving) ? 'opacity-30 cursor-not-allowed scale-95 grayscale' : 'hover:scale-105 active:scale-95'}
            `}
          >
            <span className="relative z-10 flex items-center gap-3">
              {saving ? 'Synchronizing...' : 'Save Policy'}
              {!saving && <Save className="w-3.5 h-3.5 text-emerald-400" />}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── 🚨 Emergency Pause ─────────────────────────────────────── */}
        <div className={`bento-card p-8 transition-colors duration-500 ${policy.emergencyPaused ? 'bg-red-50/50 border-red-100' : 'bg-white'}`}>
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-1">
              <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${policy.emergencyPaused ? 'text-red-600' : 'text-zinc-400'}`}>01. Override Status</h3>
              <p className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">Freeze Protocol</p>
              <p className="text-xs text-zinc-400 font-medium mt-2 max-w-[200px]">Immediately block all outbound transaction signals.</p>
            </div>
            <Toggle
              value={policy.emergencyPaused}
              onChange={v => update('emergencyPaused', v)}
              activeColor="bg-red-600"
            />
          </div>
          {policy.emergencyPaused && (
            <div className="mt-8 p-6 rounded-2xl bg-white border border-red-100 flex items-start gap-4 animate-slide-up shadow-sm">
              <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-600 font-bold leading-relaxed uppercase tracking-wider">
                CRITICAL: The agent is currently frozen on-chain. All payment attempts will be REJECTED manually by the PDA logic.
              </p>
            </div>
          )}
        </div>

        {/* ── 💰 Daily Spend Limit ───────────────────────────────────── */}
        <div className="bento-card p-8 bg-white space-y-8">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">02. Velocity Control</h3>
              <p className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">Daily Bound</p>
              <p className="text-xs text-zinc-400 font-medium mt-2">Max SOL the agent can spend in 24 hours.</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-zinc-900 tracking-tighter">{policy.maxSpendPerDay.toFixed(2)}</span>
              <span className="text-[10px] font-black text-zinc-300 ml-2 uppercase">SOL</span>
            </div>
          </div>
          
          <div className="space-y-6">
            <input
              type="range"
              min="0.001"
              max="10"
              step="0.001"
              value={policy.maxSpendPerDay}
              onChange={e => update('maxSpendPerDay', parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-zinc-900"
            />
            <div className="flex flex-wrap gap-2">
              {[0.1, 0.5, 1, 2, 5].map(v => (
                <button
                  key={v}
                  onClick={() => update('maxSpendPerDay', v)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    policy.maxSpendPerDay === v
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300'
                  }`}
                >
                  {v} SOL
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── ⚠️ Approval Threshold ────────────────────────────────── */}
        <div className="bento-card p-8 bg-white space-y-8">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">03. Human-in-the-Loop</h3>
              <p className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">Approval Gate</p>
              <p className="text-xs text-zinc-400 font-medium mt-2">Require manual authorization for payments exceeding:</p>
            </div>
            <div className="relative min-w-[120px]">
              <input
                type="number"
                min="0.001"
                step="0.01"
                value={policy.requireApprovalAbove}
                onChange={e => update('requireApprovalAbove', parseFloat(e.target.value) || 0.001)}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-xl font-black text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-right"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-300 uppercase">SOL</span>
            </div>
          </div>
        </div>

        {/* ── 🕐 Time Restriction ──────────────────────────────────── */}
        <div className={`bento-card p-8 transition-colors duration-500 ${policy.timeRestriction?.enabled ? 'bg-zinc-50/50 border-zinc-100' : 'bg-white'}`}>
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">04. Temporal Policy</h3>
              <p className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">Operating Hours</p>
              <p className="text-xs text-zinc-400 font-medium mt-2">Enforce spending windows based on UTC time.</p>
            </div>
            <Toggle
              value={policy.timeRestriction?.enabled || false}
              onChange={v => updateTimeRestriction('enabled', v)}
            />
          </div>
          {policy.timeRestriction?.enabled && (
            <div className="space-y-8 animate-slide-up">
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300 mb-3 ml-1">Daily Start</p>
                  <input 
                    type="range" min="0" max="23" value={policy.timeRestriction.startHour}
                    onChange={v => updateTimeRestriction('startHour', parseInt(v.target.value))}
                    className="w-full h-1 bg-zinc-100 rounded-full appearance-none accent-zinc-900" 
                  />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-100 mt-6" />
                <div className="flex-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300 mb-3 ml-1">Daily End</p>
                  <input 
                    type="range" min="0" max="23" value={policy.timeRestriction.endHour}
                    onChange={v => updateTimeRestriction('endHour', parseInt(v.target.value))}
                    className="w-full h-1 bg-zinc-100 rounded-full appearance-none accent-zinc-900" 
                  />
                </div>
              </div>
              <div className="flex items-center justify-center p-4 rounded-2xl bg-zinc-900 text-white text-[11px] font-black tracking-[0.2em] uppercase">
                {String(policy.timeRestriction.startHour).padStart(2,'0')}:00 — {String(policy.timeRestriction.endHour).padStart(2,'0')}:00 UTC
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 📋 Recipient Allowlist ───────────────────────────────── */}
      <div className="bento-card p-10 bg-white">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10 pb-8 border-b border-zinc-50">
          <div className="space-y-1">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">05. Trust Infrastructure</h3>
            <p className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Recipient Allowlist</p>
            <p className="text-sm text-zinc-500 font-medium tracking-tight mt-3">
              {policy.allowedRecipients.length === 0
                ? 'The protocol is currently open. Adding addresses will enforce a strict trust boundary.'
                : 'The agent is cryptographically restricted to these verified addresses.'}
            </p>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Active Trusts</p>
                <p className="text-xl font-black text-zinc-900 tracking-tighter uppercase leading-none">{policy.allowedRecipients.length}</p>
             </div>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="SOLANA_ADDRESS_SYNC_PDA..."
            value={newRecipient}
            onChange={e => setNewRecipient(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRecipient()}
            className="flex-1 bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-xs font-mono text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all"
          />
          <button 
            onClick={addRecipient} 
            className="px-10 py-4 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-zinc-200"
          >
            Authorize Address
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {policy.allowedRecipients.map(addr => (
            <div
              key={addr}
              className="flex items-center justify-between px-6 py-4 bg-zinc-50/50 rounded-2xl border border-zinc-100 group hover:border-zinc-900/10 transition-all duration-300"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="font-mono text-[10px] text-zinc-600 truncate">{addr}</span>
              </div>
              <button
                onClick={() => removeRecipient(addr)}
                className="text-zinc-200 hover:text-red-500 transition-colors ml-4 p-1 rounded-lg hover:bg-red-50"
              >
                <ArrowRight className="w-4 h-4 rotate-45" />
              </button>
            </div>
          ))}
        </div>

        {policy.allowedRecipients.length === 0 && (
          <div className="flex items-center gap-4 px-6 py-6 bg-amber-50/50 rounded-2xl border border-amber-100/50 animate-fade-in text-center justify-center">
            <p className="text-[11px] text-amber-700 font-bold uppercase tracking-widest leading-relaxed">
              Open Protocol State — Unrestricted Transfers Enabled
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Toggle Component ──────────────────────────────────────────────────────── */
function Toggle({ value, onChange, activeColor = 'bg-zinc-900' }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${value ? activeColor : 'bg-zinc-100'}`}
    >
      <span
        className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-xl transition-transform duration-300 ease-in-out ${value ? 'translate-x-6' : 'translate-x-0'}`}
      />
    </button>
  )
}
