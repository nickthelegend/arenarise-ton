import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/beasts/[id]/moves - Assign default moves to a beast
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const beastId = parseInt(params.id)

    if (isNaN(beastId)) {
      return NextResponse.json(
        { error: 'Invalid beast ID' },
        { status: 400 }
      )
    }

    // Verify beast exists
    const { data: beast, error: beastError } = await supabase
      .from('beasts')
      .select('id')
      .eq('id', beastId)
      .single()

    if (beastError || !beast) {
      return NextResponse.json(
        { error: 'Beast not found' },
        { status: 404 }
      )
    }

    // Get all available moves
    const { data: allMoves, error: movesError } = await supabase
      .from('moves')
      .select('id')

    if (movesError) {
      return NextResponse.json(
        { error: 'Failed to fetch moves' },
        { status: 500 }
      )
    }

    if (!allMoves || allMoves.length < 4) {
      return NextResponse.json(
        { error: 'Not enough moves available in database' },
        { status: 500 }
      )
    }

    // Select 4 random moves
    const shuffled = [...allMoves].sort(() => Math.random() - 0.5)
    const selectedMoves = shuffled.slice(0, 4)

    // Insert beast_moves records
    const beastMovesRecords = selectedMoves.map((move, index) => ({
      beast_id: beastId,
      move_id: move.id,
      slot: index + 1
    }))

    const { data: insertedMoves, error: insertError } = await supabase
      .from('beast_moves')
      .insert(beastMovesRecords)
      .select('beast_id, move_id, slot')

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to assign moves: ${insertError.message}` },
        { status: 500 }
      )
    }

    // Fetch the full move details for the response
    const { data: assignedMoves, error: fetchError } = await supabase
      .from('beast_moves')
      .select(`
        slot,
        move_id,
        moves (
          id,
          name,
          damage,
          type,
          description
        )
      `)
      .eq('beast_id', beastId)
      .order('slot')

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch assigned moves' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      beast_id: beastId,
      moves: assignedMoves
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
