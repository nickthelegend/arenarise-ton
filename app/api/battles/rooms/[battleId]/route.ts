import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * DELETE /api/battles/rooms/:battleId
 * Cancel a waiting battle room
 * Handles edge cases like concurrent cancellation and room state changes
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ battleId: string }> }
) {
  try {
    const { battleId } = await params

    if (!battleId) {
      return NextResponse.json(
        { error: 'Battle ID is required' },
        { status: 400 }
      )
    }

    // Get the battle to verify it exists and is in waiting state
    const { data: battle, error: findError } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single()

    if (findError || !battle) {
      console.error('Battle room not found:', findError)
      return NextResponse.json(
        { error: 'Battle room not found' },
        { status: 404 }
      )
    }

    // Only allow canceling rooms that are still waiting
    if (battle.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Only waiting rooms can be canceled. This room has already started or completed.' },
        { status: 400 }
      )
    }

    // Delete the battle room with status check to prevent race conditions
    // If another player joins at the same time, the delete will fail
    const { error: deleteError, count } = await supabase
      .from('battles')
      .delete({ count: 'exact' })
      .eq('id', battleId)
      .eq('status', 'waiting') // Double-check status to prevent race conditions

    if (deleteError) {
      console.error('Failed to delete battle room:', deleteError)
      return NextResponse.json(
        { error: 'Failed to cancel room. Please try again.' },
        { status: 500 }
      )
    }

    // Check if any rows were deleted
    if (count === 0) {
      // Room was not deleted, likely because status changed (someone joined)
      return NextResponse.json(
        { error: 'Room could not be canceled. It may have been joined by another player.' },
        { status: 409 } // 409 Conflict
      )
    }

    console.log(`Battle room ${battleId} canceled successfully`)

    return NextResponse.json({ 
      success: true,
      message: 'Battle room canceled successfully'
    })
  } catch (error: any) {
    console.error('Unexpected error in room cancellation:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
