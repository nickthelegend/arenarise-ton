# API Error Codes Reference

This document provides a comprehensive reference for all error codes returned by the PVP Battle API endpoints.

## Error Response Format

All error responses follow this structure:

```json
{
  "error": "User-friendly error message",
  "code": "ERROR_CODE"
}
```

## Room Management Endpoints

### POST /api/battles/rooms (Create Room)

| Code | Status | Message | Cause |
|------|--------|---------|-------|
| `INVALID_REQUEST` | 400 | Invalid request. Please check your connection and try again. | Request body is malformed or empty |
| `MISSING_PLAYER_ID` | 400 | Player information is missing. Please reconnect your wallet and try again. | player_id not provided |
| `BEAST_NOT_FOUND` | 404 | The selected beast could not be found. Please refresh and try again. | beast_id provided but doesn't exist |
| `ROOM_CODE_GENERATION_FAILED` | 500 | Unable to create a room at this time. Please try again in a moment. | Failed to generate unique room code |
| `ROOM_CREATION_FAILED` | 500 | Failed to create battle room. Please check your connection and try again. | Database error during room creation |
| `INTERNAL_ERROR` | 500 | An unexpected error occurred. Please try again. | Unexpected server error |

### GET /api/battles/rooms (List Rooms)

| Code | Status | Message | Cause |
|------|--------|---------|-------|
| `ROOMS_FETCH_FAILED` | 500 | Failed to load available rooms. Please check your connection and try again. | Database error fetching rooms |
| `INTERNAL_ERROR` | 500 | An unexpected error occurred while loading rooms. Please try again. | Unexpected server error |

### POST /api/battles/rooms/join (Join Room)

| Code | Status | Message | Cause |
|------|--------|---------|-------|
| `INVALID_REQUEST` | 400 | Invalid request. Please check your connection and try again. | Request body is malformed or empty |
| `MISSING_REQUIRED_FIELDS` | 400 | Room code and player information are required. Please try again. | room_code or player_id missing |
| `INVALID_ROOM_CODE_FORMAT` | 400 | Invalid room code format. Please check the code and try again. | Room code doesn't match expected format |
| `BEAST_NOT_FOUND` | 404 | The selected beast could not be found. Please refresh and try again. | beast_id provided but doesn't exist |
| `ROOM_NOT_FOUND` | 404 | Room not found. Please check the code and try again. | Room with given code doesn't exist |
| `ROOM_NOT_AVAILABLE` | 400 | This room has already started. Browse available rooms or create a new one. | Room status is not 'waiting' |
| `CANNOT_JOIN_OWN_ROOM` | 400 | You cannot join your own battle room. Share the code with another player. | player_id matches room creator |
| `ROOM_ALREADY_FULL` | 409 | This room has already been joined by another player. Browse available rooms or create a new one. | Concurrent join attempt or room full |
| `JOIN_FAILED` | 500 | Failed to join room. Please check your connection and try again. | Database error during join |
| `INTERNAL_ERROR` | 500 | An unexpected error occurred. Please try again. | Unexpected server error |

### PATCH /api/battles/rooms/[battleId]/select-beast (Select Beast)

| Code | Status | Message | Cause |
|------|--------|---------|-------|
| `MISSING_REQUIRED_FIELDS` | 400 | Player and beast information are required. Please try again. | player_id or beast_id missing |
| `BATTLE_NOT_FOUND` | 404 | Battle room not found. It may have been cancelled or expired. | Battle doesn't exist |
| `PLAYER_NOT_IN_BATTLE` | 403 | You are not part of this battle. Please join a room first. | player_id not in battle |
| `BATTLE_COMPLETED` | 400 | This battle has already ended. You cannot change your beast selection. | Battle status is 'completed' |
| `BEAST_ALREADY_LOCKED` | 400 | Your beast selection is already locked. You cannot change it now. | Beast already locked for player |
| `BEAST_NOT_FOUND` | 404 | The selected beast could not be found. Please refresh and try again. | beast_id doesn't exist |
| `PLAYER_NOT_FOUND` | 404 | Player information not found. Please reconnect your wallet. | player_id doesn't exist |
| `BEAST_NOT_OWNED` | 403 | This beast does not belong to you. Please select one of your own beasts. | Beast ownership validation failed |
| `UPDATE_FAILED` | 500 | Failed to select beast. Please check your connection and try again. | Database error during update |
| `INTERNAL_ERROR` | 500 | An unexpected error occurred. Please try again. | Unexpected server error |

