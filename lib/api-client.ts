/**
 * API Client with timeout and error handling
 * Provides consistent API request handling across the application
 */

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  timeout?: number
  headers?: Record<string, string>
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  status: number
}

const DEFAULT_TIMEOUT = 30000 // 30 seconds

/**
 * Make an API request with timeout and error handling
 */
export async function apiRequest<T = any>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    timeout = DEFAULT_TIMEOUT,
    headers = {}
  } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
        status: response.status
      }
    }

    return {
      success: true,
      data,
      status: response.status
    }
  } catch (error: any) {
    clearTimeout(timeoutId)

    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timed out. Please try again.',
        status: 408
      }
    }

    if (error.message?.includes('fetch')) {
      return {
        success: false,
        error: 'Network error. Please check your connection.',
        status: 0
      }
    }

    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      status: 500
    }
  }
}

/**
 * Retry an API request with exponential backoff
 */
export async function apiRequestWithRetry<T = any>(
  url: string,
  options: ApiRequestOptions = {},
  maxRetries: number = 3
): Promise<ApiResponse<T>> {
  let lastError: ApiResponse<T> | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await apiRequest<T>(url, options)

    if (response.success) {
      return response
    }

    lastError = response

    // Don't retry on client errors (4xx) except timeout
    if (response.status >= 400 && response.status < 500 && response.status !== 408) {
      break
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries - 1) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  return lastError || {
    success: false,
    error: 'Request failed after multiple attempts',
    status: 500
  }
}
