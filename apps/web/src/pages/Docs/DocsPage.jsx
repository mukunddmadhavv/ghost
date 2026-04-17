export default function DocsPage() {
  return (
    <div className="p-8 animate-fade-in max-w-3xl">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Documentation</h1>
      <p className="text-gray-400 text-sm mb-10">How tryghost works under the hood</p>

      {[
        {
          title: 'What is tryghost?',
          content: `tryghost is a policy-enforced smart wallet for AI agents. Instead of giving your agent
full control of a wallet, you deploy a Solana program that enforces spending rules on-chain.
Even if your server is compromised, the blockchain enforces your rules.`,
        },
        {
          title: 'Policy Engine (On-chain)',
          content: `All rules are stored and enforced inside a Solana program (Anchor framework).
When an agent tries to execute a payment, the program checks:
• Daily spending cap (in SOL)
• Recipient allowlist (only approved addresses)
• Time restriction (allowed hours in UTC)
• Approval threshold (human override for large amounts)
• Emergency pause (instant freeze)`,
        },
        {
          title: 'Micropayments',
          content: `Solana processes ~65,000 transactions per second with ~400ms finality and
fractions-of-a-cent fees. This makes it perfect for micropayments — paying 0.001 SOL
for an API call, 0.0001 SOL for a data feed, etc.`,
        },
        {
          title: 'Audit Log',
          content: `Every payment attempt — whether approved or rejected — is logged to Supabase with:
• Timestamp
• Agent name and wallet PDA
• Recipient address
• Amount in SOL and lamports
• Status (APPROVED/REJECTED)
• Rejection reason if blocked
• Transaction signature if approved`,
        },
        {
          title: 'API Reference',
          content: `POST /api/payments/execute — Submit a payment for policy validation
GET  /api/wallets — List all agent wallets
POST /api/wallets — Create a new agent wallet
PATCH /api/wallets/:id/policy — Update policy rules
GET  /api/audit — Paginated audit log
GET  /api/audit/stream — SSE stream for real-time updates`,
        },
      ].map(section => (
        <div key={section.title} className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">{section.title}</h2>
          <div className="card px-6 py-4">
            <pre className="text-sm text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">
              {section.content}
            </pre>
          </div>
        </div>
      ))}
    </div>
  )
}
