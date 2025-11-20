'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react'
import { supabase } from '@/lib/supabase'

interface WalletContextType {
  address: string | null
  userId: string | null
  isConnected: boolean
  isLoading: boolean
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  userId: null,
  isConnected: false,
  isLoading: true,
})

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const address = useTonAddress()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function handleWalletConnection() {
      if (address) {
        try {
          // Get or create user
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet_address: address })
          })

          const data = await response.json()
          if (data.user) {
            setUserId(data.user.id)
          }
        } catch (error) {
          console.error('Error handling wallet connection:', error)
        }
      } else {
        setUserId(null)
      }
      setIsLoading(false)
    }

    handleWalletConnection()
  }, [address])

  return (
    <WalletContext.Provider
      value={{
        address,
        userId,
        isConnected: !!address,
        isLoading,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  return useContext(WalletContext)
}