/**
 * Jetton utility functions for fetching token balances
 */

const TONCENTER_TESTNET_API = 'https://testnet.toncenter.com/api/v3'
const TONCENTER_API_KEY = '0542baabbf376a72a7a6a60e5eb4739affd686a86378aa8af06d888290aef5fe'

// RISE Jetton master address on testnet
const RISE_JETTON_ADDRESS = 'kQCAaM-DjdE5lT9aGQVMczU5V-0V61JfZE1sYefOu21bBBKZ'

// RISE token has 9 decimals
const RISE_DECIMALS = 9

export interface JettonWallet {
  address: string
  balance: string
  owner: string
  jetton: string
  last_transaction_lt: string
}

export interface JettonWalletsResponse {
  jetton_wallets: JettonWallet[]
  address_book: Record<string, any>
}

/**
 * Fetch RISE token balance for a wallet address
 * @param ownerAddress - The wallet address to check balance for
 * @returns The RISE token balance as a number (human-readable)
 */
export async function fetchRiseBalance(ownerAddress: string): Promise<number> {
  try {
    const url = new URL(`${TONCENTER_TESTNET_API}/jetton/wallets`)
    url.searchParams.append('owner_address', ownerAddress)
    url.searchParams.append('jetton_address', RISE_JETTON_ADDRESS)
    url.searchParams.append('limit', '1')

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Add API key if available
    if (TONCENTER_API_KEY) {
      headers['X-API-Key'] = TONCENTER_API_KEY
    }

    const response = await fetch(url.toString(), { headers })

    if (!response.ok) {
      console.error('Failed to fetch RISE balance:', response.status, response.statusText)
      return 0
    }

    const data: JettonWalletsResponse = await response.json()

    // Check if wallet has any RISE tokens
    if (!data.jetton_wallets || data.jetton_wallets.length === 0) {
      return 0
    }

    // Get balance from first wallet (should only be one)
    const balance = data.jetton_wallets[0].balance

    // Convert from smallest unit to human-readable (divide by 10^9)
    const balanceNumber = BigInt(balance)
    const divisor = BigInt(10 ** RISE_DECIMALS)
    const humanReadable = Number(balanceNumber) / Number(divisor)

    return humanReadable
  } catch (error) {
    console.error('Error fetching RISE balance:', error)
    return 0
  }
}

/**
 * Format RISE balance for display
 * @param balance - The balance to format
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Formatted balance string
 */
export function formatRiseBalance(balance: number, decimals: number = 2): string {
  return balance.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  })
}
