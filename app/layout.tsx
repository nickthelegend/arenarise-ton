'use client'

import { Press_Start_2P, VT323 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import './globals.css'
import { useEffect } from 'react'

const pressStart = Press_Start_2P({ 
  weight: '400',
  subsets: ["latin"],
  variable: '--font-press-start'
});

const vt323 = VT323({ 
  weight: '400',
  subsets: ["latin"],
  variable: '--font-vt323'
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const manifestUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/tonconnect-manifest.json`
    : process.env.NEXT_PUBLIC_TON_MANIFEST_URL || 'http://localhost:3000/tonconnect-manifest.json'

  // Initialize Telegram Web App
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if we're in Telegram
      const tg = (window as any).Telegram?.WebApp
      if (tg) {
        tg.ready()
        tg.expand()
      }
    }
  }, [])

  return (
    <html lang="en" className="dark">
      <head>
        <title>ArenaRise - Beast Battle Game</title>
        <meta name="description" content="Create beasts, battle in the arena, and earn $RISE tokens" />
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body className={`${pressStart.variable} ${vt323.variable} font-sans antialiased`}>
        <TonConnectUIProvider
          manifestUrl={manifestUrl}
          actionsConfiguration={{
            twaReturnUrl: 'https://t.me/your_bot_name'
          }}
        >
          {children}
        </TonConnectUIProvider>
        <Analytics />
      </body>
    </html>
  )
}