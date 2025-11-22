import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchRiseBalance, formatRiseBalance } from './jetton-utils'

// Mock fetch globally
global.fetch = vi.fn()

describe('jetton-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchRiseBalance', () => {
    it('should fetch and convert RISE balance correctly', async () => {
      const mockResponse = {
        jetton_wallets: [
          {
            address: '0:EDD5CBA0C016E87AFDC09E86E93103A6B8E2C68F4E5EE3FE4D6D448C7EAD6C79',
            balance: '1000000000000', // 1000 RISE tokens (with 9 decimals)
            owner: '0:FBEEBF4752EED55DDCFE97FA60CDF0E025674728D824E39A336B8419ED9D42CA',
            jetton: '0:8068CF838DD139953F5A19054C73353957ED15EB525F644D6C61E7CEBB6D5B04',
            last_transaction_lt: '41522464000003'
          }
        ],
        address_book: {}
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const balance = await fetchRiseBalance('0QD77r9HUu7VXdz-l_pgzfDgJWdHKNgk45oza4QZ7Z1CyqUX')

      expect(balance).toBe(1000)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://testnet.toncenter.com/api/v3/jetton/wallets'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-API-Key': expect.any(String)
          })
        })
      )
    })

    it('should return 0 if no jetton wallets found', async () => {
      const mockResponse = {
        jetton_wallets: [],
        address_book: {}
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const balance = await fetchRiseBalance('0QD77r9HUu7VXdz-l_pgzfDgJWdHKNgk45oza4QZ7Z1CyqUX')

      expect(balance).toBe(0)
    })

    it('should return 0 on API error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      const balance = await fetchRiseBalance('0QD77r9HUu7VXdz-l_pgzfDgJWdHKNgk45oza4QZ7Z1CyqUX')

      expect(balance).toBe(0)
    })

    it('should return 0 on network error', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

      const balance = await fetchRiseBalance('0QD77r9HUu7VXdz-l_pgzfDgJWdHKNgk45oza4QZ7Z1CyqUX')

      expect(balance).toBe(0)
    })

    it('should handle zero balance correctly', async () => {
      const mockResponse = {
        jetton_wallets: [
          {
            address: '0:EDD5CBA0C016E87AFDC09E86E93103A6B8E2C68F4E5EE3FE4D6D448C7EAD6C79',
            balance: '0',
            owner: '0:FBEEBF4752EED55DDCFE97FA60CDF0E025674728D824E39A336B8419ED9D42CA',
            jetton: '0:8068CF838DD139953F5A19054C73353957ED15EB525F644D6C61E7CEBB6D5B04',
            last_transaction_lt: '41522464000003'
          }
        ],
        address_book: {}
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const balance = await fetchRiseBalance('0QD77r9HUu7VXdz-l_pgzfDgJWdHKNgk45oza4QZ7Z1CyqUX')

      expect(balance).toBe(0)
    })
  })

  describe('formatRiseBalance', () => {
    it('should format balance with default 2 decimals', () => {
      expect(formatRiseBalance(1250.5)).toBe('1,250.5')
      expect(formatRiseBalance(1000000)).toBe('1,000,000')
      expect(formatRiseBalance(0)).toBe('0')
    })

    it('should format balance with custom decimals', () => {
      expect(formatRiseBalance(1250.5678, 4)).toBe('1,250.5678')
      expect(formatRiseBalance(1250.5678, 0)).toBe('1,251')
      expect(formatRiseBalance(1250.5678, 1)).toBe('1,250.6')
    })

    it('should handle large numbers', () => {
      expect(formatRiseBalance(1000000000, 2)).toBe('1,000,000,000')
    })

    it('should handle small numbers', () => {
      expect(formatRiseBalance(0.001, 3)).toBe('0.001')
      expect(formatRiseBalance(0.000001, 6)).toBe('0.000001')
    })
  })
})
