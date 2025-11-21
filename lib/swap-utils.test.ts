import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateRiseAmount, validateSwapAmount, formatTokenAmount, requestRiseTokens, RiseTransferError } from './swap-utils'

describe('calculateRiseAmount', () => {
  it('should calculate RISE amount correctly for 1 TON', () => {
    expect(calculateRiseAmount(1)).toBe(3000)
  })

  it('should calculate RISE amount correctly for 0.1 TON', () => {
    expect(calculateRiseAmount(0.1)).toBe(300)
  })

  it('should calculate RISE amount correctly for 10 TON', () => {
    expect(calculateRiseAmount(10)).toBe(30000)
  })

  it('should handle decimal TON amounts', () => {
    expect(calculateRiseAmount(2.5)).toBe(7500)
  })
})

describe('validateSwapAmount', () => {
  it('should return true for valid positive numbers', () => {
    expect(validateSwapAmount('1')).toBe(true)
    expect(validateSwapAmount('0.1')).toBe(true)
    expect(validateSwapAmount('100')).toBe(true)
    expect(validateSwapAmount('0.000001')).toBe(true)
  })

  it('should return false for zero', () => {
    expect(validateSwapAmount('0')).toBe(false)
  })

  it('should return false for negative numbers', () => {
    expect(validateSwapAmount('-1')).toBe(false)
    expect(validateSwapAmount('-0.5')).toBe(false)
  })

  it('should return false for non-numeric strings', () => {
    expect(validateSwapAmount('abc')).toBe(false)
    expect(validateSwapAmount('1.2.3')).toBe(false)
    expect(validateSwapAmount('1a')).toBe(false)
  })

  it('should return false for empty input', () => {
    expect(validateSwapAmount('')).toBe(false)
    expect(validateSwapAmount('   ')).toBe(false)
  })
})

describe('formatTokenAmount', () => {
  it('should format whole numbers with thousand separators', () => {
    expect(formatTokenAmount(1000, 2)).toBe('1,000')
    expect(formatTokenAmount(1000000, 2)).toBe('1,000,000')
  })

  it('should format decimals with specified precision', () => {
    expect(formatTokenAmount(1.23456, 2)).toBe('1.23')
    expect(formatTokenAmount(1.23456, 4)).toBe('1.2346')
  })

  it('should handle zero decimals', () => {
    expect(formatTokenAmount(1234.567, 0)).toBe('1,235')
  })

  it('should handle small decimal amounts', () => {
    expect(formatTokenAmount(0.000001, 9)).toBe('0.000001')
  })
})

describe('requestRiseTokens', () => {
  const mockWalletAddress = 'EQD1234567890abcdefghijklmnopqrstuvwxyz'
  const mockRiseAmount = 3000

  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should successfully request RISE tokens with valid response', async () => {
    const mockResponse = {
      success: true,
      message: 'Transfer successful',
      fromWallet: 'sender-wallet',
      toWallet: mockWalletAddress,
      jettonAmount: '3000000000000',
      seqno: 12345
    }

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    const result = await requestRiseTokens(mockWalletAddress, mockRiseAmount)

    expect(result).toEqual(mockResponse)
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://arenarise-backend.vercel.app/api/send/rise',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userWallet: mockWalletAddress,
          amount: mockRiseAmount,
        }),
      }
    )
  })

  it('should throw non-retryable error for 4xx responses', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Bad request'
    })

    await expect(requestRiseTokens(mockWalletAddress, mockRiseAmount))
      .rejects
      .toThrow(RiseTransferError)

    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('should retry on 5xx errors with exponential backoff', async () => {
    // Mock first two calls to fail with 500, third to succeed
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error'
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => 'Service unavailable'
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Transfer successful',
          fromWallet: 'sender-wallet',
          toWallet: mockWalletAddress,
          jettonAmount: '3000000000000',
          seqno: 12345
        })
      })

    const result = await requestRiseTokens(mockWalletAddress, mockRiseAmount)

    expect(result.success).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('should throw error after max retries on persistent 5xx errors', async () => {
    vi.useFakeTimers()
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal server error'
    })

    const promise = requestRiseTokens(mockWalletAddress, mockRiseAmount)
    
    // Fast-forward through all retry delays and wait for promise
    const result = Promise.race([
      promise.catch(e => e),
      vi.runAllTimersAsync().then(() => promise.catch(e => e))
    ])
    
    await vi.runAllTimersAsync()
    const error = await result

    expect(error).toBeInstanceOf(RiseTransferError)
    // Should try initial + 3 retries = 4 total attempts
    expect(global.fetch).toHaveBeenCalledTimes(4)
    
    vi.useRealTimers()
  })

  it('should retry on network errors', async () => {
    // Mock first call to throw network error, second to succeed
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Transfer successful',
          fromWallet: 'sender-wallet',
          toWallet: mockWalletAddress,
          jettonAmount: '3000000000000',
          seqno: 12345
        })
      })

    const result = await requestRiseTokens(mockWalletAddress, mockRiseAmount)

    expect(result.success).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('should throw error after max retries on persistent network errors', async () => {
    vi.useFakeTimers()
    
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const promise = requestRiseTokens(mockWalletAddress, mockRiseAmount)
    
    // Fast-forward through all retry delays and wait for promise
    const result = Promise.race([
      promise.catch(e => e),
      vi.runAllTimersAsync().then(() => promise.catch(e => e))
    ])
    
    await vi.runAllTimersAsync()
    const error = await result

    expect(error).toBeInstanceOf(RiseTransferError)
    // Should try initial + 3 retries = 4 total attempts
    expect(global.fetch).toHaveBeenCalledTimes(4)
    
    vi.useRealTimers()
  })

  it('should include correct data in API request', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Transfer successful',
        fromWallet: 'sender-wallet',
        toWallet: mockWalletAddress,
        jettonAmount: '3000000000000',
        seqno: 12345
      })
    })

    await requestRiseTokens(mockWalletAddress, mockRiseAmount)

    const fetchCall = (global.fetch as any).mock.calls[0]
    const requestBody = JSON.parse(fetchCall[1].body)

    expect(requestBody).toHaveProperty('userWallet', mockWalletAddress)
    expect(requestBody).toHaveProperty('amount', mockRiseAmount)
  })
})
