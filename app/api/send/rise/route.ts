import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = 'https://arenarise-backend.vercel.app'

/**
 * POST /api/send/rise
 * Proxy endpoint to send RISE tokens to a user wallet
 * This wraps the external backend API to avoid exposing the backend URL to clients
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userWallet, amount } = body

    // Validate required fields
    if (!userWallet) {
      return NextResponse.json(
        { error: 'User wallet address is required' },
        { status: 400 }
      )
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'Valid RISE amount is required' },
        { status: 400 }
      )
    }

    // Forward request to backend service
    const response = await fetch(`${BACKEND_URL}/api/send/rise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userWallet,
        amount: Number(amount),
      }),
    })

    // Handle backend response
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('Backend API error:', {
        status: response.status,
        error: errorText,
      })

      // Return appropriate error based on status code
      if (response.status >= 500) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable. Please try again.' },
          { status: 503 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to send RISE tokens' },
        { status: response.status }
      )
    }

    // Return successful response
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in /api/send/rise:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
