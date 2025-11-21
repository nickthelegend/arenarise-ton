import { RISE_EXCHANGE_RATE, BACKEND_URL } from './constants'

/**
 * Calculate the RISE token amount for a given TON amount
 * @param tonAmount - The amount of TON to convert
 * @returns The equivalent amount of RISE tokens (TON × 3000)
 */
export function calculateRiseAmount(tonAmount: number): number {
  return tonAmount * RISE_EXCHANGE_RATE
}

/**
 * Response from the backend RISE token transfer API
 */
export interface RiseTransferResponse {
  success: boolean
  message: string
  fromWallet: string
  toWallet: string
  jettonAmount: string
  seqno: number
}

/**
 * Error class for backend API failures
 */
export class RiseTransferError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isRetryable: boolean = false
  ) {
    super(message)
    this.name = 'RiseTransferError'
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Request RISE tokens from the backend service
 * Includes automatic retry logic with exponential backoff for transient failures
 * 
 * @param walletAddress - The user's TON wallet address
 * @param riseAmount - The amount of RISE tokens to transfer (in whole tokens)
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Promise resolving to the transfer response
 * @throws RiseTransferError if the transfer fails after all retries
 */
export async function requestRiseTokens(
  walletAddress: string,
  riseAmount: number,
  maxRetries: number = 3
): Promise<RiseTransferResponse> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Make the API request
      const response = await fetch(`${BACKEND_URL}/api/send/rise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userWallet: walletAddress,
          amount: riseAmount,
        }),
      })

      // Handle successful response
      if (response.ok) {
        const data = await response.json()
        return data as RiseTransferResponse
      }

      // Handle error responses
      const errorText = await response.text().catch(() => 'Unknown error')
      
      // 5xx errors are retryable (server errors)
      if (response.status >= 500) {
        const error = new RiseTransferError(
          `Service temporarily unavailable (${response.status})`,
          response.status,
          true
        )
        lastError = error
        
        // If we have retries left, wait and try again
        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000 // Exponential backoff: 1s, 2s, 4s
          await sleep(delayMs)
          continue
        }
        
        throw error
      }
      
      // 4xx errors are not retryable (client errors)
      throw new RiseTransferError(
        `Failed to transfer RISE tokens: ${errorText}`,
        response.status,
        false
      )
      
    } catch (error) {
      // Network errors or fetch failures
      if (error instanceof RiseTransferError) {
        throw error
      }
      
      // Network timeout or connection error - retryable
      const networkError = new RiseTransferError(
        'Network error. Please check your connection and try again.',
        undefined,
        true
      )
      lastError = networkError
      
      // If we have retries left, wait and try again
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000 // Exponential backoff
        await sleep(delayMs)
        continue
      }
      
      throw networkError
    }
  }
  
  // Should never reach here, but just in case
  throw lastError || new RiseTransferError('Failed to transfer RISE tokens after multiple attempts')
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
