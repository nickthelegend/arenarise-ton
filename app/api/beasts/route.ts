import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Get beasts by wallet address
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet_address = searchParams.get('wallet_address')

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    const { data: beasts, error } = await supabase
      .from('beasts')
      .select('*')
      .eq('owner_address', wallet_address)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Return empty array if no beasts found
    return NextResponse.json({ beasts: beasts || [] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}