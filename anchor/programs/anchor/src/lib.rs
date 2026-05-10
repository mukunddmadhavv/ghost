use anchor_lang::prelude::*;

declare_id!("HkWBDfjJnNMURCwJqyRCVfY8a8FT1MnKMdQVpFGke72b");

#[program]
pub mod ghost_wallet {
    use super::*;

    pub fn initialize_wallet(
        ctx: Context<InitializeWallet>,
        agent_name: String,
        agent_pubkey: Pubkey,
        max_spend_per_day: u64, // Lamports
        allowed_recipients: Vec<Pubkey>,
        time_restriction_enabled: bool,
        start_hour: u8,
        end_hour: u8,
        require_approval_above: u64, // Lamports
    ) -> Result<()> {
        require!(agent_name.len() <= 32, ErrorCode::NameTooLong);
        require!(allowed_recipients.len() <= 5, ErrorCode::TooManyRecipients);

        let wallet = &mut ctx.accounts.wallet;
        wallet.owner = ctx.accounts.owner.key();
        wallet.agent = agent_pubkey;
        wallet.agent_name = agent_name;
        wallet.bump = ctx.bumps.wallet;
        wallet.total_spent_today = 0;
        wallet.last_reset_at = Clock::get()?.unix_timestamp;

        wallet.policy = Policy {
            max_spend_per_day,
            allowed_recipients,
            time_restriction: TimeRestriction {
                enabled: time_restriction_enabled,
                start_hour,
                end_hour,
            },
            require_approval_above,
            emergency_paused: false,
        };

        Ok(())
    }

    pub fn update_policy(ctx: Context<UpdatePolicy>, new_policy: Policy) -> Result<()> {
        require!(new_policy.allowed_recipients.len() <= 5, ErrorCode::TooManyRecipients);
        
        let wallet = &mut ctx.accounts.wallet;
        wallet.policy = new_policy;
        Ok(())
    }

    pub fn emergency_pause(ctx: Context<UpdatePolicy>, paused: bool) -> Result<()> {
        let wallet = &mut ctx.accounts.wallet;
        wallet.policy.emergency_paused = paused;
        Ok(())
    }

    pub fn execute_payment(ctx: Context<ExecutePayment>, amount: u64) -> Result<()> {
        let wallet = &mut ctx.accounts.wallet;
        let clock = Clock::get()?;

        // 1. Emergency Pause Check
        require!(!wallet.policy.emergency_paused, ErrorCode::EmergencyPaused);

        // Reset daily spend if 24 hours have passed
        if clock.unix_timestamp - wallet.last_reset_at >= 86400 {
            wallet.total_spent_today = 0;
            wallet.last_reset_at = clock.unix_timestamp;
        }

        // 2. Daily Limit Check
        let new_total = wallet.total_spent_today.checked_add(amount).unwrap();
        require!(
            new_total <= wallet.policy.max_spend_per_day,
            ErrorCode::DailyLimitExceeded
        );

        // 3. Recipient Allowlist Check
        if !wallet.policy.allowed_recipients.is_empty() {
            require!(
                wallet.policy.allowed_recipients.contains(&ctx.accounts.recipient.key()),
                ErrorCode::RecipientNotAllowed
            );
        }

        // 4. Time Restriction Check (Note: On-chain time is rough UTC)
        if wallet.policy.time_restriction.enabled {
            // Very simplified hour calculation (Unix timestamp % 86400 / 3600)
            let current_hour = ((clock.unix_timestamp % 86400) / 3600) as u8;
            let start = wallet.policy.time_restriction.start_hour;
            let end = wallet.policy.time_restriction.end_hour;

            if start < end {
                require!(current_hour >= start && current_hour < end, ErrorCode::TimeRestricted);
            } else {
                // Wraps around midnight
                require!(current_hour >= start || current_hour < end, ErrorCode::TimeRestricted);
            }
        }

        // 5. Approval Threshold Flag
        require!(
            amount <= wallet.policy.require_approval_above,
            ErrorCode::ApprovalRequired
        );

        // 6. Rent Exemption Check
        let rent = Rent::get()?;
        let min_rent = rent.minimum_balance(wallet.to_account_info().data_len());
        let current_balance = wallet.to_account_info().lamports();
        require!(
            current_balance.checked_sub(amount).unwrap_or(0) >= min_rent,
            ErrorCode::RentExemptionViolation
        );

        // Perform the transfer
        **wallet.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.recipient.to_account_info().try_borrow_mut_lamports()? += amount;

        // Update state
        wallet.total_spent_today = new_total;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(agent_name: String)]
pub struct InitializeWallet<'info> {
    #[account(
        init,
        payer = owner,
        // space = 8 (disc) + 32 (owner) + 32 (agent) + 36 (agent_name) + 1 (bump) + 8 (spent) + 8 (time) + 8 (max_spend) + 164 (recipients) + 3 (time_res) + 8 (app_above) + 1 (paused) = ~309. We use 350 to be safe.
        space = 350,
        seeds = [b"ghost-wallet", owner.key().as_ref(), agent_name.as_bytes()],
        bump
    )]
    pub wallet: Account<'info, AgentWallet>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePolicy<'info> {
    #[account(
        mut,
        has_one = owner,
    )]
    pub wallet: Account<'info, AgentWallet>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExecutePayment<'info> {
    #[account(
        mut,
        has_one = agent @ ErrorCode::UnauthorizedAgent
    )]
    pub wallet: Account<'info, AgentWallet>,
    pub agent: Signer<'info>,
    /// CHECK: This is safe because we just transfer lamports to it
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,
}

#[account]
pub struct AgentWallet {
    pub owner: Pubkey,
    pub agent: Pubkey,
    pub agent_name: String,
    pub bump: u8,
    pub total_spent_today: u64,
    pub last_reset_at: i64,
    pub policy: Policy,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Policy {
    pub max_spend_per_day: u64,
    pub allowed_recipients: Vec<Pubkey>,
    pub time_restriction: TimeRestriction,
    pub require_approval_above: u64,
    pub emergency_paused: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TimeRestriction {
    pub enabled: bool,
    pub start_hour: u8,
    pub end_hour: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("EMERGENCY_PAUSED: Wallet is frozen")]
    EmergencyPaused,
    #[msg("DAILY_LIMIT_EXCEEDED: Transaction exceeds daily limit")]
    DailyLimitExceeded,
    #[msg("RECIPIENT_NOT_ALLOWED: Recipient is not in the allowlist")]
    RecipientNotAllowed,
    #[msg("TIME_RESTRICTED: Payments are outside allowed hours")]
    TimeRestricted,
    #[msg("APPROVAL_REQUIRED: Amount exceeds approval threshold")]
    ApprovalRequired,
    #[msg("UNAUTHORIZED_AGENT: Only the designated agent can execute payments")]
    UnauthorizedAgent,
    #[msg("NAME_TOO_LONG: Agent name must be 32 characters or fewer")]
    NameTooLong,
    #[msg("TOO_MANY_RECIPIENTS: Allowed recipients list exceeds maximum limit of 5")]
    TooManyRecipients,
    #[msg("RENT_EXEMPTION_VIOLATION: Payment would drop wallet balance below rent exemption minimum")]
    RentExemptionViolation,
}
