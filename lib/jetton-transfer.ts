import { Address, beginCell, toNano } from '@ton/core'
import { TonConnectUI } from '@tonconnect/ui-react'

export interface JettonTransferParams {
  tonConnectUI: TonConnectUI
  jettonWalletAddress: string
  destinationAddress: string
  amount: number
  jettonDecimals: number
  forwardTonAmount?: string
  senderAddress: string  // The sender's TON wallet address for excess funds
}

/**
 * Sends a jetton transfer transaction following TEP-74 standard
 * @param params - Transfer parameters
 * @throws Error if the transfer fails
 */
export async function sendJettonTransfer(params: JettonTransferParams): Promise<void> {
  const {
    tonConnectUI,
    jettonWalletAddress,
    destinationAddress,
    amount,
    jettonDecimals,
    forwardTonAmount = '0.05',
    senderAddress
  } = params

  try {
    // Parse and normalize all addresses to user-friendly format
    const jettonWalletAddr = Address.parse(jettonWalletAddress)
    const destinationAddr = Address.parse(destinationAddress)
    const senderAddr = Address.parse(senderAddress)
    
    // Convert jetton wallet address to user-friendly bounceable format for TON Connect
    const jettonWalletUserFriendly = jettonWalletAddr.toString({ 
      bounceable: true, 
      urlSafe: true 
    })
    
    console.log('Jetton wallet address (raw):', jettonWalletAddress)
    console.log('Jetton wallet address (user-friendly):', jettonWalletUserFriendly)
    
    // Convert amount to smallest units
    // For example: 10.5 tokens with 9 decimals = 10500000000
    const amountInSmallestUnits = BigInt(Math.floor(amount * Math.pow(10, jettonDecimals)))

    // Build TEP-74 compliant payload (op code = 0xf8a7ea5)
    const body = beginCell()
      .storeUint(0xf8a7ea5, 32)                     // op code for jetton transfer
      .storeUint(0, 64)                             // query_id = 0
      .storeCoins(amountInSmallestUnits)            // amount of jettons in smallest units
      .storeAddress(destinationAddr)                // recipient address
      .storeAddress(senderAddr)                     // address to receive excess funds
      .storeUint(0, 1)                              // no custom payload flag
      .storeCoins(toNano(forwardTonAmount))         // forward TON amount (gas/notification)
      .storeUint(0, 1)                              // no forward payload
      .endCell()

    // Prepare transaction for TonConnect UI
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 360, // Valid for 6 minutes
      messages: [
        {
          address: jettonWalletUserFriendly,  // Use user-friendly format
          amount: toNano(forwardTonAmount).toString(), // TON amount for fees/gas
          payload: body.toBoc().toString('base64')
        }
      ]
    }

    console.log('Sending transaction:', JSON.stringify(transaction, null, 2))
    await tonConnectUI.sendTransaction(transaction)
  } catch (error: any) {
    console.error('Jetton transfer error details:', error)
    throw new Error(`Jetton transfer failed: ${error.message || 'Unknown error'}`)
  }
}
