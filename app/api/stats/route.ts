import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Get ArenaRise statistics
export async function GET() {
  try {
    // Query total beasts count
    const { count: totalBeasts, error: beastsError } = await supabase
      .from('beasts')
      .select('*', { count: 'exact', head: true })

    if (beastsError) {
      console.error('Error fetching beasts count:', beastsError)
      return NextResponse.json(
        { error: beastsError.message },
        { status: 500 }
      )
    }

    // Query total users count (active players)
    const { count: activePlayers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (usersError) {
      console.error('Error fetching users count:', usersError)
      return NextResponse.json(
        { error: usersError.message },
        { status: 500 }
      )
    }

    // Query total battles count
    const { count: battlesFought, error: battlesError } = await supabase
      .from('battles')
      .select('*', { count: 'exact', head: true })

    if (battlesError) {
      console.error('Error fetching battles count:', battlesError)
      return NextResponse.json(
        { error: battlesError.message },
        { status: 500 }
      )
    }

    // Calculate total volume from battles bet_amount
    const { data: battles, error: volumeError } = await supabase
      .from('battles')
      .select('bet_amount')

    if (volumeError) {
      console.error('Error fetching battle volumes:', volumeError)
      return NextResponse.json(
        { error: volumeError.message },
        { status: 500 }
      )
    }

    // Sum up all bet amounts to get total volume
    const totalVolume = battles?.reduce((sum, battle) => {
      return sum + (parseFloat(battle.bet_amount?.toString() || '0'))
    }, 0) || 0

    // Format volume as string with 2 decimal places
    const formattedVolume = totalVolume.toFixed(2)

    return NextResponse.json({
      totalBeasts: totalBeasts || 0,
      activePlayers: activePlayers || 0,
      battlesFought: battlesFought || 0,
      totalVolume: formattedVolume
    })
  } catch (error: any) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
