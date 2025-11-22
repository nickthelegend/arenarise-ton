/**
 * Coin Flip Betting Game Utilities
 * Core betting logic and validation functions
 */

export type CoinSide = 'heads' | 'tails';

export interface BetValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a bet amount against business rules
 * Requirements: 2.3, 2.4
 * 
 * @param amount - The bet amount in TON
 * @param walletBalance - The user's current wallet balance in TON
 * @returns Validation result with error message if invalid
 */
export function validateBetAmount(
  amount: number,
  walletBalance: number
): BetValidationResult {
  // Validate amount is greater than zero (Requirement 2.3)
  if (amount <= 0) {
    return {
      valid: false,
      error: 'Bet amount must be greater than zero'
    };
  }

  // Check against wallet balance (Requirement 2.4)
  if (amount > walletBalance) {
    return {
      valid: false,
      error: `Insufficient balance. You have ${walletBalance} TON available`
    };
  }

  return { valid: true };
}

/**
 * Generates a random coin flip result using cryptographically secure randomness
 * Requirements: 6.1, 6.2
 * 
 * @returns Either 'heads' or 'tails'
 */
export function generateCoinFlipResult(): CoinSide {
  // Use crypto.getRandomValues for cryptographically secure randomness
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  
  // Use the random value to determine heads or tails
  // Even numbers = heads, odd numbers = tails
  const isHeads = randomBuffer[0] % 2 === 0;
  
  return isHeads ? 'heads' : 'tails';
}

/**
 * Calculates the payout for a coin flip bet
 * Requirements: 4.1
 * 
 * @param betAmount - The original bet amount in TON
 * @param won - Whether the user won the bet
 * @returns The payout amount in RISE tokens (4000 RISE per 1 TON for wins, 0 for losses)
 */
export function calculatePayout(betAmount: number, won: boolean): number {
  // Calculate 4000 RISE per 1 TON for wins (Requirement 4.1)
  if (won) {
    return betAmount * 4000;
  }
  
  // Return 0 for losses
  return 0;
}

/**
 * Checks if the user won the coin flip
 * Requirements: 3.5, 4.4
 * 
 * @param userChoice - The side the user bet on
 * @param result - The actual coin flip result
 * @returns True if the user won, false otherwise
 */
export function checkWinCondition(userChoice: CoinSide, result: CoinSide): boolean {
  // Compare user choice with result (Requirements 3.5, 4.4)
  return userChoice === result;
}
