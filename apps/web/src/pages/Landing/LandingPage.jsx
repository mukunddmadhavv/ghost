import { Link } from 'react-router-dom'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import logo from '../../assets/logo.webp'
import landingVideo from '../../assets/landing.mp4'

export default function LandingPage() {
  return (
    <div className="relative w-screen h-screen overflow-hidden text-white select-none">

      {/* ── Background Video ─────────────────────────────────────────────── */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src={landingVideo} type="video/mp4" />
      </video>

      {/* ── Layered Overlays ─────────────────────────────────────────────── */}
      {/* Base dark layer */}
      <div className="absolute inset-0 bg-black/55 z-10" />
      {/* Bottom gradient to ground content */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-10" />
      {/* Subtle vignette */}
      <div className="absolute inset-0 z-10" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-10 py-7">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={logo}
            alt="ghost logo"
            className="h-8 w-auto object-contain transition-all duration-500 group-hover:scale-110"
            style={{ mixBlendMode: 'screen', opacity: 0.92 }}
          />
          <span
            className="text-base font-black tracking-[0.35em] text-white/90"
            style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.35em' }}
          >
            GHOST
          </span>
        </Link>



        {/* Right Nav */}
        <div className="flex items-center gap-6">
          <Link
            to="/docs"
            className="text-xs font-semibold tracking-widest uppercase text-white/50 hover:text-white transition-colors duration-200"
          >
            Docs
          </Link>
          <a
            href="https://github.com/mukunddmadhavv/ghost"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white transition-colors duration-200"
            aria-label="GitHub"
          >
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
          </a>
          <div className="h-4 w-px bg-white/15" />
          <WalletMultiButton />
        </div>
      </nav>

      {/* ── Below-Navbar Badge ───────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex justify-center pointer-events-none" style={{ paddingTop: '100px' }}>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 backdrop-blur-md pointer-events-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span
            className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-300"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Live on Solana Devnet
          </span>
        </div>
      </div>

      {/* ── Hero Content ─────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">


        {/* Main headline */}
        <h1
          className="text-white font-black leading-none tracking-tighter pt-10"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(1.8rem, 4.5vw, 5rem)',
            letterSpacing: '-0.04em',
            lineHeight: 0.95,
            textShadow: '0 4px 40px rgba(0,0,0,0.4)'
          }}
        >
          your AI agent has a wallet
          <br />
          <span
            className="text-white/40 font-light italic"
            style={{ fontFamily: "'Fraunces', serif", fontVariationSettings: "'SOFT' 100, 'WONK' 1" }}
          >
            does it have rules?
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="text-white/55 font-medium max-w-xl mx-auto pt-60"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(0.9rem, 1.5vw, 1.2rem)',
            lineHeight: 1.65,
            letterSpacing: '-0.01em',
            textShadow: '0 2px 20px rgba(0,0,0,0.5)'
          }}
        >
          Ghost is a{' '}
          <span className="text-emerald-400 font-semibold">policy-enforced smart wallet</span>{' '}
          for autonomous AI agents — with sub-second micropayments, on-chain spending limits, and an immutable audit log.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-4 pt-1 mt-0">
          <Link
            to="/dashboard"
            className="group relative overflow-hidden px-8 py-3.5 rounded-full font-bold text-sm text-zinc-900 bg-white transition-all duration-300 hover:scale-[1.03] active:scale-95"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              letterSpacing: '-0.01em',
              boxShadow: '0 0 0 0 rgba(52,211,153,0), 0 8px 30px rgba(0,0,0,0.3)'
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(52,211,153,0.5), 0 8px 30px rgba(0,0,0,0.3)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 0 0 rgba(52,211,153,0), 0 8px 30px rgba(0,0,0,0.3)'}
          >
            <span className="relative z-10">Launch App →</span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>

          <Link
            to="/docs"
            className="px-8 py-3.5 rounded-full font-semibold text-sm text-white/70 hover:text-white border border-white/15 backdrop-blur-sm hover:border-white/30 hover:bg-white/5 transition-all duration-300"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', letterSpacing: '-0.01em' }}
          >
            Read the docs
          </Link>
        </div>
      </div>

      {/* ── Bottom Stats Bar ─────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <div className="flex items-stretch divide-x divide-white/10 border-t border-white/10 bg-black/30 backdrop-blur-xl">
          {[
            { value: '400ms', label: 'Avg Execution Time' },
            { value: '$0.000025', label: 'Avg Transaction Fee' },
            { value: '100%', label: 'On-chain Policy Enforcement' },
            { value: 'SOL', label: 'Powered by Solana' },
          ].map((stat, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-center py-5 gap-1">
              <span
                className="text-white font-black"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(1rem, 1.8vw, 1.4rem)',
                  letterSpacing: '-0.03em',
                  textShadow: '0 0 20px rgba(52,211,153,0.3)'
                }}
              >
                {stat.value}
              </span>
              <span
                className="text-white/35 font-semibold uppercase"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.6rem', letterSpacing: '0.15em' }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
