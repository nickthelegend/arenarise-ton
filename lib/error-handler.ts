/**
 * Centralized error handling utilities for the PVP battle system
 * Provides consistent error messages and handling across the application
 */

export type ErrorCode =
  | 'ROOM_CODE_COLLISION'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_ALREADY_STARTED'
  | 'INVALID_ROOM_CODE'
  | 'BEAST_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'CONNECTION_FAILED'
  | 'TIMEOUT'
  | 'CONCURRENT_JOIN'
  | 'SELF_JOIN'
  | 'UNKNOWN_ERROR'

export interface AppError {
  code: ErrorCode
  message: string
  userMessage: string
  retryable: boolean
}

/**
 * Error messages for different error codes
 */
const ERROR_MESSAGES: Record<ErrorCode, { message: string; userMessage: string; retryable: boolean }> = {
  ROOM_CODE_COLLISION: {
    message: 'Generated room code already exists',
    userMessage: 'Failed to create room. Please try again.',
    retryable: true
  },
  ROOM_NOT_FOUND: {
    message: 'Room not found',
    userMessage: 'Room not found. Please check the code and try again.',
    retryable: false
  },
  ROOM_ALREADY_STARTED: {
    message: 'Room has already started',
    userMessage: 'This room has already started or is no longer available.',
    retryable: false
  },
  INVALID_ROOM_CODE: {
    message: 'Invalid room code format',
    userMessage: 'Invalid room code format. Code must be 6 alphanumeric characters.',
    retryable: false
  },
  BEAST_NOT_FOUND: {
    message: 'Beast not found',
    userMessage: 'Beast not found. Please select a valid beast.',
    retryable: false
  },
  UNAUTHORIZED: {
    message: 'Unauthorized action',
    userMessage: 'You are not authorized to perform this action.',
    retryable: false
  },
  CONNECTION_FAILED: {
    message: 'Connection to server failed',
    userMessage: 'Connection failed. Please check your internet connection.',
    retryable: true
  },
  TIMEOUT: {
    message: 'Request timed out',
    userMessage: 'Request timed out. Please try again.',
    retryable: true
  },
  CONCURRENT_JOIN: {
    message: 'Room was joined by another player',
    userMessage: 'This room has already been joined by another player.',
    retryable: false
  },
  SELF_JOIN: {
    message: 'Cannot join own room',
    userMessage: 'You cannot join your own battle room.',
    retryable: false
  },
  UNKNOWN_ERROR: {
    message: 'An unknown error occurred',
    userMessage: 'An unexpected error occurred. Please try again.',
    retryable: true
  }
}

/**
 * Create an AppError from an error code
 */
export function createError(code: ErrorCode, customMessage?: string): AppError {
  const errorInfo = ERROR_MESSAGES[code]
  return {
    code,
    message: customMessage || errorInfo.message,
    userMessage: errorInfo.userMessage,
    retryable: errorInfo.retryable
  }
}

/**
 * Parse an error from an API response or exception
 */
export function parseError(error: any): AppError {
  // Handle API error responses
  if (error.response?.data?.error) {
    const errorMessage = error.response.data.error.toLowerCase()
    
    if (errorMessage.includes('room not found') || errorMessage.includes('not found')) {
      return createError('ROOM_NOT_FOUND')
    }
    if (errorMessage.includes('already started') || errorMessage.includes('no longer available')) {
      return createError('ROOM_ALREADY_STARTED')
    }
    if (errorMessage.includes('invalid') && errorMessage.includes('code')) {
      return createError('INVALID_ROOM_CODE')
    }
    if (errorMessage.includes('beast not found')) {
      return createError('BEAST_NOT_FOUND')
    }
    if (errorMessage.includes('already been joined')) {
      return createError('CONCURRENT_JOIN')
    }
    if (errorMessage.includes('cannot join your own')) {
      return createError('SELF_JOIN')
    }
    if (errorMessage.includes('unauthorized')) {
      return createError('UNAUTHORIZED')
    }
  }
  
  // Handle network errors
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return createError('CONNECTION_FAILED')
  }
  
  // Handle timeout errors
  if (error.message?.includes('timeout')) {
    return createError('TIMEOUT')
  }
  
  // Handle string errors from API
  if (typeof error === 'string') {
    const errorLower = error.toLowerCase()
    
    if (errorLower.includes('room not found') || errorLower.includes('not found')) {
      return createError('ROOM_NOT_FOUND')
    }
    if (errorLower.includes('already started') || errorLower.includes('no longer available')) {
      return createError('ROOM_ALREADY_STARTED')
    }
    if (errorLower.includes('invalid') && errorLower.includes('code')) {
      return createError('INVALID_ROOM_CODE')
    }
    if (errorLower.includes('beast not found')) {
      return createError('BEAST_NOT_FOUND')
    }
    if (errorLower.includes('already been joined')) {
      return createError('CONCURRENT_JOIN')
    }
    if (errorLower.includes('cannot join your own')) {
      return createError('SELF_JOIN')
    }
  }
  
  // Default to unknown error
  return createError('UNKNOWN_ERROR', error.message || 'An unexpected error occurred')
}

/**
 * Format error for display to user
 */
export function formatErrorMessage(error: AppError): string {
  return error.userMessage
}

/**
 * Check if an error is retryable
 */
export function isRetryable(error: AppError): boolean {
  return error.retryable
}
