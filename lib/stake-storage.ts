/**
 * Utility functions for managing stake data in session storage
 */

export interface StakeData {
  amount: number
  battleId: string
  timestamp: number
  transactionHash?: string
  status?: 'pending' | 'completed' | 'failed'
}

const STAKE_STORAGE_KEY = 'battle_stake'

/**
 * Store stake data in session storage
 */
export function setStakeData(data: StakeData): void {
  if (typeof window === 'undefined') return
  
  try {
    sessionStorage.setItem(STAKE_STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Error storing stake data:', error)
  }
}

/**
 * Retrieve stake data from session storage
 */
export function getStakeData(): StakeData | null {
  if (typeof window === 'undefined') return null
  
  try {
    const data = sessionStorage.getItem(STAKE_STORAGE_KEY)
    if (!data) return null
    
    return JSON.parse(data) as StakeData
  } catch (error) {
    console.error('Error retrieving stake data:', error)
    return null
  }
}

/**
 * Clear stake data from session storage
 */
export function clearStakeData(): void {
  if (typeof window === 'undefined') return
  
  try {
    sessionStorage.removeItem(STAKE_STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing stake data:', error)
  }
}

/**
 * Validate that stake data exists and matches the given battle ID
 */
export function validateStakeData(battleId: string): boolean {
  const stakeData = getStakeData()
  
  if (!stakeData) return false
  if (stakeData.battleId !== battleId) return false
  
  // Optional: Check if stake is not too old (e.g., 1 hour)
  const oneHourInMs = 60 * 60 * 1000
  const isExpired = Date.now() - stakeData.timestamp > oneHourInMs
  
  if (isExpired) {
    clearStakeData()
    return false
  }
  
  return true
}
