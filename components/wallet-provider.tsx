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
          // Call user registration API endpoint
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet_address: address })
          })

          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`)
          }

          const data = await response.json()
          
          if (data.success && data.user) {
            setUserId(data.user.id)
            if (data.isNew) {
              console.log('New user registered:', data.user.wallet_address)
            } else {
              console.log('Existing user connected:', data.user.wallet_address)
            }
          } else {
            console.error('Failed to register/fetch user:', data.error)
            // Don't block user flow on registration failure
            setUserId(null)
          }
        } catch (error) {
          console.error('Error during user registration:', error)
          // Log error but don't block user flow
          setUserId(null)
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