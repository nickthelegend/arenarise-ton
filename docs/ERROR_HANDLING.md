# Error Handling and Edge Cases Documentation

This document describes the comprehensive error handling system implemented for the real-time PVP battles feature.

## Overview

The error handling system provides:
- **Room code collision retry logic** with exponential backoff
- **Connection status indicators** for real-time subscriptions
- **Automatic reconnection** for dropped connections
- **Concurrent join attempt handling** with database-level locking
- **Clear error messages** for all failure scenarios

## Components

### 1. Room Code Generation (`lib/room-code-utils.ts`)

**Collision Retry Logic:**
- Attempts to generate unique room codes up to 5 times
- Uses a character set of 32 characters (excluding ambiguous ones)
- Provides 1 billion possible combinations (32^6)
- Logs collisions for monitoring
- Returns `null` if all retries fail (extremely rare)

**Error Scenarios:**
- Room code collision: Automatically retries with new code
- Database errors during existence check: Safely assumes code exists and retries
- Maximum retries exceeded: Returns null and logs error

### 2. Real-time Connection Manager (`lib/realtime-manager.ts`)

**Automatic Reconnection:**
- Implements exponential backoff: 3s, 6s, 12s, 24s, 30s (max)
- Maximum 10 reconnection attempts
- Tracks connection status: `connected`, `disconnected`, `reconnecting`
- Provides status callbacks for UI updates
- Logs reconnection attempts and duration

**Connection Status Handling:**
- `SUBSCRIBED`: Connection established
- `CLOSED` or `CHANNEL_ERROR`: Connection lost, trigger reconnection
- `TIMED_OUT`: Connection timeout, trigger reconnection

**Error Scenarios:**
- Connection drops: Automatically attempts reconnection
- Max retries exceeded: Displays error and suggests page refresh
- Successful reconnection: Resets retry counter and logs duration

### 3. API Error Handling

#### Room Creation (`app/api/battles/rooms/route.ts`)

**Error Scenarios:**
- Invalid request body: 400 Bad Request
- Missing required fields: 400 Bad Request
- Beast not found: 404 Not Found
- Room code generation failure: 500 Internal Server Error
- Database errors: 500 Internal Server Error

**Logging:**
- Logs all errors with context
- Tracks room code generation attempts
- Monitors database operation failures

#### Room Join (`app/api/battles/rooms/join/route.ts`)

**Concurrent Join Handling:**
- Uses database-level locking with WHERE clause
- Only updates if status is still 'waiting'
- Returns 409 Conflict if room already joined
- Prevents race conditions between multiple players

**Error Scenarios:**
- Invalid request body: 400 Bad Request
- Missing required fields: 400 Bad Request
- Invalid room code format: 400 Bad Request (client-side validation)
- Beast not found: 404 Not Found
- Room not found: 404 Not Found
- Room already started: 400 Bad Request
- Self-join attempt: 400 Bad Request
- Concurrent join: 409 Conflict
- Database errors: 500 Internal Server Error

**Turn Determination:**
- Higher speed goes first
- Player1 goes first on speed tie
- Calculated before room join to ensure consistency

#### Room Cancellation (`app/api/battles/rooms/[battleId]/route.ts`)

**Error Scenarios:**
- Missing battle ID: 400 Bad Request
- Battle not found: 404 Not Found
- Battle not in waiting state: 400 Bad Request
- Concurrent cancellation/join: 409 Conflict
- Database errors: 500 Internal Server Error

**Race Condition Handling:**
- Checks status before deletion
- Uses status filter in DELETE query
- Returns 409 if room state changed during operation

### 4. Error Display Components

#### ErrorDisplay (`components/error-display.tsx`)

**Features:**
- Consistent error message display
- Optional retry button for retryable errors
- Dismiss functionality
- Animated slide-in effect

**Usage:**
```tsx
<ErrorDisplay
  error={errorMessage}
  onRetry={handleRetry}
  onDismiss={() => setError(null)}
  retryable={true}
/>
```

#### ConnectionStatus (`components/error-display.tsx`)

**Features:**
- Visual connection status indicator
- Color-coded states (green/yellow/red)
- Animated spinner for reconnecting state

**Usage:**
```tsx
<ConnectionStatus status={connectionStatus} />
```

#### ErrorBoundary (`components/error-boundary.tsx`)

**Features:**
- Catches React component errors
- Prevents app crashes
- Displays fallback UI
- Provides retry and home navigation
- Shows stack trace in development mode

