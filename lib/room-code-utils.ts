/**
 * Room Code Utilities
 * Provides functions for generating and validating battle room codes
 */

// Character set for room codes (excluding ambiguous characters: 0, O, I, 1, l)
const ROOM_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ROOM_CODE_LENGTH = 6
const MAX_COLLISION_RETRIES = 5

/**
 * Generate a random 6-digit alphanumeric room code
 * Uses a character set that excludes ambiguous characters (0, O, I, 1, l)
 * 
 * @returns A 6-character room code string
 */
export function generateRoomCode(): string {
  let code = ''
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_CHARSET.length)
    code += ROOM_CODE_CHARSET[randomIndex]
  }
  return code
}

/**
 * Validate room code format
 * Checks if the code is exactly 6 characters and contains only valid characters
 * 
 * @param code - The room code to validate
 * @returns true if the code format is valid, false otherwise
 */
export function isValidRoomCodeFormat(code: string): boolean {
  if (!code || code.length !== ROOM_CODE_LENGTH) {
    return false
  }
  
  // Check if all characters are in the valid charset
  for (let i = 0; i < code.length; i++) {
    if (!ROOM_CODE_CHARSET.includes(code[i])) {
      return false
    }
  }
  
  return true
}

/**
 * Check if a room code already exists in the database
 * 
 * @param supabaseClient - The Supabase client instance
 * @param code - The room code to check
 * @returns true if the code exists, false otherwise
 */
export async function roomCodeExists(
  supabaseClient: any,
  code: string
): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('battles')
      .select('id')
      .eq('room_code', code)
      .single()

    // If no error and data exists, the code is taken
    if (data && !error) {
      return true
    }
    
    // If error is "PGRST116" (no rows returned), the code is available
    if (error && error.code === 'PGRST116') {
      return false
    }
    
    // For other errors, assume code might exist (safer to retry)
    return true
  } catch (error) {
    // On exception, assume code might exist (safer to retry)
    return true
  }
}

/**
 * Generate a unique room code with collision retry logic
 * Attempts to generate a code up to MAX_COLLISION_RETRIES times
 * 
 * @param supabaseClient - The Supabase client instance
 * @returns A unique room code, or null if all retries failed
 */
export async function generateUniqueRoomCode(
  supabaseClient: any
): Promise<string | null> {
  for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
    const code = generateRoomCode()
    const exists = await roomCodeExists(supabaseClient, code)
    
    if (!exists) {
      if (attempt > 0) {
        console.log(`Room code generated after ${attempt + 1} attempts`)
      }
      return code
    }
    
    // Log collision for monitoring (rare event)
    console.warn(`Room code collision detected on attempt ${attempt + 1}/${MAX_COLLISION_RETRIES}`)
  }
  
  // All retries failed (extremely rare with 32^6 = 1 billion combinations)
  console.error('Failed to generate unique room code after maximum retries')
  return null
}

/**
 * Cleanup stale battle rooms
 * Calls the database function to remove rooms older than 10 minutes
 * 
 * @param supabaseClient - The Supabase client instance
 * @returns The number of rooms deleted, or null if the operation failed
 */
export async function cleanupStaleRooms(
  supabaseClient: any
): Promise<number | null> {
  try {
    const { data, error } = await supabaseClient.rpc('cleanup_stale_battle_rooms')
    
    if (error) {
      console.error('Failed to cleanup stale rooms:', error)
      return null
    }
    
    return data as number
  } catch (error) {
    console.error('Exception during stale room cleanup:', error)
    return null
  }
}
