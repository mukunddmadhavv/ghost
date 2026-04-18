import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import * as anchor from '@coral-xyz/anchor'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { Buffer } from 'buffer'
import bs58 from 'bs58'
import toast from 'react-hot-toast'
import { RevealCopy } from '../../components/ui/reveal-copy'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'

// Polyfill Buffer for the browser environment
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer
}

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export default function DashboardPage() {
  const { connection } = useConnection()
  const { publicKey, signMessage, connected, signTransaction, signAllTransactions } = useWallet()
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [agentName, setAgentName] = useState('')
  const [creating, setCreating] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    if (connected && !localStorage.getItem('ghost_token')) {
      setNeedsLogin(true)
      setLoading(false)
    } else if (connected && localStorage.getItem('ghost_token')) {
      setNeedsLogin(false)
      fetchWallets()
    } else if (!connected) {
      setWallets([])
      setLoading(false)
      setNeedsLogin(false)
    } else {
      // Fallback
      fetchWallets()
    }
  }, [connected])

  async function handleLogin() {
    if (!signMessage) {
      toast.error('Wallet does not support signing messages');
      return;
    }
    setIsLoggingIn(true);
    try {
      const message = new TextEncoder().encode('Sign this message to log into tryghost.dev');
      const signature = await signMessage(message);

      const res = await fetch(`${API}/api/auth/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey: publicKey.toString(),
          signature: bs58.encode(signature)
        })
      });

      if (!res.ok) throw new Error('API Login Failed');

      const { token } = await res.json();
      localStorage.setItem('ghost_token', token);

      toast.success('Successfully authenticated!');
      setNeedsLogin(false);
      setLoading(true);
      fetchWallets();
    } catch (err) {
      console.error(err);
      toast.error('Authentication failed');
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function fetchWallets() {
    setError(null)
    try {
      const token = localStorage.getItem('ghost_token')
      if (!token) {
        setNeedsLogin(true)
        setLoading(false)
        return
      }
      const res = await fetch(`${API}/api/wallets`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        // Token expired — force re-login
        localStorage.removeItem('ghost_token')
        setNeedsLogin(true)
        setLoading(false)
        return
      }
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setWallets(data.wallets || [])
    } catch (err) {
      console.error('fetchWallets failed:', err)
      setError(err.message)
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
        toast.success('Agent saved to database! Click Deploy to Chain to activate.')
      }
    } catch (_) {
      toast.error('Failed to create agent')
    } finally {
      setCreating(false)
    }
  }

  async function deployToChain(wallet) {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet first')
      return
    }

    setIsDeploying(true)
    const tId = toast.loading(`Deploying ${wallet.agent_name} to Solana...`)

    try {
      // 1. Fetch IDL
      const idlRes = await fetch(`${API}/api/idl`)
      if (!idlRes.ok) throw new Error('Could not fetch Anchor IDL')
      const idl = await idlRes.json()

      // 2. Setup Anchor Provider
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

      // 3. Initialize Wallet on Chain
      const [walletPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('ghost-wallet'),
          publicKey.toBuffer(),
          Buffer.from(wallet.agent_name),
        ],
        program.programId
      )

      console.log('Initializing PDA:', walletPda.toString())

      const tx = await program.methods
        .initializeWallet(
          wallet.agent_name,
          new anchor.BN(0.5 * 1e9), // default 0.5 SOL limit
          [],
          false,
          0,
          23,
          new anchor.BN(1.0 * 1e9)  // require approval above 1.0 SOL
        )
        .accounts({
          wallet: walletPda,
          owner: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      console.log('Deploy success! TX Signature:', tx)
      toast.success('Wallet initialized on-chain!', { id: tId })

      // Refresh to update the "On-chain" status
      setTimeout(() => fetchWallets(), 2000)
    } catch (err) {
      console.error(err)
      toast.error(`Deployment failed: ${err.message}`, { id: tId })
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <div className="p-4 sm:p-8 animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Agent Wallets</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your AI agent smart wallets on Solana devnet</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary w-full sm:w-auto justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Agent
        </button>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Active Agents', value: wallets.filter(w => w.is_active).length, accent: 'bg-green-500' },
          { label: 'Total Wallets', value: wallets.length, accent: 'bg-blue-500' },
          { label: 'Network', value: 'Devnet', accent: 'bg-amber-500' },
          { label: 'Policy Status', value: 'On-chain', accent: 'bg-indigo-500' },
        ].map(s => (
          <div key={s.label} className="relative overflow-hidden group">
            <div className="card px-6 py-5 border-none bg-white shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:ring-indigo-100 hover:shadow-md">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.accent} opacity-50`} />
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2">{s.label}</p>
              <p className="text-3xl font-black text-gray-900 tracking-tighter">{s.value}</p>
            </div>
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
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="font-semibold text-gray-700 mb-1">Could not load wallets</p>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button onClick={fetchWallets} className="btn-secondary text-sm">Retry</button>
        </div>
      ) : wallets.length === 0 ? (
        <EmptyState onCreate={() => setShowCreate(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wallets.map((wallet, idx) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              index={idx}
              onDeploy={() => deployToChain(wallet)}
              isDeploying={isDeploying}
            />
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

      {/* ── Login Overlay ──────────────────────────────────────────── */}
      {needsLogin && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="card w-full max-w-md p-8 text-center animate-slide-up">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-6 mx-auto text-2xl">
              ✍️
            </div>
            <h3 className="font-black text-gray-900 text-xl mb-2">Signature Required</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed max-w-[280px] mx-auto">
              Please sign a message with your wallet to authenticate securely and access your agents.
            </p>
            <button onClick={handleLogin} disabled={isLoggingIn} className="btn-primary w-full py-3">
              {isLoggingIn ? 'Waiting for signature...' : 'Sign to Login'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Bubbles({ count = 8 }) {
  const [bubbles, setBubbles] = useState([])
  useEffect(() => {
    setBubbles(new Array(count).fill(true).map(() => ({
      left: Math.random() * 100 + "%",
      size: Math.random() * 10 + 4 + "px",
      delay: Math.random() * 15 + "s",
      duration: Math.random() * 15 + 15 + "s",
    })))
  }, [count])

  return (
    <>
      {bubbles.map((b, i) => (
        <div
          key={i}
          className="bubble"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            animationDelay: b.delay,
            animationDuration: b.duration,
            bottom: "-20px",
          }}
        />
      ))}
    </>
  )
}

function Meteors({ number = 5 }) {
  const [meteors, setMeteors] = useState([])

  useEffect(() => {
    setMeteors(new Array(number).fill(true).map(() => ({
      top: 0,
      left: Math.floor(Math.random() * 600) - 200 + "px",
      animationDelay: Math.random() * 2 + "s",
      animationDuration: Math.floor(Math.random() * 10 + 15) + "s",
    })))
  }, [number])

  return (
    <>
      {meteors.map((el, idx) => (
        <span
          key={"meteor" + idx}
          className="meteor-streak animate-meteor"
          style={{
            top: el.top,
            left: el.left,
            animationDelay: el.animationDelay,
            animationDuration: el.animationDuration,
          }}
        ></span>
      ))}
    </>
  )
}

function CountUp({ end, duration = 2 }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let startTime = null
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      setCount(progress * end)
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }
    window.requestAnimationFrame(step)
  }, [end, duration])
  return <span>{count.toFixed(3)}</span>
}

function WalletCard({ wallet, index = 0, onDeploy, isDeploying }) {
  const isOnChain = !!wallet.on_chain

  const palettes = [
    'gradient-blue',
    'gradient-purple',
    'gradient-teal',
    'gradient-rose',
    'gradient-emerald',
    'gradient-violet',
  ]
  const paletteClass = palettes[index % palettes.length]

  return (
    <Link 
      to={`/wallet/${wallet.id}`}
      className="group relative rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-[0_45px_90px_-20px_rgba(59,130,246,0.35)] hover:-translate-y-2 cursor-pointer bg-white flex flex-col min-h-[250px]"
    >
      <div className={`absolute inset-0 moving-gradient ${paletteClass} opacity-100 transition-opacity duration-700`} />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <Bubbles count={12} />
      </div>

      <div className="absolute inset-0 bg-black/5 mix-blend-overlay z-0" />

      <div className="relative p-7 h-full z-10 flex flex-col justify-between flex-1">
        <div className="flex items-start justify-between relative">
          <div className="flex items-center gap-4">
            <div className="min-w-0">
              <h3 className="font-black text-white text-3xl leading-tight tracking-tighter truncate drop-shadow-lg pr-4">{wallet.agent_name}</h3>
              <div className="mt-2 text-white">
                <div className="inline-block" onClick={(e) => e.stopPropagation()}>
                  <RevealCopy 
                    value={wallet.pda_address} 
                    chars={6} 
                    className="bg-black/20 border-white/10 hover:bg-black/30"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 origin-right">
            {isOnChain ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/30 backdrop-blur-md text-green-100 text-[10px] font-black uppercase tracking-widest border border-green-500/40">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Live
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white/60 text-[10px] font-black uppercase tracking-widest border border-white/20">
                Draft
              </div>
            )}
            {wallet.policy?.emergencyPaused && (
              <span className="px-2.5 py-1 rounded bg-red-600 text-white text-[9px] font-black uppercase tracking-widest animate-pulse border border-red-500/50">
                Frozen
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto pt-8 relative">
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/50 font-black mb-1.5 ml-1">Agent Vault</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white tracking-tighter leading-none drop-shadow-xl">
                  <CountUp end={wallet.balance_sol || 0} />
                </span>
                <span className="text-xs font-bold text-white/60 tracking-widest uppercase">SOL</span>
              </div>
            </div>
            
            <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              {!isOnChain ? (
                <Button
                  size="sm"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeploy() }}
                  disabled={isDeploying}
                  className="bg-white text-blue-700 hover:bg-white hover:scale-105 active:scale-95 border-none shadow-xl font-black text-[10px] tracking-widest px-7 h-11 rounded-xl transition-all"
                >
                  {isDeploying ? 'SECURING...' : 'INIT VAULT'}
                </Button>
              ) : (
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-black mb-1.5">Daily Limit</p>
                  <div className="px-3 py-1.5 rounded-xl bg-black/20 text-[11px] font-black text-white border border-white/10 shadow-inner">
                    {wallet.policy?.maxSpendPerDay || 0.5} SOL
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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

const DEMO_WALLETS = []
