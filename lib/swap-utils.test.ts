import { describe, it, expect } from 'vitest'
import { calculateRiseAmount, validateSwapAmount, formatTokenAmount } from './swap-utils'

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
