'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
  is_premium?: boolean
}

interface TelegramContextType {
  user: TelegramUser | null
  webApp: any
  isInTelegram: boolean
}

const TelegramContext = createContext<TelegramContextType>({
  user: null,
  webApp: null,
  isInTelegram: false,
})

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [webApp, setWebApp] = useState<any>(null)
  const [isInTelegram, setIsInTelegram] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tg = (window as any).Telegram?.WebApp
      
      if (tg) {
        setWebApp(tg)
        setIsInTelegram(true)
        
        // Initialize Telegram Web App
        tg.ready()
        tg.expand()
        
        // Get user data
        const tgUser = tg.initDataUnsafe?.user
        if (tgUser) {
          setUser({
            id: tgUser.id,
            first_name: tgUser.first_name,
            last_name: tgUser.last_name,
            username: tgUser.username,
            language_code: tgUser.language_code,
            photo_url: tgUser.photo_url,
            is_premium: tgUser.is_premium,
          })
          
          console.log('Telegram User:', tgUser)
        }
        
        // Set theme
        if (tg.colorScheme === 'dark') {
          document.documentElement.classList.add('dark')
        }
      }
    }
  }, [])

  return (
    <TelegramContext.Provider value={{ user, webApp, isInTelegram }}>
      {children}
    </TelegramContext.Provider>
  )
}

export function useTelegram() {
  const context = useContext(TelegramContext)
  if (context === undefined) {
    throw new Error('useTelegram must be used within a TelegramProvider')
  }
  return context
}
