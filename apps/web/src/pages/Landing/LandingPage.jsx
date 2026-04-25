import { Link } from 'react-router-dom'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import logo from '../../assets/logo.webp'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-emerald-100 selection:text-emerald-900 technical-grid">
      {/* ── Navbar ────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-zinc-100 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={logo} alt="ghost logo" className="h-8 w-auto object-contain transition-all duration-500 group-hover:scale-110 group-hover:rotate-3" />
          <span className="text-xl font-black tracking-[0.3em] text-zinc-900">GHOST</span>
        </Link>
        <div className="flex items-center gap-8">
          <Link to="/docs" className="text-sm font-bold tracking-tight text-zinc-400 hover:text-zinc-900 transition-colors">Docs</Link>
          <a 
            href="https://github.com/mukunddmadhavv/ghost" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-zinc-900 hover:text-emerald-500 transition-all duration-300"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
          </a>
          <WalletMultiButton />
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center px-8 text-center max-w-6xl mx-auto pt-12 pb-24">
        <div className="animate-slide-up space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live on Solana Devnet
          </div>

          <h1 className="text-7xl md:text-8xl font-black text-zinc-900 leading-[0.9] tracking-tighter editorial-heading">
            Your AI agent has a wallet. <br/>
            <span className="font-serif-premium italic font-light text-zinc-400">Does it have rules?</span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-500 font-medium max-w-3xl mx-auto leading-relaxed tracking-tight">
            Ghost is a <span className="text-emerald-600 font-bold">policy-enforced smart wallet</span> for 
            autonomous AI agents — with sub-second micropayments, on-chain spending limits, and an immutable audit log.
          </p>

          <div className="flex items-center gap-6 justify-center pt-8">
            <Link to="/dashboard" className="group relative px-10 py-4 bg-zinc-900 text-white rounded-full font-bold text-lg overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)]">
              <span className="relative z-10">Launch App →</span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>
        </div>

        {/* ── Feature Bento Grid ──────────────────────────────────── */}
        <div className="w-full mt-32 grid grid-cols-1 md:grid-cols-12 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          
          {/* Main Process Card */}
          <div className="md:col-span-8 bento-card spectral-glow p-12 text-left">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">ghost_protocol_flow.sys</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {[
                { step: '01', title: 'Connect Agent', desc: 'Secure production keys for seamless agent-to-policy authentication.' },
                { step: '02', title: 'Define Rules', desc: 'Configure spending limits and session timeouts on the Solana blockchain.' },
                { step: '03', title: 'Sub-second Pay', desc: 'Execute billionth-of-a-dollar transactions with verified finality.' },
                { step: '04', title: 'Verify Ledger', desc: 'Monitor agent behavior through our high-performance audit ledger.' }
              ].map((s, i) => (
                <div key={i} className="space-y-2">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{s.step} {s.title}</span>
                  <p className="text-zinc-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Side Performance Card */}
          <div className="md:col-span-4 bento-card bg-zinc-900 text-white p-12 flex flex-col justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/4 -translate-y-1/4">
               <div className="w-64 h-64 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 blur-3xl" />
            </div>
            
            <div className="relative z-10">
              <h4 className="text-3xl font-black leading-none mb-4 italic font-serif-premium">Fast enough<br/>for agents.</h4>
              <p className="text-zinc-400 text-sm font-medium">Built on Solana for sub-second execution and fraction-of-a-cent fees.</p>
            </div>

            <div className="relative z-10 pt-12">
              <div className="text-5xl font-black text-emerald-400">400ms</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-2">Avg Execution Time</div>
            </div>
          </div>

        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="px-8 py-12 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto w-full gap-8">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="ghost logo" className="h-5 w-auto" />
            <span className="text-sm font-black tracking-[0.2em] text-zinc-900">GHOST</span>
          </Link>
          <span className="text-[10px] text-zinc-300 font-medium">© 2024 Built for the AI Economy</span>
        </div>
        <div className="flex gap-8 items-center">
          <Link to="/docs" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900">Docs</Link>
          <div className="px-3 py-1 bg-emerald-50 rounded-full text-[8px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-100">Solana Devnet</div>
        </div>
      </footer>
    </div>
  )
}
