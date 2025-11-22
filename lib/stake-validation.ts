export interface StakeValidationResult {
  isValid: boolean
  error?: string
}

export interface StakeValidationParams {
  stakeAmount: number
  isWalletConnected: boolean
  jettonWalletAddress?: string
}

/**
 * Validates stake parameters before initiating a jetton transfer
 * @param params - Validation parameters
 * @returns Validation result with error message if invalid
 */
export function validateStake(params: StakeValidationParams): StakeValidationResult {
  const { stakeAmount, isWalletConnected, jettonWalletAddress } = params

  // Validate stake amount is positive
  if (stakeAmount <= 0) {
    return {
      isValid: false,
      error: 'Stake amount must be greater than zero'
    }
  }

  // Validate wallet is connected
  if (!isWalletConnected) {
    return {
      isValid: false,
      error: 'Please connect your wallet to stake tokens'
    }
  }

  // Validate jetton wallet address is provided
  if (!jettonWalletAddress || jettonWalletAddress.trim() === '') {
    return {
      isValid: false,
      error: 'Jetton wallet address not found'
    }
  }

  return {
    isValid: true
  }
}
