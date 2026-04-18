import { Link } from 'react-router-dom'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import logo from '../../assets/logo.webp'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Navbar ────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <img src={logo} alt="tryghost logo" className="h-10 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-4">
          <Link to="/docs" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Docs</Link>
          <Link to="/demo" className="btn-secondary text-sm">Live Demo</Link>
          <WalletMultiButton />
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center max-w-4xl mx-auto">
        <div className="animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Live on Solana Devnet
          </div>

          <h1 className="text-6xl font-black text-gray-900 leading-[1.05] tracking-tight mb-6">
            Your AI agent has a wallet.{' '}
            <span className="text-gray-300">Does it have rules?</span>
          </h1>

          <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            tryghost is a <span className="highlight-pill">policy-enforced smart wallet</span> for
            autonomous AI agents — with micropayments, spending limits, and a full audit log.
            All on Solana.
          </p>

          <div className="flex items-center gap-4 justify-center">
            <Link to="/dashboard" className="btn-primary text-base px-8 py-3">
              Launch App →
            </Link>
            <Link to="/demo" className="btn-ghost text-base">
              Watch Demo ⚡
            </Link>
          </div>
        </div>

        {/* ── Feature grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-6 mt-24 text-left w-full animate-fade-in">
          {[
            {
              icon: '🧠',
              title: 'Policy Engine',
              desc: 'Daily limits, allowlists, time-locks — all enforced on-chain in a Solana program. Your server being hacked cannot bypass these rules.',
            },
            {
              icon: '⚡',
              title: 'Micropayments',
              desc: 'Sub-second, fraction-of-a-cent payments using native SOL on Solana devnet. Perfect for pay-per-API, pay-per-data scenarios.',
            },
            {
              icon: '📖',
              title: 'Audit Log',
              desc: 'Every payment attempt — approved or rejected — is logged with the reason. Full transparency for every action your agent takes.',
            },
          ].map(f => (
            <div key={f.title} className="card-hover p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="px-8 py-6 border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-400">© 2024 tryghost.dev — Built on Solana Devnet</p>
        <p className="text-xs text-gray-400 font-medium">
          "We're not building a wallet. We're building trust for AI money."
        </p>
      </footer>
    </div>
  )
}
