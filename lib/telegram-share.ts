/**
 * Telegram Share Integration for Battle Rooms
 * Generates shareable URLs and handles deep linking
 */

/**
 * Generates a Telegram share URL for a battle room
 * @param roomCode - The 6-digit room code
 * @param battleId - The battle ID (optional, for tracking)
 * @returns Telegram share URL
 */
export function generateTelegramShareUrl(roomCode: string, battleId?: string): string {
  // Get the current origin or use a default
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  
  // Create the join URL with the room code as a parameter
  const joinUrl = `${origin}/battle/pvp?join=${roomCode}`
  
  // Create the message text
  const message = `🎮 Join my Beast Battle!\n\nRoom Code: ${roomCode}\n\nClick the link to join:`
  
  // Encode the URL and message for Telegram
  const encodedUrl = encodeURIComponent(joinUrl)
  const encodedMessage = encodeURIComponent(message)
  
  // Return the Telegram share URL
  return `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`
}

/**
 * Opens Telegram share dialog
 * @param roomCode - The 6-digit room code
 * @param battleId - The battle ID (optional)
 */
export function shareBattleToTelegram(roomCode: string, battleId?: string): void {
  const telegramUrl = generateTelegramShareUrl(roomCode, battleId)
  
  // Open in new window/tab
  if (typeof window !== 'undefined') {
    window.open(telegramUrl, '_blank', 'noopener,noreferrer')
  }
}

/**
 * Extracts room code from URL parameters
 * @param searchParams - URL search parameters
 * @returns Room code if present, null otherwise
 */
export function extractRoomCodeFromUrl(searchParams: URLSearchParams): string | null {
  const joinCode = searchParams.get('join')
  
  if (joinCode && joinCode.length === 6) {
    return joinCode.toUpperCase()
  }
  
  return null
}
