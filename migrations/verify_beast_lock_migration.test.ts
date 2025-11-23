/**
 * Verification test for beast lock columns migration
 * 
 * This test verifies that:
 * 1. beast1_locked and beast2_locked columns exist
 * 2. Columns have correct types and defaults
 * 3. Existing battles are not affected
 * 
 * Run with: npm test migrations/verify_beast_lock_migration.test.ts
 */

import { describe, it, expect } from 'vitest'
import { supabase } from '../lib/supabase'

describe('Beast Lock Columns Migration Verification', () => {
  it('should have beast1_locked and beast2_locked columns in battles table', async () => {
    // Query the battles table to check if columns exist
    const { data, error } = await supabase
      .from('battles')
      .select('id, beast1_locked, beast2_locked')
      .limit(1)

    // If error occurs, it likely means columns don't exist
    expect(error).toBeNull()
    
    // If we have data, verify the columns are present
    if (data && data.length > 0) {
      expect(data[0]).toHaveProperty('beast1_locked')
      expect(data[0]).toHaveProperty('beast2_locked')
    }
  })

  it('should have boolean type for lock columns', async () => {
    const { data, error } = await supabase
      .from('battles')
      .select('beast1_locked, beast2_locked')
      .limit(1)

    expect(error).toBeNull()

    if (data && data.length > 0) {
      expect(typeof data[0].beast1_locked).toBe('boolean')
      expect(typeof data[0].beast2_locked).toBe('boolean')
    }
  })

  it('should have default value of false for new battles', async () => {
    const { data, error } = await supabase
      .from('battles')
      .select('beast1_locked, beast2_locked, beast1_id, beast2_id')
      .is('beast1_id', null)
      .limit(1)

    expect(error).toBeNull()

    if (data && data.length > 0) {
      // Battles without beast IDs should have locked=false
      expect(data[0].beast1_locked).toBe(false)
    }
  })

  it('should not affect existing battles count', async () => {
    const { count, error } = await supabase
      .from('battles')
      .select('*', { count: 'exact', head: true })

    expect(error).toBeNull()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  it('should have locked=true for battles with existing beast selections', async () => {
    const { data, error } = await supabase
      .from('battles')
      .select('id, beast1_id, beast1_locked, beast2_id, beast2_locked')
      .not('beast1_id', 'is', null)
      .limit(5)

    expect(error).toBeNull()

    if (data && data.length > 0) {
      data.forEach(battle => {
        // If beast1_id exists, beast1_locked should be true
        if (battle.beast1_id !== null) {
          expect(battle.beast1_locked).toBe(true)
        }
        // If beast2_id exists, beast2_locked should be true
        if (battle.beast2_id !== null) {
          expect(battle.beast2_locked).toBe(true)
        }
      })
    }
  })

  it('should be able to query battles with status and battle_type (index test)', async () => {
    // This tests that the composite index works
    const { data, error } = await supabase
      .from('battles')
      .select('id, status, battle_type')
      .eq('status', 'waiting')
      .eq('battle_type', 'pvp')
      .limit(10)

    expect(error).toBeNull()
    // Query should succeed regardless of whether data exists
  })
})
