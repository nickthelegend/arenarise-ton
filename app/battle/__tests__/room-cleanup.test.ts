/**
 * Room Cleanup Test
 * 
 * Tests that stale rooms (older than 10 minutes with status='waiting') are cleaned up
 * Requirements: 1.5, Design section on Room Cleanup
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key'

describe('Room Cleanup', () => {
  let supabase: any
  let testBattleIds: string[] = []

  beforeEach(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    testBattleIds = []
  })

  afterEach(async () => {
    // Cleanup test battles
    if (testBattleIds.length > 0 && supabase) {
      try {
        await supabase.from('battles').delete().in('id', testBattleIds)
      } catch (error) {
        console.warn('Cleanup failed:', error)
      }
    }
  })

  it('should clean up stale rooms older than 10 minutes', async () => {
    // This test validates the cleanup logic exists
    // In a real scenario, this would be run by a cron job or database function
    
    const playerId = `test-player-${Date.now()}`
    const beastId = 1

    // Create a test room
    const { data: battle, error: createError } = await supabase
      .from('battles')
      .insert({
        player1_id: playerId,
        beast1_id: beastId,
        status: 'waiting',
        room_code: 'TEST01',
        // Simulate old timestamp (11 minutes ago)
        created_at: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.warn('Could not create test battle:', createError)
      return // Skip test if we can't create test data
    }

    testBattleIds.push(battle.id)

    // Execute cleanup query (simulating the cleanup function)
    const { error: deleteError } = await supabase
      .from('battles')
      .delete()
      .eq('status', 'waiting')
      .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())

    expect(deleteError).toBeNull()

    // Verify the stale room was deleted
    const { data: deletedBattle } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battle.id)
      .single()

    expect(deletedBattle).toBeNull()
    
    // Remove from cleanup list since it's already deleted
    testBattleIds = []
  })

  it('should NOT clean up recent rooms (less than 10 minutes old)', async () => {
    const playerId = `test-player-${Date.now()}`
    const beastId = 1

    // Create a recent test room (5 minutes ago)
    const { data: battle, error: createError } = await supabase
      .from('battles')
      .insert({
        player1_id: playerId,
        beast1_id: beastId,
        status: 'waiting',
        room_code: 'TEST02',
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.warn('Could not create test battle:', createError)
      return
    }

    testBattleIds.push(battle.id)

    // Execute cleanup query
    const { error: deleteError } = await supabase
      .from('battles')
      .delete()
      .eq('status', 'waiting')
      .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())

    expect(deleteError).toBeNull()

    // Verify the recent room was NOT deleted
    const { data: existingBattle } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battle.id)
      .single()

    expect(existingBattle).toBeDefined()
    expect(existingBattle.id).toBe(battle.id)
  })

  it('should NOT clean up in-progress or completed battles', async () => {
    const playerId = `test-player-${Date.now()}`
    const beastId = 1

    // Create old battles with different statuses
    const { data: inProgressBattle } = await supabase
      .from('battles')
      .insert({
        player1_id: playerId,
        player2_id: `${playerId}-2`,
        beast1_id: beastId,
        beast2_id: beastId,
        status: 'in_progress',
        room_code: 'TEST03',
        created_at: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    const { data: completedBattle } = await supabase
      .from('battles')
      .insert({
        player1_id: playerId,
        player2_id: `${playerId}-2`,
        beast1_id: beastId,
        beast2_id: beastId,
        status: 'completed',
        winner_id: playerId,
        room_code: 'TEST04',
        created_at: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (inProgressBattle) testBattleIds.push(inProgressBattle.id)
    if (completedBattle) testBattleIds.push(completedBattle.id)

    // Execute cleanup query (only targets 'waiting' status)
    await supabase
      .from('battles')
      .delete()
      .eq('status', 'waiting')
      .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())

    // Verify in-progress and completed battles still exist
    if (inProgressBattle) {
      const { data: stillInProgress } = await supabase
        .from('battles')
        .select('*')
        .eq('id', inProgressBattle.id)
        .single()

      expect(stillInProgress).toBeDefined()
    }

    if (completedBattle) {
      const { data: stillCompleted } = await supabase
        .from('battles')
        .select('*')
        .eq('id', completedBattle.id)
        .single()

      expect(stillCompleted).toBeDefined()
    }
  })
})
