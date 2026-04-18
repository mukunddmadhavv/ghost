import { useState } from 'react'
import toast from 'react-hot-toast'
import { SplitToEdit } from './ui/split-to-edit'

/**
 * PolicyEditor — The main hackathon WOW component
 * Live-editable rules that enforce on-chain spending policies
 *
 * Props:
 *   policy: object  — current policy state
 *   walletId: string — agent wallet ID
 *   onSave: fn(updatedPolicy) — called after successful save
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
      toast.success('✅ Policy updated on-chain')
      setHasChanges(false)
      onSave?.(policy)
    } catch (err) {
      toast.error('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card divide-y divide-gray-50">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h3 className="font-bold text-gray-900 text-base">Policy Engine</h3>
          <p className="text-xs text-gray-400 mt-0.5">Rules enforced on Solana devnet</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full font-medium">
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`btn-primary text-xs py-2 ${(!hasChanges || saving) ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {saving ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : 'Save Policy'}
          </button>
        </div>
      </div>

      {/* ── 🚨 Emergency Pause ─────────────────────────────────────── */}
      <div className="px-6 py-4">
        <div className="policy-row !border-0 !py-0">
          <div>
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <span className={policy.emergencyPaused ? 'text-red-500' : 'text-gray-900'}>
                🚨 Emergency Pause
              </span>
              {policy.emergencyPaused && (
                <span className="badge-rejected">FROZEN</span>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Immediately freeze all agent spending
            </p>
          </div>
          <Toggle
            value={policy.emergencyPaused}
            onChange={v => update('emergencyPaused', v)}
            activeColor="bg-red-500"
          />
        </div>
        {policy.emergencyPaused && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-red-700 font-medium">
              All payments are blocked. This is enforced on-chain — even server access cannot bypass this.
            </p>
          </div>
        )}
      </div>

      {/* ── 💰 Daily Spend Limit ───────────────────────────────────── */}
      <div className="px-6 py-5">
        <div className="policy-row !border-0 !py-0 mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">💰 Daily Spend Limit</p>
            <p className="text-xs text-gray-400 mt-0.5">Max SOL the agent can spend in 24 hours</p>
          </div>
          <span className="text-lg font-black text-gray-900">
            <span className="highlight-pill">{policy.maxSpendPerDay} SOL</span>
          </span>
        </div>
        {/* Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min="0.001"
            max="10"
            step="0.001"
            value={policy.maxSpendPerDay}
            onChange={e => update('maxSpendPerDay', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-gray-400 font-medium">
            <span>0.001 SOL</span>
            <span>5 SOL</span>
            <span>10 SOL</span>
          </div>
        </div>
        {/* Quick presets */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[0.1, 0.5, 1, 2, 5].map(v => (
            <button
              key={v}
              onClick={() => update('maxSpendPerDay', v)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                policy.maxSpendPerDay === v
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {v} SOL
            </button>
          ))}
        </div>
      </div>

      {/* ── ⚠️ Approval Threshold ────────────────────────────────── */}
      <div className="px-6 py-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">⚠️ Approval Threshold</p>
            <p className="text-xs text-gray-400 mt-0.5">Ask human before payments above this amount</p>
          </div>
          <span className="highlight-pill">{policy.requireApprovalAbove} SOL</span>
        </div>
        <input
          type="number"
          min="0.001"
          max="100"
          step="0.01"
          value={policy.requireApprovalAbove}
          onChange={e => update('requireApprovalAbove', parseFloat(e.target.value) || 0.001)}
          className="input max-w-[200px]"
        />
      </div>

      {/* ── 🕐 Time Restriction ──────────────────────────────────── */}
      <div className="px-6 py-5">
        <div className="policy-row !border-0 !py-0 mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">🕐 Time Restriction</p>
            <p className="text-xs text-gray-400 mt-0.5">Only allow payments during specific hours (UTC)</p>
          </div>
          <Toggle
            value={policy.timeRestriction?.enabled || false}
            onChange={v => updateTimeRestriction('enabled', v)}
          />
        </div>
        {policy.timeRestriction?.enabled && (
          <div className="mt-4 animate-fade-in">
            <p className="text-xs text-gray-400 mb-3">Active payment window (UTC hours)</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <SplitToEdit
                  label="Start"
                  initialHours={policy.timeRestriction.startHour}
                  onSave={v => updateTimeRestriction('startHour', v)}
                />
                <span className="text-gray-300 text-lg font-light mt-5">→</span>
                <SplitToEdit
                  label="End"
                  initialHours={policy.timeRestriction.endHour}
                  onSave={v => updateTimeRestriction('endHour', v)}
                />
              </div>
              <div className="mt-2 sm:mt-5">
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1.5 rounded-lg font-semibold whitespace-nowrap">
                  {String(policy.timeRestriction.startHour).padStart(2,'0')}:00 – {String(policy.timeRestriction.endHour).padStart(2,'0')}:00 UTC
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 📋 Recipient Allowlist ───────────────────────────────── */}
      <div className="px-6 py-5">
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-900 mb-0.5">
            📋 Recipient Allowlist
            {policy.allowedRecipients.length > 0 && (
              <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-semibold">
                {policy.allowedRecipients.length} addresses
              </span>
            )}
          </p>
          <p className="text-xs text-gray-400">
            {policy.allowedRecipients.length === 0
              ? 'No restrictions — agent can pay anyone. Add addresses to enforce allowlist.'
              : 'Agent can only pay these addresses.'}
          </p>
        </div>

        {/* Add address */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Paste Solana wallet address..."
            value={newRecipient}
            onChange={e => setNewRecipient(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRecipient()}
            className="input flex-1 font-mono text-xs"
          />
          <button onClick={addRecipient} className="btn-secondary text-xs whitespace-nowrap">
            + Add
          </button>
        </div>

        {/* Address list */}
        {policy.allowedRecipients.length > 0 ? (
          <div className="space-y-2">
            {policy.allowedRecipients.map(addr => (
              <div
                key={addr}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 group"
              >
                <span className="font-mono text-xs text-gray-700 truncate max-w-[300px]">{addr}</span>
                <button
                  onClick={() => removeRecipient(addr)}
                  className="text-gray-300 hover:text-red-500 transition-colors ml-3 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-3 bg-amber-50 rounded-lg border border-amber-100">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-amber-700">Open allowlist — agent can pay any address</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Toggle Component ──────────────────────────────────────────────────────── */
function Toggle({ value, onChange, activeColor = 'bg-blue-500' }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out focus:outline-none
        ${value ? activeColor : 'bg-gray-200'}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow
          transition duration-200 ease-in-out
          ${value ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}
