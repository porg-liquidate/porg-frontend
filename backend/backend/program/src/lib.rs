//! Porg - One-click liquidation tool for DeFi on Solana
//!
//! This smart contract provides functionality for:
//! 1. Batch liquidation of multiple tokens into a single token
//! 2. Cross-chain bridging via Wormhole
//! 3. Fee collection and management
//!
//! The contract is built using the Anchor framework and integrates with
//! Jupiter for optimal swap routes and Wormhole for cross-chain transfers.

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use solana_program::instruction::Instruction;
use solana_program::program::invoke_signed;

// Program ID - Replace with your actual program ID after deployment
declare_id!("Porg111111111111111111111111111111111111111");

#[program]
pub mod porg {
    use super::*;

    /// Initialize the Porg program state
    /// 
    /// This instruction creates the program state account and sets the initial
    /// parameters including the authority (admin) and fee settings.
    ///
    /// # Arguments
    /// * `ctx` - The context containing accounts
    ///
    /// # Returns
    /// * `Result<()>` - Result indicating success or failure
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let porg_state = &mut ctx.accounts.porg_state;
        porg_state.authority = ctx.accounts.authority.key();
        porg_state.fee_basis_points = 100; // 1% fee (100 basis points)
        porg_state.fee_account = ctx.accounts.fee_account.key();
        Ok(())
    }

    /// Update the fee percentage
    /// 
    /// This instruction allows the authority to update the fee percentage.
    /// The fee is specified in basis points (1/100th of a percent).
    ///
    /// # Arguments
    /// * `ctx` - The context containing accounts
    /// * `new_fee_basis_points` - The new fee in basis points (e.g., 100 = 1%)
    ///
    /// # Returns
    /// * `Result<()>` - Result indicating success or failure
    pub fn update_fee(ctx: Context<UpdateFee>, new_fee_basis_points: u16) -> Result<()> {
        require!(
            new_fee_basis_points <= 500, // Max 5% fee
            PorgError::FeeTooHigh
        );
        
        let porg_state = &mut ctx.accounts.porg_state;
        porg_state.fee_basis_points = new_fee_basis_points;
        
        Ok(())
    }

    /// Batch liquidate multiple tokens into a single token
    /// 
    /// This instruction allows a user to convert multiple tokens into a single target token
    /// in one transaction. It uses Jupiter for optimal swap routes.
    ///
    /// # Arguments
    /// * `ctx` - The context containing accounts
    /// * `target_token_mint` - The mint of the target token
    /// * `include_dust` - Whether to include dust tokens (small value tokens)
    /// * `min_token_value_usd` - Minimum token value in USD cents to include
    /// * `min_output_amount` - Minimum expected output amount
    /// * `jupiter_route_instructions` - Instructions for Jupiter swaps
    /// * `jupiter_route_accounts` - Accounts for Jupiter swaps
    ///
    /// # Returns
    /// * `Result<()>` - Result indicating success or failure
    pub fn batch_liquidate<'info>(
        ctx: Context<'_, '_, '_, 'info, BatchLiquidate<'info>>,
        target_token_mint: Pubkey,
        include_dust: bool,
        min_token_value_usd: u64, // Value in USD cents (e.g., 100 = $1.00)
        min_output_amount: u64,
        jupiter_route_instructions: Vec<Vec<u8>>,
        jupiter_route_accounts: Vec<Vec<Pubkey>>,
    ) -> Result<()> {
        let porg_state = &ctx.accounts.porg_state;
        let user = &ctx.accounts.user;
        let target_token_account = &ctx.accounts.target_token_account;
        
        // Verify the target token account belongs to the user
        require!(
            target_token_account.owner == user.key(),
            PorgError::InvalidTargetAccount
        );
        
        // Verify the target token mint matches
        require!(
            target_token_account.mint == target_token_mint,
            PorgError::InvalidTargetMint
        );
        
        // Process each token in the remaining accounts
        let mut total_input_value_usd = 0;
        let mut remaining_accounts_iter = ctx.remaining_accounts.iter();
        
        // First, filter tokens based on include_dust and min_token_value_usd
        let mut token_accounts_to_liquidate = Vec::new();
        
        while let Some(token_account_info) = remaining_accounts_iter.next() {
            let token_account: Account<TokenAccount> = Account::try_from(token_account_info)?;
            
            // Skip if it's the target token account
            if token_account.key() == target_token_account.key() {
                continue;
            }
            
            // Skip if it's not owned by the user
            if token_account.owner != user.key() {
                continue;
            }
            
            // Get token value in USD (this would be implemented with an oracle in a real contract)
            let token_value_usd = get_token_value_usd(&token_account)?;
            
            // Skip dust tokens if not including dust
            if !include_dust && token_value_usd < min_token_value_usd {
                continue;
            }
            
            total_input_value_usd += token_value_usd;
            token_accounts_to_liquidate.push(token_account);
        }
        
        // Execute Jupiter swaps for each token
        for (i, token_account) in token_accounts_to_liquidate.iter().enumerate() {
            // Get the Jupiter route instruction and accounts for this token
            let route_instruction_data = jupiter_route_instructions.get(i)
                .ok_or(PorgError::InvalidJupiterRoute)?;
            let route_accounts = jupiter_route_accounts.get(i)
                .ok_or(PorgError::InvalidJupiterRoute)?;
            
            // Create and execute the Jupiter swap instruction
            let mut account_infos = Vec::new();
            for account_pubkey in route_accounts {
                let account_info = ctx.remaining_accounts.iter()
                    .find(|a| a.key() == account_pubkey)
                    .ok_or(PorgError::AccountNotFound)?;
                account_infos.push(account_info.clone());
            }
            
            let instruction = Instruction {
                program_id: jupiter_program_id(),
                accounts: account_infos.iter().map(|a| AccountMeta {
                    pubkey: *a.key,
                    is_signer: a.is_signer,
                    is_writable: a.is_writable,
                }).collect(),
                data: route_instruction_data.clone(),
            };
            
            invoke_signed(
                &instruction,
                &account_infos,
                &[],
            )?;
        }
        
        // Calculate and collect fee
        let fee_amount = calculate_fee(
            target_token_account.amount, 
            porg_state.fee_basis_points
        )?;
        
        if fee_amount > 0 {
            // Transfer fee to the fee account
            let cpi_accounts = Transfer {
                from: target_token_account.to_account_info(),
                to: ctx.accounts.fee_account.to_account_info(),
                authority: user.to_account_info(),
            };
            
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            
            token::transfer(cpi_ctx, fee_amount)?;
        }
        
        // Verify minimum output amount after fees
        require!(
            target_token_account.amount >= min_output_amount + fee_amount,
            PorgError::InsufficientOutput
        );
        
        Ok(())
    }

    /// Bridge tokens to another chain via Wormhole
    /// 
    /// This instruction allows a user to bridge tokens from Solana to another
    /// blockchain using Wormhole.
    ///
    /// # Arguments
    /// * `ctx` - The context containing accounts
    /// * `amount` - The amount of tokens to bridge
    /// * `target_chain` - The target chain ID
    /// * `recipient_address` - The recipient address on the target chain
    /// * `nonce` - A unique nonce for the transfer
    ///
    /// # Returns
    /// * `Result<()>` - Result indicating success or failure
    pub fn bridge_tokens(
        ctx: Context<BridgeTokens>,
        amount: u64,
        target_chain: u16,
        recipient_address: [u8; 32],
        nonce: u64,
    ) -> Result<()> {
        // Transfer tokens to the bridge account
        let cpi_accounts = Transfer {
            from: ctx.accounts.source_token_account.to_account_info(),
            to: ctx.accounts.bridge_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, amount)?;
        
        // Call Wormhole bridge instruction
        let bridge_instruction = create_wormhole_transfer_instruction(
            ctx.accounts.bridge_token_account.key(),
            amount,
            target_chain,
            recipient_address,
            nonce,
        )?;
        
        invoke_signed(
            &bridge_instruction,
            &[
                ctx.accounts.bridge_token_account.to_account_info(),
                ctx.accounts.wormhole_config.to_account_info(),
                ctx.accounts.wormhole_message.to_account_info(),
                ctx.accounts.wormhole_emitter.to_account_info(),
                ctx.accounts.wormhole_sequence.to_account_info(),
                ctx.accounts.wormhole_fee_collector.to_account_info(),
                ctx.accounts.clock.to_account_info(),
                ctx.accounts.rent.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;
        
        Ok(())
    }
}

/// Accounts for the initialize instruction
#[derive(Accounts)]
pub struct Initialize<'info> {
    /// The program state account to be initialized
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 2 + 32
    )]
    pub porg_state: Account<'info, PorgState>,
    
    /// The authority (admin) who will pay for the initialization
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// The account that will receive fees
    /// CHECK: This is the fee account that will receive fees
    pub fee_account: AccountInfo<'info>,
    
    /// The system program
    pub system_program: Program<'info, System>,
}