## Battle Completion Endpoints

### POST /api/battles/[id]/complete (Complete Battle)

| Code | Status | Message | Cause |
|------|--------|---------|-------|
| `MISSING_REQUIRED_FIELDS` | 400 | Battle completion data is incomplete. Please try again. | winner, final_player_hp, or final_enemy_hp missing |
| `INVALID_WINNER_VALUE` | 400 | Invalid battle result. Please refresh and try again. | winner is not 'player' or 'enemy' |
| `BATTLE_NOT_FOUND` | 404 | Battle not found. It may have been cancelled or expired. | Battle doesn't exist |
| `PLAYER_NOT_IN_BATTLE` | 403 | You are not a participant in this battle. | player_id not in battle |
| `BATTLE_ALREADY_COMPLETED` | 400 | This battle has already ended. Results have been recorded. | Battle status is 'completed' |
| `INVALID_BATTLE_RESULT` | 400 | Battle result is invalid. Please refresh and try again. | Winner doesn't match HP values |
| `BATTLE_UPDATE_FAILED` | 500 | Failed to save battle results. Please check your connection and try again. | Database error during update |
| `INTERNAL_ERROR` | 500 | An unexpected error occurred while completing the battle. Please try again. | Unexpected server error |

## Stake Management Endpoints

### GET /api/battles/stake (Get Stake Transaction)

| Code | Status | Message | Cause |
|------|--------|---------|-------|
| `MISSING_TRANSACTION_HASH` | 400 | Transaction hash is required to look up stake information. | transaction_hash query param missing |
| `TRANSACTION_NOT_FOUND` | 404 | Stake transaction not found. Please check the transaction hash and try again. | Transaction doesn't exist |
| `INTERNAL_ERROR` | 500 | An unexpected error occurred while looking up the transaction. Please try again. | Unexpected server error |

### POST /api/battles/stake (Record Stake)

| Code | Status | Message | Cause |
|------|--------|---------|-------|
| `MISSING_BATTLE_ID` | 400 | Battle information is missing. Please try again. | battle_id not provided |
| `MISSING_PLAYER_ID` | 400 | Player information is missing. Please reconnect your wallet and try again. | player_id not provided |
| `MISSING_AMOUNT` | 400 | Stake amount is required. Please specify how much to stake. | amount not provided |
| `INVALID_AMOUNT` | 400 | Stake amount must be a positive number. Please enter a valid amount. | amount is not a positive number |
| `MISSING_TRANSACTION_HASH` | 400 | Transaction hash is required to record the stake. | transaction_hash not provided |
| `BATTLE_NOT_FOUND` | 404 | Battle not found. It may have been cancelled or expired. | Battle doesn't exist |
| `PLAYER_NOT_IN_BATTLE` | 403 | You are not a participant in this battle. You can only stake in battles you joined. | player_id not in battle |
| `DUPLICATE_TRANSACTION` | 409 | This transaction has already been recorded. Your stake is already registered. | transaction_hash already exists |
| `STAKE_RECORD_FAILED` | 500 | Failed to record stake transaction. Please check your connection and try again. | Database error during insert |
| `INTERNAL_ERROR` | 500 | An unexpected error occurred while recording your stake. Please try again. | Unexpected server error |

## Error Handling Best Practices

### Client-Side

1. **Always check for error codes**: Use the `code` field to handle specific error scenarios
2. **Display user-friendly messages**: Show the `error` message directly to users
3. **Implement retry logic**: For `INTERNAL_ERROR` and network-related errors
4. **Validate before API calls**: Check room codes, beast ownership, etc. client-side first

### Example Error Handling

```typescript
try {
  const response = await fetch('/api/battles/rooms/join', {
    method: 'POST',
    body: JSON.stringify({ room_code, player_id })
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    switch (data.code) {
      case 'ROOM_NOT_FOUND':
        // Show "room not found" UI
        break
      case 'ROOM_ALREADY_FULL':
        // Refresh room list
        break
      case 'CANNOT_JOIN_OWN_ROOM':
        // Show specific warning
        break
      default:
        // Show generic error
        toast.error(data.error)
    }
  }
} catch (error) {
  // Handle network errors
  toast.error('Connection error. Please check your internet.')
}
```

## Requirements Validation

This error handling implementation validates:

- **Requirement 8.3**: Invalid room code error messages are clear and actionable
- **Requirement 8.4**: Full or completed battle errors provide specific guidance
- All error messages are user-friendly and guide users toward resolution
- Error codes enable programmatic error handling on the client side
