import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/beasts/[id]
 * Get a single beast by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const beastId = params.id

    if (!beastId) {
      return NextResponse.json(
        { error: 'Beast ID is required' },
        { status: 400 }
      )
    }

    const { data: beast, error } = await supabase
      .from('beasts')
      .select('*')
      .eq('id', beastId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!beast) {
      return NextResponse.json(
        { error: 'Beast not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ beast })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
