// ghost-wallet program integration test (TypeScript)
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Anchor } from "../target/types/anchor";
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("ghost-wallet", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Anchor as Program<Anchor>;
  const owner = provider.wallet;

  let walletPda: PublicKey;
  let walletBump: number;
  const agentName = "test-bot";

  before(async () => {
    [walletPda, walletBump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("ghost-wallet"), owner.publicKey.toBuffer(), Buffer.from(agentName)],
      program.programId
    );
  });

  it("Initialize wallet with policy", async () => {
    await program.methods
      .initializeWallet(
        agentName,
        new anchor.BN(0.5 * LAMPORTS_PER_SOL), // max_spend_per_day
        [],                                      // allowed_recipients (empty = open)
        false,                                   // time_restriction_enabled
        0,                                       // start_hour
        23,                                      // end_hour
        new anchor.BN(1 * LAMPORTS_PER_SOL)      // require_approval_above
      )
      .accounts({
        wallet: walletPda,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const wallet = await program.account.agentWallet.fetch(walletPda);
    assert.equal(wallet.agentName, agentName);
    assert.equal(wallet.policy.maxSpendPerDay.toNumber(), 0.5 * LAMPORTS_PER_SOL);
    assert.equal(wallet.policy.emergencyPaused, false);
    console.log("✅ Wallet initialized. PDA:", walletPda.toString());
  });

  it("Execute a good micropayment (0.001 SOL)", async () => {
    const recipient = anchor.web3.Keypair.generate();

    // First fund the wallet PDA
    const airdropSig = await provider.connection.requestAirdrop(walletPda, 2 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(airdropSig);

    const balanceBefore = await provider.connection.getBalance(recipient.publicKey);

    await program.methods
      .executePayment(new anchor.BN(0.001 * LAMPORTS_PER_SOL))
      .accounts({
        wallet: walletPda,
        recipient: recipient.publicKey,
      })
      .rpc();

    const balanceAfter = await provider.connection.getBalance(recipient.publicKey);
    assert.equal(balanceAfter - balanceBefore, 0.001 * LAMPORTS_PER_SOL);
    console.log("✅ Micropayment of 0.001 SOL succeeded!");
  });

  it("Rejects payment that exceeds daily limit", async () => {
    const recipient = anchor.web3.Keypair.generate();
    try {
      await program.methods
        .executePayment(new anchor.BN(5 * LAMPORTS_PER_SOL)) // 5 SOL > 0.5 daily limit
        .accounts({
          wallet: walletPda,
          recipient: recipient.publicKey,
        })
        .rpc();
      assert.fail("Should have thrown DailyLimitExceeded");
    } catch (err: any) {
      assert.include(err.message, "DailyLimitExceeded");
      console.log("✅ Correctly rejected: DailyLimitExceeded");
    }
  });

  it("Emergency pause blocks all payments", async () => {
    await program.methods
      .emergencyPause(true)
      .accounts({
        wallet: walletPda,
        owner: owner.publicKey,
      })
      .rpc();

    const recipient = anchor.web3.Keypair.generate();
    try {
      await program.methods
        .executePayment(new anchor.BN(0.001 * LAMPORTS_PER_SOL))
        .accounts({
          wallet: walletPda,
          recipient: recipient.publicKey,
        })
        .rpc();
      assert.fail("Should have thrown EmergencyPaused");
    } catch (err: any) {
      assert.include(err.message, "EmergencyPaused");
      console.log("✅ Correctly rejected: EmergencyPaused (wallet frozen)");
    }
  });
});
