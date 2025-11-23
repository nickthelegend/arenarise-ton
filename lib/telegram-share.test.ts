import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { generateTelegramShareUrl, shareBattleToTelegram, extractRoomCodeFromUrl } from './telegram-share'

describe('Telegram Share Integration', () => {
  describe('generateTelegramShareUrl', () => {
    beforeEach(() => {
      // Mock window.location.origin
      Object.defineProperty(global, 'window', {
        value: {
          location: {
            origin: 'https://example.com'
          }
        },
        writable: true,
        configurable: true
      })
    })

    it('should generate a valid Telegram share URL with room code', () => {
      const roomCode = 'ABC123'
      const url = generateTelegramShareUrl(roomCode)
      
      expect(url).toContain('https://t.me/share/url')
      expect(url).toContain(encodeURIComponent('https://example.com/battle/pvp?join=ABC123'))
      expect(url).toContain(encodeURIComponent(roomCode))
    })

    it('should include the room code in the message text', () => {
      const roomCode = 'XYZ789'
      const url = generateTelegramShareUrl(roomCode)
      
      const decodedUrl = decodeURIComponent(url)
      expect(decodedUrl).toContain(roomCode)
      expect(decodedUrl).toContain('Room Code:')
    })

    it('should generate URL with battle ID when provided', () => {
      const roomCode = 'ABC123'
      const battleId = 'battle-uuid-123'
      const url = generateTelegramShareUrl(roomCode, battleId)
      
      expect(url).toContain('https://t.me/share/url')
      expect(url).toContain(encodeURIComponent('https://example.com/battle/pvp?join=ABC123'))
    })

    it('should properly encode special characters in URL', () => {
      const roomCode = 'ABC123'
      const url = generateTelegramShareUrl(roomCode)
      
      // URL should be properly encoded
      expect(url).not.toContain(' ')
      expect(url).not.toContain('\n')
      expect(url).toContain('%')
    })
  })

  describe('shareBattleToTelegram', () => {
    let windowOpenSpy: any

    beforeEach(() => {
      const mockWindow = {
        location: {
          origin: 'https://example.com'
        },
        open: vi.fn(() => null)
      }
      
      Object.defineProperty(global, 'window', {
        value: mockWindow,
        writable: true,
        configurable: true
      })
      
      windowOpenSpy = mockWindow.open
    })

    afterEach(() => {
      vi.clearAllMocks()
    })

    it('should open Telegram share URL in new window', () => {
      const roomCode = 'ABC123'
      shareBattleToTelegram(roomCode)
      
      expect(windowOpenSpy).toHaveBeenCalledTimes(1)
      const callArgs = windowOpenSpy.mock.calls[0]
      expect(callArgs[0]).toContain('https://t.me/share/url')
      expect(callArgs[1]).toBe('_blank')
      expect(callArgs[2]).toBe('noopener,noreferrer')
    })

    it('should include room code in the opened URL', () => {
      const roomCode = 'XYZ789'
      shareBattleToTelegram(roomCode)
      
      const callArgs = windowOpenSpy.mock.calls[0]
      expect(callArgs[0]).toContain(encodeURIComponent(roomCode))
    })
  })

  describe('extractRoomCodeFromUrl', () => {
    it('should extract valid 6-character room code from URL', () => {
      const searchParams = new URLSearchParams('join=ABC123')
      const roomCode = extractRoomCodeFromUrl(searchParams)
      
      expect(roomCode).toBe('ABC123')
    })

    it('should convert room code to uppercase', () => {
      const searchParams = new URLSearchParams('join=abc123')
      const roomCode = extractRoomCodeFromUrl(searchParams)
      
      expect(roomCode).toBe('ABC123')
    })

    it('should return null if join parameter is missing', () => {
      const searchParams = new URLSearchParams('')
      const roomCode = extractRoomCodeFromUrl(searchParams)
      
      expect(roomCode).toBeNull()
    })

    it('should return null if room code is not 6 characters', () => {
      const searchParams = new URLSearchParams('join=ABC12')
      const roomCode = extractRoomCodeFromUrl(searchParams)
      
      expect(roomCode).toBeNull()
    })

    it('should return null if room code is too long', () => {
      const searchParams = new URLSearchParams('join=ABC1234')
      const roomCode = extractRoomCodeFromUrl(searchParams)
      
      expect(roomCode).toBeNull()
    })

    it('should handle other URL parameters', () => {
      const searchParams = new URLSearchParams('beastId=5&join=ABC123&other=value')
      const roomCode = extractRoomCodeFromUrl(searchParams)
      
      expect(roomCode).toBe('ABC123')
    })
  })
})