**Usage:**
```tsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 5. API Client (`lib/api-client.ts`)

**Features:**
- Request timeout handling (default 30s)
- Automatic retry with exponential backoff
- Network error detection
- Consistent error response format

**Usage:**
```typescript
// Simple request
const response = await apiRequest('/api/battles/rooms', {
  method: 'POST',
  body: { player_id, beast_id }
})

// Request with retry
const response = await apiRequestWithRetry('/api/battles/rooms', {
  method: 'POST',
  body: { player_id, beast_id }
}, 3) // max 3 retries
```

### 6. Error Handler Utility (`lib/error-handler.ts`)

**Features:**
- Centralized error code definitions
- User-friendly error messages
- Error parsing from API responses
- Retryable error detection

**Error Codes:**
- `ROOM_CODE_COLLISION`: Room code generation collision (retryable)
- `ROOM_NOT_FOUND`: Room doesn't exist
- `ROOM_ALREADY_STARTED`: Room no longer available
- `INVALID_ROOM_CODE`: Invalid code format
- `BEAST_NOT_FOUND`: Beast doesn't exist
- `UNAUTHORIZED`: Unauthorized action
- `CONNECTION_FAILED`: Network error (retryable)
- `TIMEOUT`: Request timeout (retryable)
- `CONCURRENT_JOIN`: Room joined by another player
- `SELF_JOIN`: Cannot join own room
- `UNKNOWN_ERROR`: Unexpected error (retryable)

**Usage:**
```typescript
import { parseError, formatErrorMessage, isRetryable } from '@/lib/error-handler'

try {
  // API call
} catch (error) {
  const appError = parseError(error)
  setErrorMessage(formatErrorMessage(appError))
  setCanRetry(isRetryable(appError))
}
```

## Testing

### Unit Tests

**Room Code Utils:**
- ✓ Code generation format validation
- ✓ Character set validation
- ✓ Uniqueness validation
- ✓ Collision retry logic
- ✓ Maximum retry handling
- ✓ Stale room cleanup

**Realtime Manager:**
- ✓ Battle subscription creation
- ✓ Room subscription creation
- ✓ Event callback handling
- ✓ Connection status changes
- ✓ Reconnection logic
- ✓ Exponential backoff
- ✓ Maximum retry handling
- ✓ Cleanup functionality

### Integration Tests

**Recommended Manual Tests:**
1. Create room with network disconnected → Should show error
2. Join room that doesn't exist → Should show "Room not found"
3. Join room with invalid code → Should show "Invalid format"
4. Two players join same room simultaneously → One succeeds, one gets conflict
5. Cancel room while someone is joining → Proper conflict handling
6. Disconnect during battle → Should show reconnecting status
7. Reconnect after disconnect → Should resume battle state
8. Max reconnection attempts → Should show disconnected status

## Best Practices

### For Developers

1. **Always use error boundaries** around major components
2. **Provide retry functionality** for retryable errors
3. **Show connection status** in real-time features
4. **Log errors with context** for debugging
5. **Use consistent error messages** via error-handler utility
6. **Handle edge cases** like concurrent operations
7. **Test error scenarios** thoroughly

### For API Routes

1. **Validate input** before processing
2. **Use database-level locking** for concurrent operations
3. **Return appropriate HTTP status codes**
4. **Provide clear error messages**
5. **Log errors with context**
6. **Handle timeouts gracefully**

### For UI Components

1. **Display connection status** for real-time features
2. **Show loading states** during operations
3. **Provide retry buttons** for retryable errors
4. **Use error boundaries** to prevent crashes
5. **Clear errors** after successful operations
6. **Animate error displays** for better UX

## Monitoring

### Key Metrics to Track

1. **Room code collision rate** - Should be extremely rare
2. **Reconnection success rate** - Should be high
3. **Average reconnection time** - Should be low
4. **Concurrent join conflicts** - Monitor frequency
5. **API error rates** - Track by endpoint and error type
6. **Connection drop frequency** - Monitor network issues

### Logging

All error scenarios are logged with:
- Error type and message
- Context (user ID, battle ID, etc.)
- Timestamp
- Stack trace (in development)

## Future Improvements

1. **Error analytics** - Track error patterns and frequencies
2. **User feedback** - Allow users to report issues
3. **Automatic error recovery** - More intelligent retry strategies
4. **Circuit breaker pattern** - Prevent cascading failures
5. **Rate limiting** - Prevent abuse and overload
6. **Health checks** - Monitor system health proactively
