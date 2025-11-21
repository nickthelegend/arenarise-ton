import { RISE_EXCHANGE_RATE } from './constants'

/**
 * Calculate the RISE token amount for a given TON amount
 * @param tonAmount - The amount of TON to convert
 * @returns The equivalent amount of RISE tokens (TON × 3000)
 */
export function calculateRiseAmount(tonAmount: number): number {
  return tonAmount * RISE_EXCHANGE_RATE
}

/**
 * Validate if a swap amount string is valid
 * @param amount - The amount string to validate
 * @returns true if the amount is a positive number, false otherwise
 */
export function validateSwapAmount(amount: string): boolean {
  // Check if empty or only whitespace
  if (!amount || amount.trim() === '') {
    return false
  }

  // Convert to number
  const numAmount = Number(amount)

  // Check if it's a valid number, positive, and not zero
  return !isNaN(numAmount) && numAmount > 0 && isFinite(numAmount)
}

/**
 * Format a token amount with appropriate decimal places and separators
 * @param amount - The token amount to format
 * @param decimals - The number of decimal places to display
 * @returns Formatted token amount string
 */
export function formatTokenAmount(amount: number, decimals: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  })
}
