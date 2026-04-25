import { useState } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { LayoutDashboard, History, BookOpen, Settings2, Menu, X, ShieldCheck } from 'lucide-react'
import { RevealCopy } from '../components/ui/reveal-copy'
import logo from '../assets/logo.webp'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { to: '/audit', label: 'Audit Log', icon: <History className="w-4 h-4" /> },
  { to: '/docs', label: 'Docs', icon: <BookOpen className="w-4 h-4" /> },
  { to: '/settings', label: 'Developers', icon: <Settings2 className="w-4 h-4" /> },
]

function SidebarContent({ publicKey, onClose }) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-zinc-100 mb-6">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={logo} alt="ghost logo" className="h-8 w-auto object-contain transition-all duration-500 group-hover:scale-110 group-hover:rotate-3" />
          <span className="text-lg font-black tracking-[0.3em] text-zinc-900">GHOST</span>
          <div className="px-2 py-0.5 rounded-full bg-emerald-50 text-[8px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-100 ml-auto">
            devnet
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 px-3 mb-4">Operations</h3>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 group
              ${isActive 
                ? 'bg-zinc-900 text-white shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)]' 
                : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}
            `}
          >
            <span className={({ isActive }) => `transition-colors ${isActive ? 'text-emerald-400' : 'text-zinc-300 group-hover:text-emerald-500'}`}>
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Wallet area at bottom */}
      <div className="p-4 mt-auto">
        <div className="bento-card p-5 bg-zinc-50/50 border-zinc-100 space-y-4">
          {publicKey && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">Your Wallet</p>
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
              </div>
              <div className="bg-white rounded-xl p-2 border border-zinc-100">
                <RevealCopy value={publicKey.toString()} chars={6} />
              </div>
            </div>
          )}
          <div className="wallet-adapter-ghost-wrapper">
            <WalletMultiButton className="!w-full !justify-center !text-[11px] !font-black !uppercase !tracking-widest !bg-zinc-900 !rounded-xl !h-11 shadow-sm hover:!bg-black transition-all" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AppLayout() {
  const { publicKey } = useWallet()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-white overflow-hidden technical-grid selection:bg-emerald-100 selection:text-emerald-900">

      {/* ─── Mobile overlay backdrop ─────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-md lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-72 flex-shrink-0 bg-white border-r border-zinc-100 flex flex-col
          transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <SidebarContent
          publicKey={publicKey}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-zinc-100 flex-shrink-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-zinc-50 text-zinc-900 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-2 group">
            <img src={logo} alt="ghost" className="h-7 w-auto object-contain transition-transform duration-300 group-active:scale-95" />
            <span className="text-sm font-black tracking-[0.2em] text-zinc-900">GHOST</span>
          </Link>
          <div className="w-5" /> {/* Spacer for symmetry */}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar pt-8 md:pt-0">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
