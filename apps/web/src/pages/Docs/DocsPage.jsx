import { Shield, Zap, Code, Lock, Activity, Cpu, ChevronRight, BookOpen, Terminal as TerminalIcon } from 'lucide-react'
import { Terminal } from '../../components/ui/terminal'

const sections = [
  { id: 'overview', title: 'Quick Overview', icon: <Zap className="w-4 h-4" /> },
  { id: 'architecture', title: 'Core Architecture', icon: <Activity className="w-4 h-4" /> },
  { id: 'implementation', title: 'Implementation Flow', icon: <Cpu className="w-4 h-4" /> },
  { id: 'security', title: 'Security & Keys', icon: <Lock className="w-4 h-4" /> },
  { id: 'api', title: 'API Integration', icon: <TerminalIcon className="w-4 h-4" /> },
]

export default function DocsPage() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white technical-grid flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-12 px-8 pt-12 pb-32">
        
        {/* ── Sidebar Navigation ──────────────────────────────────── */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-24 space-y-8">
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 px-3">Documentation</h3>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-all duration-300 group"
                  >
                    <span className="text-zinc-300 group-hover:text-emerald-500 transition-colors">{s.icon}</span>
                    {s.title}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2 italic">Pro Tip</p>
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                Ghost PDAs are non-custodial. Not even your agent can bypass the on-chain policy without a signed instruction.
              </p>
            </div>
          </div>
        </aside>

        {/* ── Main Content ────────────────────────────────────────── */}
        <main className="flex-1 max-w-3xl">
          
          {/* Header */}
          <header className="mb-20 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
               <BookOpen className="w-3 h-3 text-emerald-600" />
               <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600">Developer Library</span>
            </div>
            <h1 className="text-6xl font-black text-zinc-900 tracking-tighter leading-none editorial-heading">
              Universal Trust for <br/>
              <span className="font-serif-premium italic font-light text-zinc-400">Autonomous Agents</span>
            </h1>
            <p className="text-xl text-zinc-500 font-medium leading-relaxed tracking-tight max-w-2xl">
              Ghost provides policy-enforced smart wallets for agents on Solana. 
              Enforce spending limits, allowlists, and time-locks directly on the blockchain.
            </p>
          </header>

          {/* Quick Overview */}
          <section id="overview" className="mb-32">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-8 px-1">01. Quick Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: <Zap className="w-5 h-5 text-emerald-500" />, title: 'Non-Custodial', desc: 'You own the keys. Ghost only manages policies via signed instructions.' },
                { icon: <Lock className="w-5 h-5 text-emerald-500" />, title: 'On-Chain Rules', desc: 'Policies are stored in PDAs and enforced by the Smart Contract.' },
                { icon: <Code className="w-5 h-5 text-emerald-500" />, title: 'REST API', desc: 'Simple JSON endpoints to trigger payments and manage bots.' },
                { icon: <Activity className="w-5 h-5 text-emerald-500" />, title: 'Real-time Audit', desc: 'Every transaction is logged with its policy outcome in our ledger.' },
              ].map((item, i) => (
                <div key={i} className="bento-card spectral-glow p-8 space-y-4">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-black text-zinc-900 tracking-tight">{item.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Architecture */}
          <section id="architecture" className="mb-32">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-8 px-1">02. Core Architecture</h2>
            <div className="space-y-6">
              <div className="bento-card p-12 bg-zinc-900 text-white relative flex flex-col justify-between overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/4 -translate-y-1/4">
                  <div className="w-64 h-64 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 blur-3xl" />
                </div>
                
                <div className="relative z-10 space-y-4">
                  <h3 className="text-3xl font-black italic font-serif-premium tracking-tight">Agent PDAs</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
                    unique Program Derived Addresses derived from your wallet and the agent's name. 
                    These act as immutable "Vaults" for that specific agent.
                  </p>
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 font-mono text-[11px] text-emerald-400/80">
                    [ "ghost-wallet", owner_pubkey, agent_name ] =&gt; Agent PDA
                  </div>
                </div>
              </div>

              <div className="bento-card p-10 space-y-4">
                <h3 className="text-xl font-black text-zinc-900 tracking-tight">Policy Enforcement</h3>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                  Every payment execution requires a signature from your Ghost agent key. Before the Solana Program 
                  executes the transfer, it validates the current block time, the recipient address, 
                  and the 24-hour rolling spend total against your stored policy.
                </p>
              </div>
            </div>
          </section>

          {/* Implementation Flow */}
          <section id="implementation" className="mb-32">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-8 px-1">03. Implementation Flow</h2>
            <div className="relative space-y-12">
              <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-zinc-100" />
              {[
                { title: 'Initialize Agent', desc: 'Create a new bot in the dashboard. This records the agent in our database and prepares the PDA.' },
                { title: 'Deploy On-Chain', desc: 'Use the "Deploy" button to initialize the wallet on Solana via a one-time transaction.' },
                { title: 'Set Policies', desc: 'Configure maximum daily spend, allowlists, and human approval thresholds.' },
                { title: 'Connect API', desc: 'Point your agent code to our execution endpoint to let it start spending autonomously.' },
              ].map((item, i) => (
                <div key={i} className="relative flex items-start gap-12 group transition-all duration-300">
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center shrink-0 z-10 group-hover:border-emerald-500 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
                    <span className="text-xs font-black text-zinc-400 group-hover:text-emerald-500 transition-colors">0{i+1}</span>
                  </div>
                  <div className="pt-1.5">
                    <h3 className="text-lg font-black text-zinc-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-zinc-500 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Security */}
          <section id="security" className="mb-32">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-8 px-1">04. Security & Keys</h2>
            <div className="space-y-6">
              <div className="bento-card p-10 border-emerald-100 bg-emerald-50/30">
                <p className="text-emerald-900 text-sm leading-relaxed font-medium italic underline decoration-emerald-200 decoration-2 underline-offset-4">
                  Ghost uses Hashed Secret Keys (ghost_sk_live_...) for authorization. We store only SHA-256 hashes. 
                  Lost keys cannot be recovered, only revoked and replaced.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bento-card p-8 space-y-3">
                  <h4 className="text-sm font-black text-zinc-900 uppercase">Generate</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed font-medium font-medium">Create live keys via the <strong>Developers</strong> tab. Reveal once, save forever.</p>
                </div>
                <div className="bento-card p-8 space-y-3">
                  <h4 className="text-sm font-black text-zinc-900 uppercase">Authorize</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed font-medium font-medium">Pass keys in the <code>Authorization: Bearer</code> header for every request.</p>
                </div>
              </div>
            </div>
          </section>

          {/* API Reference */}
          <section id="api" className="mb-32">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-8 px-1">05. API Integration</h2>
            <div className="space-y-12">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">cURL Execution</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-900">V1 PRODUCTION</span>
                  </div>
                </div>
                <Terminal 
                  isAnimated={true}
                  command={`curl -X POST https://ghostapi-jn35.onrender.com/api/payments/execute \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ghost_sk_live_v4h2...9z1" \\
  -d '{
    "walletId": "YOUR_WALLET_UUID",
    "recipientAddress": "Ghst7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRX82",
    "amountSol": 0.05,
    "description": "Autonomous Agent Payout"
  }'`}
                  output={`{
  "status": "APPROVED",
  "txSignature": "48v6ft9sYGLoDXNjcLsfDUqDTAdqNWjtWcppxQbcLPp61Rbz64uB9tnBYkc6w2dhoQfFQZAtVCjeRNxVBGFZHekP",
  "message": "✅ Payment executed via On-Chain PDA",
  "solscanUrl": "https://solscan.io/tx/48v6ft9s...ZHekP?cluster=devnet"
}`}
                />
              </div>

              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Node.js Implementation</h3>
                <Terminal 
                  isAnimated={true}
                  typingSpeed={15}
                  command={`const GHOST_SK = 'ghost_sk_live_v4h2...9z1';

const executePayment = async (walletId, recipient, amount) => {
  const response = await fetch('https://ghostapi-jn35.onrender.com/api/payments/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${GHOST_SK}\`
    },
    body: JSON.stringify({
      walletId,
      recipientAddress: recipient,
      amountSol: amount
    })
  });
  
  return await response.json();
};`}
                />
              </div>
            </div>
          </section>

          {/* Footer Help */}
          <footer className="pt-20 border-t border-zinc-100 flex items-center justify-between">
            <p className="text-xs text-zinc-400 font-medium">
              Stuck? View our 
              <a href="https://github.com/mukunddmadhavv/ghost" className="text-zinc-900 font-black ml-1 hover:text-emerald-500 transition-colors">GitHub</a>
            </p>
            <ChevronRight className="w-4 h-4 text-zinc-200" />
          </footer>

        </main>
      </div>
    </div>
  )
}