/// Accounts for the update_fee instruction
#[derive(Accounts)]
pub struct UpdateFee<'info> {
    /// The program state account
    #[account(
        mut,
        has_one = authority @ PorgError::Unauthorized
    )]
    pub porg_state: Account<'info, PorgState>,
    
    /// The authority (admin) who can update fees
    pub authority: Signer<'info>,
}

/// Accounts for the batch_liquidate instruction
#[derive(Accounts)]
pub struct BatchLiquidate<'info> {
    /// The program state account
    pub porg_state: Account<'info, PorgState>,
    
    /// The user performing the liquidation
    #[account(mut)]
    pub user: Signer<'info>,
    
    /// The target token account to receive liquidated funds
    #[account(mut)]
    pub target_token_account: Account<'info, TokenAccount>,
    
    /// The fee account to receive fees
    #[account(mut)]
    pub fee_account: Account<'info, TokenAccount>,
    
    /// The token program
    pub token_program: Program<'info, Token>,
}

/// Accounts for the bridge_tokens instruction
#[derive(Accounts)]
pub struct BridgeTokens<'info> {
    /// The user performing the bridge
    #[account(mut)]
    pub user: Signer<'info>,
    
    /// The source token account
    #[account(mut)]
    pub source_token_account: Account<'info, TokenAccount>,
    
    /// The bridge token account
    #[account(mut)]
    /// CHECK: This is the bridge token account
    pub bridge_token_account: AccountInfo<'info>,
    
    /// Wormhole config account
    /// CHECK: Wormhole config account
    pub wormhole_config: AccountInfo<'info>,
    
    /// Wormhole message account
    /// CHECK: Wormhole message account
    #[account(mut)]
    pub wormhole_message: AccountInfo<'info>,
    
    /// Wormhole emitter account
    /// CHECK: Wormhole emitter account
    pub wormhole_emitter: AccountInfo<'info>,
    
    /// Wormhole sequence account
    /// CHECK: Wormhole sequence account
    #[account(mut)]
    pub wormhole_sequence: AccountInfo<'info>,
    
    /// Wormhole fee collector account
    /// CHECK: Wormhole fee collector account
    #[account(mut)]
    pub wormhole_fee_collector: AccountInfo<'info>,
    
    /// The token program
    pub token_program: Program<'info, Token>,
    
    /// The system program
    pub system_program: Program<'info, System>,
    
    /// The clock sysvar
    pub clock: Sysvar<'info, Clock>,
    
    /// The rent sysvar
    pub rent: Sysvar<'info, Rent>,
}

