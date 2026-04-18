import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, Key, Calendar, Copy } from 'lucide-react'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export default function ApiSettings() {
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKey, setGeneratedKey] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchKeys()
  }, [])

  async function fetchKeys() {
    const token = localStorage.getItem('ghost_token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const res = await fetch(`${API}/api/keys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch keys')
      const data = await res.json()
      setKeys(data.keys || [])
    } catch (err) {
      toast.error('Failed to fetch API keys')
    } finally {
      setLoading(false)
    }
  }

  async function generateKey() {
    if (!newKeyName.trim()) return
    const token = localStorage.getItem('ghost_token')
    if (!token) return

    try {
      setCreating(true)
      const res = await fetch(`${API}/api/keys/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newKeyName })
      })
      
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      setGeneratedKey(result.apiKey)
      fetchKeys()
      setNewKeyName('')
      toast.success('API Key generated')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function revokeKey(id) {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return
    const token = localStorage.getItem('ghost_token')
    if (!token) return

    try {
      const res = await fetch(`${API}/api/keys/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to revoke key')
      setKeys(keys.filter(k => k.id !== id))
      toast.success('Key revoked')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3">Developer Settings</h1>
          <p className="text-gray-500 max-w-lg leading-relaxed text-sm">
            Manage your Ghost Secret Keys to programmatically execute payments through your agent wallets.
          </p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2 px-6 py-3 shadow-blue-200/50 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Generate New Key
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : keys.length === 0 ? (
        <div className="card p-12 text-center border-dashed border-2 border-gray-100 bg-transparent">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 flex items-center justify-center rounded-2xl mx-auto mb-4">
            <Key className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-2">No API keys yet</h3>
          <p className="text-sm text-gray-400 mb-6">Create your first secret key to start automating payments.</p>
          <button onClick={() => setShowCreate(true)} className="btn-secondary">Generate Key</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {keys.map(key => (
            <div key={key.id} className="card p-5 hover:border-gray-300 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 text-gray-400 flex items-center justify-center rounded-xl border border-gray-100 transition-colors group-hover:bg-blue-50 group-hover:text-blue-500 overflow-hidden">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{key.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <code className="text-[11px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase tracking-wider">
                        {key.key_mask}
                      </code>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Created {new Date(key.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-4 hidden md:block">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-0.5">Last Used</p>
                    <p className="text-xs font-medium text-gray-900">
                      {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <button 
                    onClick={() => revokeKey(key.id)}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Revoke Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Generate Modal ─────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] animate-fade-in p-4">
          <div className="card w-full max-w-md p-8 animate-slide-up shadow-2xl relative overflow-hidden">
            {generatedKey ? (
              <div className="animate-fade-in">
                <div className="w-16 h-16 bg-green-50 text-green-500 flex items-center justify-center rounded-2xl mb-6 mx-auto text-3xl">
                  ✨
                </div>
                <h3 className="text-2xl font-black text-gray-900 text-center mb-2">Secret Key Generated</h3>
                <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
                  Copy this key now. For your security, we won't show it to you again.
                </p>
                <div className="relative group mb-8">
                  <div className="absolute inset-0 bg-blue-500 blur-xl opacity-10 group-hover:opacity-20 transition-opacity" />
                  <div className="relative flex items-center gap-3 p-4 bg-gray-50 border-2 border-blue-100 rounded-2xl font-mono text-xs break-all text-gray-900 group-hover:border-blue-200 transition-colors">
                    <span className="flex-1 select-all">{generatedKey}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(generatedKey)
                        toast.success('Key copied!')
                      }}
                      className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors shrink-0"
                    >
                      <Copy className="w-4 h-4 text-blue-500" />
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowCreate(false)
                    setGeneratedKey(null)
                  }} 
                  className="btn-primary w-full py-4 text-sm font-black tracking-widest"
                >
                  I'VE SAVED THE KEY
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-black text-gray-900 mb-2 mt-2">Generate API Key</h3>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                  Give your key a name to identify it later.
                </p>
                
                <div className="space-y-6">
                  <div>
                    <label className="label uppercase tracking-widest text-[10px] mb-2 inline-block">Key Name</label>
                    <input
                      autoFocus
                      type="text"
                      placeholder="e.g. My Trading Bot"
                      value={newKeyName}
                      onChange={e => setNewKeyName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && generateKey()}
                      className="input py-3.5 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setShowCreate(false)} 
                      disabled={creating}
                      className="btn-ghost flex-1 py-3.5 text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={generateKey} 
                      disabled={!newKeyName.trim() || creating} 
                      className="btn-primary flex-1 py-3.5 text-sm shadow-lg shadow-blue-500/20"
                    >
                      {creating ? 'Generating...' : 'Generate key'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
