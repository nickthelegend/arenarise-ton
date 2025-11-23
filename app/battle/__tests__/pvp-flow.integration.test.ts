/**
 * End-to-End Integration Test for Real-Time PVP Battles
 * 
 * This test suite validates the complete PVP battle flow:
 * 1. Create room → 2. Share → 3. Join → 4. Battle → 5. Complete
 * 
 * Requirements: All requirements from real-time-pvp-battles spec
 * 
 * NOTE: These tests require a running development server and database.
 * Run with: INTEGRATION_TEST=true npm test -- app/battle/__tests__/pvp-flow.integration.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key'
const SKIP_INTEGRATION = !process.env.INTEGRATION_TEST

describe('PVP Battle Flow - End-to-End Integration', () => {
  let supabase: any
  let testBattleId: string | null = null
  let testRoomCode: string | null = null
  let player1Id: string
  let player2Id: string
  let beast1Id: number
  let beast2Id: number

  beforeEach(async () => {
    if (SKIP_INTEGRATION) {
      console.log('Skipping integration tests (set INTEGRATION_TEST=true to run)')
      return
    }

    // Initialize Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    // Generate test player IDs
    player1Id = `test-player-1-${Date.now()}`
    player2Id = `test-player-2-${Date.now()}`
    
    // Use existing beast IDs (assuming beasts exist in test DB)
    beast1Id = 1
    beast2Id = 2
  })

  afterEach(async () => {
    // Cleanup: Delete test battle if created
    if (testBattleId && supabase) {
      try {
        await supabase.from('battles').delete().eq('id', testBattleId)
      } catch (error) {
        console.warn('Cleanup failed:', error)
      }
    }
    testBattleId = null
    testRoomCode = null
  })

  describe('Complete Flow: Create → Share → Join → Battle → Complete', () => {
    it('should complete the full PVP battle flow successfully', async () => {
      if (SKIP_INTEGRATION) return

      // STEP 1: Create Room
      console.log('Step 1: Creating battle room...')
      
      const createResponse = await fetch(`${BASE_URL}/api/battles/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: player1Id,
          beast_id: beast1Id,
        }),
      })

      expect(createResponse.ok).toBe(true)
      const createData = await createResponse.json()
      
      expect(createData.battle).toBeDefined()
      expect(createData.battle.room_code).toBeDefined()
      expect(createData.battle.room_code).toHaveLength(6)
      expect(createData.battle.status).toBe('waiting')
      expect(createData.battle.player1_id).toBe(player1Id)
      expect(createData.battle.player2_id).toBeNull()
      
      testBattleId = createData.battle.id
      testRoomCode = createData.battle.room_code
      
      console.log(`✓ Room created with code: ${testRoomCode}`)

      // STEP 2: Verify room appears in rooms list
      console.log('Step 2: Verifying room appears in list...')
      
      const listResponse = await fetch(`${BASE_URL}/api/battles/rooms`)
      expect(listResponse.ok).toBe(true)
      
      const listData = await listResponse.json()
      expect(listData.rooms).toBeDefined()
      expect(Array.isArray(listData.rooms)).toBe(true)
      
      const createdRoom = listData.rooms.find((r: any) => r.room_code === testRoomCode)
      expect(createdRoom).toBeDefined()
      expect(createdRoom.player1_id).toBe(player1Id)
      
      console.log('✓ Room appears in list')

      // STEP 3: Generate Telegram share URL (simulated)
      console.log('Step 3: Generating Telegram share URL...')
      
      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/battle/pvp?join=${testRoomCode}`
      expect(shareUrl).toContain(testRoomCode)
      expect(shareUrl).toContain('/battle/pvp')
      
      console.log(`✓ Share URL generated: ${shareUrl}`)

      // STEP 4: Join room
      console.log('Step 4: Joining room...')
      
      const joinResponse = await fetch(`${BASE_URL}/api/battles/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_code: testRoomCode,
          player_id: player2Id,
          beast_id: beast2Id,
        }),
      })

      expect(joinResponse.ok).toBe(true)
      const joinData = await joinResponse.json()
      
      expect(joinData.success).toBe(true)
      expect(joinData.battle_id).toBe(testBattleId)
      
      console.log('✓ Player 2 joined successfully')

      // STEP 5: Verify battle state updated
      console.log('Step 5: Verifying battle state...')
      
      const { data: battle, error } = await supabase
        .from('battles')
        .select('*')
        .eq('id', testBattleId)
        .single()

      expect(error).toBeNull()
      expect(battle).toBeDefined()
      expect(battle.status).toBe('in_progress')
      expect(battle.player2_id).toBe(player2Id)
      expect(battle.beast2_id).toBe(beast2Id)
      
      console.log('✓ Battle status updated to in_progress')

      // STEP 6: Simulate battle moves (simplified)
      console.log('Step 6: Simulating battle moves...')
      
      // Player 1 makes a move
      const move1Response = await fetch(`${BASE_URL}/api/battles/moves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battle_id: testBattleId,
          player_id: player1Id,
          move_id: 1,
          turn_number: 1,
        }),
      })

      expect(move1Response.ok).toBe(true)
      console.log('✓ Player 1 move recorded')

      // STEP 7: Complete battle (simulate one beast reaching 0 HP)
      console.log('Step 7: Completing battle...')
      
      const completeResponse = await fetch(`${BASE_URL}/api/battles/${testBattleId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winner_id: player1Id,
        }),
      })

      expect(completeResponse.ok).toBe(true)
      const completeData = await completeResponse.json()
      
      expect(completeData.success).toBe(true)
      
      console.log('✓ Battle completed')

      // STEP 8: Verify final battle state
      console.log('Step 8: Verifying final state...')
      
      const { data: finalBattle } = await supabase
        .from('battles')
        .select('*')
        .eq('id', testBattleId)
        .single()

      expect(finalBattle.status).toBe('completed')
      expect(finalBattle.winner_id).toBe(player1Id)
      
      console.log('✓ Final state verified')
      console.log('✅ Complete PVP flow test passed!')
    }, 30000) // 30 second timeout for full flow
  })

  describe('Room Code Validation', () => {
    it('should reject invalid room code formats', async () => {
      if (SKIP_INTEGRATION) return

      const invalidCodes = ['ABC', 'ABC12345', '123', 'ABCDEF!', '']
      
      for (const code of invalidCodes) {
        const response = await fetch(`${BASE_URL}/api/battles/rooms/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room_code: code,
            player_id: player2Id,
            beast_id: beast2Id,
          }),
        })

        const data = await response.json()
        expect(data.success).toBe(false)
        expect(data.error).toBeDefined()
      }
    })

    it('should reject non-existent room codes', async () => {
      if (SKIP_INTEGRATION) return

      const response = await fetch(`${BASE_URL}/api/battles/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_code: 'XXXXXX',
          player_id: player2Id,
          beast_id: beast2Id,
        }),
      })

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('not found')
    })
  })

  describe('Room Cancellation', () => {
    it('should allow host to cancel waiting room', async () => {
      if (SKIP_INTEGRATION) return

      // Create room
      const createResponse = await fetch(`${BASE_URL}/api/battles/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: player1Id,
          beast_id: beast1Id,
        }),
      })

      const createData = await createResponse.json()
      testBattleId = createData.battle.id
      testRoomCode = createData.battle.room_code

      // Cancel room
      const cancelResponse = await fetch(`${BASE_URL}/api/battles/rooms/${testBattleId}`, {
        method: 'DELETE',
      })

      expect(cancelResponse.ok).toBe(true)

      // Verify room is deleted
      const { data: battle } = await supabase
        .from('battles')
        .select('*')
        .eq('id', testBattleId)
        .single()

      expect(battle).toBeNull()
      testBattleId = null // Prevent cleanup attempt
    })
  })

  describe('Concurrent Join Attempts', () => {
    it('should handle concurrent join attempts gracefully', async () => {
      if (SKIP_INTEGRATION) return

      // Create room
      const createResponse = await fetch(`${BASE_URL}/api/battles/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: player1Id,
          beast_id: beast1Id,
        }),
      })

      const createData = await createResponse.json()
      testBattleId = createData.battle.id
      testRoomCode = createData.battle.room_code

      // Attempt to join with two different players simultaneously
      const player3Id = `test-player-3-${Date.now()}`
      
      const [join1, join2] = await Promise.all([
        fetch(`${BASE_URL}/api/battles/rooms/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room_code: testRoomCode,
            player_id: player2Id,
            beast_id: beast2Id,
          }),
        }),
        fetch(`${BASE_URL}/api/battles/rooms/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room_code: testRoomCode,
            player_id: player3Id,
            beast_id: beast2Id,
          }),
        }),
      ])

      const data1 = await join1.json()
      const data2 = await join2.json()

      // One should succeed, one should fail
      const successes = [data1.success, data2.success].filter(Boolean).length
      expect(successes).toBe(1)
    })
  })

  describe('Real-time Updates', () => {
    it('should receive real-time updates when room is joined', async () => {
      // This test requires a real Supabase connection with real-time enabled
      // Skip if not in integration test environment
      if (!process.env.INTEGRATION_TEST) {
        console.log('Skipping real-time test (set INTEGRATION_TEST=true to run)')
        return
      }

      // Create room
      const createResponse = await fetch(`${BASE_URL}/api/battles/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: player1Id,
          beast_id: beast1Id,
        }),
      })

      const createData = await createResponse.json()
      testBattleId = createData.battle.id
      testRoomCode = createData.battle.room_code

      // Set up real-time subscription
      let updateReceived = false
      const channel = supabase
        .channel(`battle_${testBattleId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'battles',
          filter: `id=eq.${testBattleId}`,
        }, () => {
          updateReceived = true
        })
        .subscribe()

      // Wait for subscription to be ready
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Join room (should trigger update)
      await fetch(`${BASE_URL}/api/battles/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_code: testRoomCode,
          player_id: player2Id,
          beast_id: beast2Id,
        }),
      })

      // Wait for real-time update (max 5 seconds)
      await new Promise(resolve => setTimeout(resolve, 5000))

      expect(updateReceived).toBe(true)

      // Cleanup
      await supabase.removeChannel(channel)
    }, 10000)
  })
})
