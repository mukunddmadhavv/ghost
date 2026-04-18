import { Shield, Zap, Code, Lock, Activity, Cpu } from 'lucide-react'
import { Terminal } from '../../components/ui/terminal'

export default function DocsPage() {
  return (
    <div className="p-4 sm:p-8 animate-fade-in max-w-4xl mx-auto pb-20">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Developer Guide</h1>
        </div>
        <p className="text-gray-500 text-lg max-w-2xl leading-relaxed">
          Ghost provides policy-enforced smart wallets for autonomous AI agents on Solana.
          Enforce spending limits and recipient restrictions directly on the blockchain.
        </p>
      </header>

      {/* ── Quick Overview ────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {[
          { icon: <Zap className="w-5 h-5 text-amber-500" />, title: 'Non-Custodial', desc: 'You own the keys. Ghost only manages policies via signed instructions.' },
          { icon: <Lock className="w-5 h-5 text-green-500" />, title: 'On-Chain Rules', desc: 'Policies are stored in PDAs and enforced by the Smart Contract.' },
          { icon: <Code className="w-5 h-5 text-blue-500" />, title: 'REST API', desc: 'Simple JSON endpoints to trigger payments and manage bots.' },
        ].map((item, i) => (
          <div key={i} className="card p-6 border-none bg-white shadow-sm ring-1 ring-gray-100">
            <div className="mb-4">{item.icon}</div>
            <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* ── Architecture ─────────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-400" />
          Core Architecture
        </h2>
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">1. Agent PDAs (Program Derived Addresses)</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              When you create an agent, we generate a unique PDA on Solana derived from your wallet and the agent's name.
              This PDA acts as the "Vault" for that specific agent.
            </p>
            <div className="bg-zinc-900 rounded-lg p-4 font-mono text-[11px] text-zinc-400 overflow-x-auto">
              [ "ghost-wallet", owner_pubkey, agent_name ] =&gt; Agent PDA
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">2. Policy Enforcement</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Every payment execution requires a signature from your Ghost agent key. Before the Solana Program 
              executes the transfer, it validates the current block time, the recipient address, 
              and the 24-hour rolling spend total against your stored policy.
            </p>
          </div>
        </div>
      </section>

      {/* ── Getting Started ────────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-gray-400" />
          Implementation Flow
        </h2>
        <div className="relative pl-6 border-l-2 border-blue-50">
          {[
            { step: '01', title: 'Initialize Agent', desc: 'Create a new bot in the dashboard. This records the agent in our database and prepares the PDA.' },
            { step: '02', title: 'Deploy On-Chain', desc: 'Use the "Deploy" button to initialize the wallet on Solana. This requires a one-time devnet transaction.' },
            { step: '03', title: 'Set Policies', desc: 'Configure maximum daily spend, allowlists, and human approval thresholds.' },
            { step: '04', title: 'Connect API', desc: 'Point your agent code to our execution endpoint to let it start spending autonomously.' },
          ].map((item, i) => (
            <div key={i} className="mb-10 relative">
              <span className="absolute -left-[35px] top-0 w-6 h-6 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center text-[10px] font-bold text-blue-600">
                {item.step}
              </span>
              <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Security & Keys ────────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5 text-gray-400" />
          Ghost Secret Keys
        </h2>
        <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 mb-6">
          <p className="text-sm text-blue-900 leading-relaxed">
            Ghost uses **Hashed Secret Keys** (`ghost_sk_live_...`) to authorize API requests. Unlike standard passwords, 
            these are stored as SHA-256 hashes. If you lose a key, you must revoke it and generate a new one.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card p-5 bg-white border-gray-100">
            <h4 className="font-bold text-gray-900 mb-2 text-sm">1. Generate</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Visit the <strong>Developers</strong> tab to create a new live key. It will be shown only once.</p>
          </div>
          <div className="card p-5 bg-white border-gray-100">
            <h4 className="font-bold text-gray-900 mb-2 text-sm">2. Authorize</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Pass your key in the <code>Authorization: Bearer</code> header of every request.</p>
          </div>
        </div>
      </section>

      {/* ── API Reference ─────────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-xl font-bold text-gray-900 mb-6 font-mono">/ API Integration</h2>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          The <code>/execute</code> endpoint is the primary way your AI agent interacts with Solana. 
          Ghost performs real-time policy checks before relaying the transaction to the blockchain.
        </p>
        
        <div className="space-y-12">
          {/* Shell Example */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">01. cURL Execution</h3>
              <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded font-black uppercase">Production API</span>
            </div>
            <Terminal 
              isAnimated={true}
              command={`curl -X POST https://tryghost.dev/api/payments/execute \\
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

          {/* Code Integration */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">02. Node.js / Python Implementation</h3>
            <Terminal 
              isAnimated={true}
              typingSpeed={15}
              command={`const GHOST_SK = 'ghost_sk_live_v4h2...9z1';

const executePayment = async (walletId, recipient, amount) => {
  const response = await fetch('https://tryghost.dev/api/payments/execute', {
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

      {/* ── Help ─────────────────────────────────────────────────── */}
      <footer className="mt-20 pt-10 border-t border-gray-100 text-center">
        <p className="text-gray-400 text-sm">
          Questions? Ping us on X or join the 
          <a href="#" className="text-blue-500 font-semibold ml-1">Developer Discord</a>
        </p>
      </footer>
    </div>
  )
}