/// The program state account structure
#[account]
pub struct PorgState {
    /// The authority (admin) who can update program parameters
    pub authority: Pubkey,
    
    /// The fee in basis points (1/100th of a percent)
    pub fee_basis_points: u16,
    
    /// The account that receives fees
    pub fee_account: Pubkey,
}

/// Error codes for the Porg program
#[error_code]
pub enum PorgError {
    /// Unauthorized access attempt
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
    
    /// Fee is set too high
    #[msg("Fee is too high")]
    FeeTooHigh,
    
    /// Invalid target token account
    #[msg("Invalid target token account")]
    InvalidTargetAccount,
    
    /// Invalid target token mint
    #[msg("Invalid target token mint")]
    InvalidTargetMint,
    
    /// Invalid Jupiter route
    #[msg("Invalid Jupiter route")]
    InvalidJupiterRoute,
    
    /// Account not found
    #[msg("Account not found")]
    AccountNotFound,
    
    /// Insufficient output amount
    #[msg("Insufficient output amount")]
    InsufficientOutput,
}

// Helper functions

/// Get the Jupiter program ID
/// 
/// # Returns
/// * `Pubkey` - The Jupiter program ID
fn jupiter_program_id() -> Pubkey {
    // Jupiter program ID
    Pubkey::new_from_array([
        0x4b, 0x83, 0x72, 0x1b, 0x7a, 0x9f, 0x65, 0xf1, 
        0x6e, 0x95, 0xaa, 0x5c, 0x49, 0x8e, 0x1c, 0x7f, 
        0x01, 0x73, 0x48, 0x12, 0x5c, 0x2c, 0x8f, 0x3c, 
        0x35, 0xf6, 0x10, 0x11, 0x65, 0x5f, 0x3d, 0x6a
    ])
}

/// Get the token value in USD
/// 
/// # Arguments
/// * `token_account` - The token account
///
/// # Returns
/// * `Result<u64>` - The token value in USD cents
fn get_token_value_usd(token_account: &Account<TokenAccount>) -> Result<u64> {
    // In a real implementation, this would use an oracle to get the token value
    // For simplicity, we're returning a dummy value
    Ok(100) // $1.00 in cents
}

/// Calculate the fee amount
/// 
/// # Arguments
/// * `amount` - The amount to calculate fee on
/// * `fee_basis_points` - The fee in basis points
///
/// # Returns
/// * `Result<u64>` - The fee amount
fn calculate_fee(amount: u64, fee_basis_points: u16) -> Result<u64> {
    // Calculate fee (amount * fee_basis_points / 10000)
    Ok(amount.checked_mul(fee_basis_points as u64)
        .ok_or(PorgError::Unauthorized)?
        .checked_div(10000)
        .ok_or(PorgError::Unauthorized)?)
}

/// Create a Wormhole transfer instruction
/// 
/// # Arguments
/// * `token_account` - The token account
/// * `amount` - The amount to transfer
/// * `target_chain` - The target chain ID
/// * `recipient_address` - The recipient address on the target chain
/// * `nonce` - A unique nonce for the transfer
///
/// # Returns
/// * `Result<Instruction>` - The Wormhole transfer instruction
fn create_wormhole_transfer_instruction(
    token_account: Pubkey,
    amount: u64,
    target_chain: u16,
    recipient_address: [u8; 32],
    nonce: u64,
) -> Result<Instruction> {
    // In a real implementation, this would construct the proper Wormhole instruction
    // For simplicity, we're returning a dummy instruction
    Ok(Instruction {
        program_id: Pubkey::new_from_array([0; 32]), // Wormhole program ID
        accounts: vec![],
        data: vec![],
    })
}
