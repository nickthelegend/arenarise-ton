import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Get beasts by owner address
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const owner_address = searchParams.get('owner_address')

    if (!owner_address) {
      return NextResponse.json(
        { error: 'Owner address is required' },
        { status: 400 }
      )
    }

    const { data: beasts, error } = await supabase
      .from('beasts')
      .select('*')
      .eq('owner_address', owner_address)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ beasts })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}