const { Connection, PublicKey } = require('@solana/web3.js');
const anchor = require('@coral-xyz/anchor');
const IDL = require('../../anchor/target/idl/ghost_wallet.json');

const programId = new PublicKey('3BKqA1CzLd27roSy4qi7T9S4LDdSVbndLasSb5dyMr6p');

async function test() {
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  };
  const provider = new anchor.AnchorProvider(new Connection('https://api.devnet.solana.com'), dummyWallet, {});
  const program = new anchor.Program(IDL, programId, provider);
  
  try {
    const tx = await program.methods.executePayment(new anchor.BN(10000000)).accounts({
      wallet: PublicKey.default,
      recipient: PublicKey.default
    }).transaction();
    console.log("Tx generation success:", tx);
  } catch (e) {
    console.error(e.stack);
  }
}
test();
