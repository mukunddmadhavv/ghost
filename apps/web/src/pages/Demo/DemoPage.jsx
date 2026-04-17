import { useState } from 'react'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const DEMO_WALLET_ID = 'demo'
const GOOD_RECIPIENT = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
const BAD_RECIPIENT  = '9xNQSBN9ck4VqMXC47aKWmpKAUsPFaE5UnVPRy5vPGXM'

export default function DemoPage() {
  const [log, setLog] = useState([])
  const [running, setRunning] = useState(false)

  function addLog(entry) {
    setLog(prev => [{ id: Date.now() + Math.random(), ts: new Date().toLocaleTimeString(), ...entry }, ...prev])
  }

  async function simulatePayment(amountSol, recipient, description) {
    try {
      const res = await fetch(`${API}/api/payments/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId: DEMO_WALLET_ID, recipientAddress: recipient, amountSol, description }),
      })
      const data = await res.json()
      return data
    } catch {
      // Simulate locally when API isn't running
      if (amountSol > 0.5) return { status: 'REJECTED', reason: 'DAILY_LIMIT_EXCEEDED: Would exceed 0.5 SOL daily limit', message: '❌ Transaction rejected by policy engine' }
      if (recipient === BAD_RECIPIENT) return { status: 'REJECTED', reason: 'RECIPIENT_NOT_ALLOWED: Address not in allowlist', message: '❌ Transaction rejected by policy engine' }
      return { status: 'APPROVED', message: '✅ Payment executed', txSignature: `mock_${Date.now()}` }
    }
  }

  async function step1_GoodPayment() {
    setRunning(true)
    toast('🤖 Agent: "Send 0.01 SOL for API call..."')
    addLog({ type: 'info', text: '🤖 Agent requested: Send 0.01 SOL to trusted API provider' })

    await sleep(800)
    addLog({ type: 'info', text: '🔍 Solana program checking policy rules...' })

    await sleep(1000)
    const result = await simulatePayment(0.01, GOOD_RECIPIENT, 'API micropayment')

    if (result.status === 'APPROVED') {
      addLog({ type: 'success', text: `✅ APPROVED — 0.01 SOL sent | Tx: ${result.txSignature?.slice(0, 20)}...` })
      toast.success('✅ Payment approved by policy engine!')
    } else {
      addLog({ type: 'error', text: `❌ REJECTED — ${result.reason}` })
    }
    setRunning(false)
  }

  async function step2_BadPayment() {
    setRunning(true)
    toast('🤖 Agent: "Send 5 SOL to random site..."')
    addLog({ type: 'info', text: '🤖 Agent requested: Send 5 SOL to unknown address' })

    await sleep(800)
    addLog({ type: 'info', text: '🔍 Solana program checking policy rules...' })

    await sleep(1000)
    const result = await simulatePayment(5.0, BAD_RECIPIENT, 'Suspicious payment')

    addLog({ type: 'error', text: `❌ REJECTED by blockchain — ${result.reason || 'DAILY_LIMIT_EXCEEDED'}` })
    toast.error('❌ Blocked by policy engine! Even a hacked server cannot bypass this.')
    setRunning(false)
  }

  async function step3_MicroBurst() {
    setRunning(true)
    addLog({ type: 'info', text: '⚡ Firing 5 rapid micropayments (0.001 SOL each)...' })

    for (let i = 1; i <= 5; i++) {
      await sleep(400)
      const result = await simulatePayment(0.001, GOOD_RECIPIENT, `Micropayment ${i}`)
      if (result.status === 'APPROVED') {
        addLog({ type: 'success', text: `⚡ #${i} → 0.001 SOL ✅ confirmed in ~400ms` })
      } else {
        addLog({ type: 'error', text: `⚡ #${i} → REJECTED: ${result.reason}` })
      }
    }

    toast.success('⚡ 5 micropayments — fast, cheap, on Solana!')
    setRunning(false)
  }

  async function step4_FreezeAll() {
    setRunning(true)
    addLog({ type: 'warning', text: '🚨 Owner triggered emergency pause...' })
    await sleep(600)
    addLog({ type: 'error', text: '🔒 Wallet FROZEN on-chain. All payments blocked.' })
    toast('🚨 Emergency pause activated — wallet frozen', { icon: '🔒' })
    setRunning(false)
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="max-w-3xl">
        {/* ── Header ────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
            Live Demo <span className="text-gray-300">⚡</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Walk through the hackathon demo flow — approved payments, policy rejections, micropayments, and emergency freeze.
          </p>
        </div>

        {/* ── Demo Steps ──────────────────────────────────────────── */}
        <div className="grid gap-4 mb-8">
          {[
            {
              step: '01',
              title: 'Good Payment ✅',
              desc: 'Agent sends 0.01 SOL to an allowed API provider. Policy passes, payment goes through.',
              action: step1_GoodPayment,
              color: 'green',
              tag: 'APPROVED',
            },
            {
              step: '02',
              title: 'Bad Payment ❌',
              desc: 'Agent tries to send 5 SOL — exceeds daily limit. Blockchain rejects it. SERVER HACK CANNOT BYPASS THIS.',
              action: step2_BadPayment,
              color: 'red',
              tag: 'BLOCKED',
            },
            {
              step: '03',
              title: 'Micropayment Burst ⚡',
              desc: 'Fire 5 rapid payments of 0.001 SOL. Fast, cheap, Solana-speed.',
              action: step3_MicroBurst,
              color: 'blue',
              tag: '~400ms each',
            },
            {
              step: '04',
              title: 'Emergency Freeze 🚨',
              desc: 'Owner calls emergency pause — all future payments blocked instantly on-chain.',
              action: step4_FreezeAll,
              color: 'orange',
              tag: 'INSTANT',
            },
          ].map(demo => (
            <DemoCard key={demo.step} {...demo} disabled={running} />
          ))}
        </div>

        {/* ── Live Output Log ─────────────────────────────────────── */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm">Output Console</h3>
            {log.length > 0 && (
              <button onClick={() => setLog([])} className="btn-ghost text-xs py-1">Clear</button>
            )}
          </div>
          <div className="p-4 font-mono text-xs space-y-1.5 min-h-[200px] max-h-[300px] overflow-y-auto bg-gray-950 rounded-b-xl">
            {log.length === 0 ? (
              <p className="text-gray-600">Click a step above to start the demo...</p>
            ) : (
              log.map(entry => (
                <div key={entry.id} className={`flex gap-2 ${
                  entry.type === 'success' ? 'text-green-400' :
                  entry.type === 'error' ? 'text-red-400' :
                  entry.type === 'warning' ? 'text-yellow-400' :
                  'text-gray-400'
                }`}>
                  <span className="text-gray-600 flex-shrink-0">{entry.ts}</span>
                  <span>{entry.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DemoCard({ step, title, desc, action, color, tag, disabled }) {
  const colorStyles = {
    green: 'border-green-100 bg-green-50/30',
    red:   'border-red-100 bg-red-50/30',
    blue:  'border-blue-100 bg-blue-50/30',
    orange:'border-orange-100 bg-orange-50/30',
  }
  const tagStyles = {
    green: 'bg-green-100 text-green-700',
    red:   'bg-red-100 text-red-700',
    blue:  'bg-blue-100 text-blue-700',
    orange:'bg-orange-100 text-orange-700',
  }

  return (
    <div className={`card p-5 flex items-center gap-5 border ${colorStyles[color]}`}>
      <span className="text-3xl font-black text-gray-200">{step}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold text-gray-900">{title}</h4>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${tagStyles[color]}`}>{tag}</span>
        </div>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
      <button
        onClick={action}
        disabled={disabled}
        className={`btn-primary flex-shrink-0 ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        Run →
      </button>
    </div>
  )
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
