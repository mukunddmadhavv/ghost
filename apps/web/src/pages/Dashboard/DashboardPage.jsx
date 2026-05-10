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

  function handleNewAgentClick() {
    if (!connected) {
      toast.error('Please connect your Solana wallet first')
      return
    }
    if (!localStorage.getItem('ghost_token')) {
      setNeedsLogin(true)
      return
    }
    setShowCreate(true)
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
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create agent')
      }
      
      await fetchWallets()
      setShowCreate(false)
      setAgentName('')
      toast.success('Agent saved to database! Click Deploy to Chain to activate.')
    } catch (err) {
      toast.error(err.message || 'Failed to create agent')
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
      const idlRes = await fetch(`${API}/api/idl`)
      if (!idlRes.ok) throw new Error('Could not fetch Anchor IDL')
      const idl = await idlRes.json()

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

      const [walletPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('ghost-wallet'),
          publicKey.toBuffer(),
          Buffer.from(wallet.agent_name),
        ],
        program.programId
      )

      // We must pass the Backend Relayer's Public Key as the authorized agent
      const relayerPubKey = new PublicKey('CjHkrQk9yB5eBtUW5jbzpzGgPw7RZ2R9YXmkGAgdGUTA')

      const tx = await program.methods
        .initializeWallet(
          wallet.agent_name,
          relayerPubKey, 
          new anchor.BN(0.5 * 1e9),
          [],
          false,
          0,
          23,
          new anchor.BN(1.0 * 1e9)
        )
        .accounts({
          wallet: walletPda,
          owner: publicKey,
          system_program: SystemProgram.programId,
        })
        .rpc()

      toast.success('Wallet initialized on-chain!', { id: tId })
      setTimeout(() => fetchWallets(), 2000)
    } catch (err) {
      console.error(err)
      toast.error(`Deployment failed: ${err.message}`, { id: tId })
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-8 relative z-10 pt-12 pb-32">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-16">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Infrastructure Ready
          </div>
          <h1 className="text-5xl font-black text-zinc-900 tracking-tighter leading-none editorial-heading">
            Agent <span className="font-serif-premium italic font-light text-zinc-400">Wallets.</span>
          </h1>
          <p className="text-lg text-zinc-500 font-medium tracking-tight max-w-xl">
            Institutional-grade smart wallets for autonomous AI agents on Solana devnet. 
            Manage identity, funding, and real-time execution policies.
          </p>
        </div>
        <button 
          onClick={handleNewAgentClick} 
          className="group relative px-8 py-3.5 bg-zinc-900 text-white rounded-full font-bold text-sm overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] flex items-center gap-2"
        >
          <span className="relative z-10 uppercase tracking-widest text-[11px] font-black">New Agent</span>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>

      {/* ── Stats Bento Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20 animate-slide-up">
        {[
          { label: 'Active Agents', value: wallets.filter(w => w.is_active).length, highlight: 'text-emerald-500', live: true },
          { label: 'Total Wallets', value: wallets.length, highlight: 'text-zinc-900' },
          { label: 'Network', value: 'Devnet', highlight: 'text-emerald-500' },
          { label: 'Standard', size: 'PDA v1', highlight: 'text-zinc-900' },
        ].map((s, i) => (
          <div key={i} className="bento-card p-6 flex flex-col justify-between h-32 relative group hover:border-zinc-900/10 transition-all duration-500">
            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-zinc-100 group-hover:bg-emerald-500 transition-colors duration-500" />
            <div className="flex items-center justify-between relative z-10">
               <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${s.highlight}`}>{s.label}</span>
               {s.live && (
                 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 animate-pulse">
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest">LIVE</span>
                 </div>
               )}
            </div>
            <p className="text-3xl font-serif-premium italic font-light text-zinc-900 tracking-tighter leading-none relative z-10">
              {s.value || s.size}
            </p>
          </div>
        ))}
      </div>

      {/* ── Wallet Grid ──────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Vaults</p>
        </div>
      ) : error ? (
        <div className="bento-card p-12 flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-black text-zinc-900 tracking-tight">Sync Failure</h3>
          <p className="text-sm text-zinc-500 font-medium mb-8 max-w-xs">{error}</p>
          <button onClick={fetchWallets} className="px-6 py-2 rounded-full bg-zinc-900 text-white text-xs font-bold hover:scale-105 transition-transform">Retry Sync</button>
        </div>
      ) : wallets.length === 0 ? (
        <EmptyState onCreate={handleNewAgentClick} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
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
        <div className="fixed inset-0 bg-white/60 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bento-card w-full max-w-md p-10 space-y-8 animate-slide-up shadow-2xl ring-1 ring-zinc-100">
            <header>
              <h3 className="text-3xl font-black text-zinc-900 tracking-tighter editorial-heading">Initialize <span className="font-serif-premium italic font-light text-zinc-400 text-2xl">Vault.</span></h3>
              <p className="text-sm text-zinc-400 font-medium mt-1">A non-custodial PDA will be initialized on Solana.</p>
            </header>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-1">Agent Identity</label>
              <input
                autoFocus
                type="text"
                placeholder="e.g. Sentinel-7 Alpha"
                value={agentName}
                onChange={e => setAgentName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createWallet()}
                className="w-full px-6 py-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 text-zinc-900 text-base font-bold placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all"
              />
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowCreate(false)} 
                className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={createWallet} 
                disabled={!agentName.trim() || creating} 
                className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-zinc-200 hover:scale-105 active:scale-95 transition-all"
              >
                {creating ? 'Syncing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Login Overlay ──────────────────────────────────────────── */}
      {needsLogin && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-2xl flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bento-card w-full max-w-md p-12 text-center space-y-8 shadow-2xl ring-1 ring-zinc-100">
            <header>
              <h3 className="text-3xl font-black text-zinc-900 tracking-tighter editorial-heading">Verify <span className="font-serif-premium italic font-light text-zinc-400">Identity.</span></h3>
              <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
                Please sign a technical instruction with your wallet to secure the agent session.
              </p>
            </header>
            <button 
              onClick={handleLogin} 
              disabled={isLoggingIn} 
              className="w-full py-4 bg-zinc-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-zinc-200 hover:scale-105 active:scale-95 transition-all"
            >
              Authorize Vault
            </button>
          </div>
        </div>
      )}
    </div>
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
      if (progress < 1) window.requestAnimationFrame(step)
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
      className="group relative rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-[0_45px_90px_-20px_rgba(59,130,246,0.25)] hover:-translate-y-2 cursor-pointer bg-white flex flex-col min-h-[260px]"
    >
      <div className={`absolute inset-0 moving-gradient ${paletteClass} opacity-100 transition-opacity duration-700`} />
      
      <div className="absolute inset-0 bg-black/5 mix-blend-overlay z-0" />

      <div className="relative p-10 h-full z-10 flex flex-col justify-between flex-1">
        <div className="flex items-start justify-between relative">
          <div className="flex items-center gap-4 min-w-0">
             <h3 className="font-black text-white text-4xl leading-tight tracking-tighter truncate drop-shadow-lg pr-4 uppercase">{wallet.agent_name}</h3>
          </div>
          <div className="flex flex-col items-end gap-2 origin-right">
            {isOnChain ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/30 backdrop-blur-md text-green-100 text-[9px] font-black uppercase tracking-widest border border-green-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white/60 text-[9px] font-black uppercase tracking-widest border border-white/20">
                Draft
              </div>
            )}
          </div>
        </div>

        <div onClick={(e) => e.stopPropagation()} className="mb-4">
          <RevealCopy 
            value={wallet.pda_address} 
            chars={8} 
            className="bg-black/20 border-white/10 hover:bg-black/30 text-white/60 !text-[10px]"
          />
        </div>

        <div className="flex items-end justify-between border-t border-white/10 pt-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-2">Total Sol Funding</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white tracking-tighter leading-none drop-shadow-xl">
                <CountUp end={wallet.balance_sol || 0} />
              </span>
              <span className="text-xs font-bold text-white/40 tracking-widest uppercase">SOL</span>
            </div>
          </div>
          
          <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            {!isOnChain ? (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeploy() }}
                disabled={isDeploying}
                className="px-8 py-3.5 bg-white text-zinc-900 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                {isDeploying ? 'SECURING...' : 'Init Vault'}
              </button>
            ) : (
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Daily Limit</p>
                <div className="px-3 py-1.5 rounded-xl bg-black/20 text-[11px] font-black text-white border border-white/10 shadow-inner">
                  {wallet.policy?.maxSpendPerDay || 0.5} SOL
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ onCreate }) {
  return (
    <div className="bento-card p-24 text-center space-y-8 overflow-hidden relative border-none bg-zinc-50/50 shadow-none">
      <div className="relative z-10">
        <h3 className="text-3xl font-black text-zinc-900 tracking-tighter editorial-heading uppercase">No active <span className="font-serif-premium italic font-light text-zinc-400">Vaults.</span></h3>
        <p className="text-lg text-zinc-500 font-medium tracking-tight max-w-sm mx-auto mb-10">
          Initialize your first autonomous agent wallet to begin controlling spending on-chain.
        </p>
        <button 
          onClick={onCreate} 
          className="px-10 py-4 bg-zinc-900 text-white rounded-full font-bold text-sm shadow-xl shadow-zinc-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto"
        >
          <span className="uppercase tracking-widest text-[11px] font-black">Create First Agent</span>
        </button>
      </div>
    </div>
  )
}
