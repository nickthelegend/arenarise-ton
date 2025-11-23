# Design Document

## Overview

This design implements a real-time multiplayer PVP battle system that replaces the current mock matchmaking with genuine player-to-player combat. The system uses Supabase real-time subscriptions for instant battle state synchronization, generates unique 6-digit room codes for battle identification, and integrates with Telegram for social sharing.

The architecture follows a room-based model where one player creates a "battle room" and waits for another player to join. Once both players are present, the battle transitions to the active arena where moves are synchronized in real-time between both clients.

## Architecture

### System Components

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   PVP Page      │────────▶│  Room Management │────────▶│   Battle Arena  │
│  (Selection)    │         │     System       │         │   (Real-time)   │
└─────────────────┘         └──────────────────┘         └─────────────────┘
        │                            │                            │
        │                            │                            │
        ▼                            ▼                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Supabase Real-time Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │   battles    │  │ battle_moves │  │    users     │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
        │                            │                            │
        │                            │                            │
        ▼                            ▼                            ▼
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Room Code Gen  │         │  Real-time Sync  │         │  Telegram API   │
│   (6-digit)     │         │   (WebSocket)    │         │   (Sharing)     │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

### Data Flow

1. **Room Creation Flow**
   - Player selects beast → Creates room → System generates 6-digit code
   - Battle record created with status='waiting', player2_id=null
   - Host subscribes to real-time updates on battle record

2. **Room Joining Flow**
   - Player enters code → System validates → Updates battle with player2_id
   - Battle status changes to 'in_progress'
   - Both players receive real-time notification → Navigate to arena

3. **Battle Execution Flow**
   - Players subscribe to battle_moves table for their battle_id
   - Active player selects move → API records move → Real-time broadcast
   - Both clients update HP and UI → Check for battle completion
   - Winner determined → Battle status='completed', winner_id set

## Components and Interfaces

### 1. Room Code Generator

**Purpose**: Generate unique, user-friendly 6-digit codes for battle rooms

**Interface**:
```typescript
function generateRoomCode(): string
```

**Implementation Strategy**:
- Use alphanumeric characters (excluding ambiguous: 0, O, I, 1, l)
- Character set: ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (32 chars)
- Generate 6 random characters from set
- Check for uniqueness against active battles
- Retry if collision detected (rare with 32^6 = 1 billion combinations)

### 2. Battle Room API Endpoints

#### POST /api/battles/rooms
Create a new battle room

**Request**:
```typescript
{
  player_id: string
  beast_id: number
}
```

**Response**:
```typescript
{
  battle: {
    id: string
    room_code: string
    player1_id: string
    beast1_id: number
    status: 'waiting'
    created_at: string
  }
}
```

#### GET /api/battles/rooms
List all available battle rooms

**Query Parameters**: None

**Response**:
```typescript
{
  rooms: Array<{
    id: string
    room_code: string
    player1_id: string
    beast1: {
      id: number
      name: string
      level: number
      hp: number
      attack: number
      defense: number
      traits: any
    }
    created_at: string
  }>
}
```

#### POST /api/battles/rooms/join
Join a battle room by code

**Request**:
```typescript
{
  room_code: string
  player_id: string
  beast_id: number
}
```

**Response**:
```typescript
{
  success: boolean
  battle_id: string
  error?: string
}
```

#### DELETE /api/battles/rooms/:battleId
Cancel a waiting battle room

**Response**:
```typescript
{
  success: boolean
}
```

### 3. PVP Page Component

**Location**: `/app/battle/pvp/page.tsx`

**State Management**:
```typescript
interface PVPPageState {
  userId: string | null
  myBeasts: Beast[]
  selectedBeast: Beast | null
  view: 'select' | 'waiting' | 'browse' | 'join'
  createdRoom: Battle | null
  availableRooms: Battle[]
  roomCodeInput: string
}
```

**Views**:
1. **Select View**: Choose beast and action (Create Room / Browse Rooms / Join by Code)
2. **Waiting View**: Display room code, share button, cancel option
3. **Browse View**: List of available rooms with join buttons
4. **Join View**: Input field for 6-digit code

### 4. Rooms List Page Component

**Location**: `/app/battle/pvp/rooms/page.tsx`

**Features**:
- Real-time subscription to battles table where status='waiting'
- Display room cards with host beast information
- Join button for each room
- Auto-refresh when rooms are created/removed
- Empty state when no rooms available

### 5. Real-time Subscription Manager

**Purpose**: Manage WebSocket connections for battle state synchronization

**Interface**:
```typescript
interface RealtimeManager {
  subscribeToBattle(battleId: string, callbacks: BattleCallbacks): () => void
  subscribeToRooms(callback: (rooms: Battle[]) => void): () => void
}

interface BattleCallbacks {
  onBattleUpdate: (battle: Battle) => void
  onMoveReceived: (move: BattleMove) => void
  onPlayerJoined: (player2: User, beast2: Beast) => void
}
```

**Implementation**:
```typescript
// Subscribe to specific battle
const channel = supabase
  .channel(`battle_${battleId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'battles',
    filter: `id=eq.${battleId}`
  }, handleBattleUpdate)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'battle_moves',
    filter: `battle_id=eq.${battleId}`
  }, handleMoveInsert)
  .subscribe()

// Subscribe to all waiting rooms
const roomsChannel = supabase
  .channel('battle_rooms')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'battles',
    filter: 'status=eq.waiting'
  }, handleRoomsUpdate)
  .subscribe()
```

### 6. Telegram Share Integration

**Purpose**: Enable sharing battle room codes via Telegram

**Interface**:
```typescript
function shareBattleToTelegram(roomCode: string, battleId: string): void
```

**Implementation**:
```typescript
const message = `Join my battle! Room Code: ${roomCode}`
const url = `${window.location.origin}/battle/pvp?join=${roomCode}`
const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`
window.open(telegramUrl, '_blank')
```

**Deep Link Handling**:
- URL format: `/battle/pvp?join=ABC123`
- On page load, check for `join` query parameter
- If present, auto-populate join code input and show join view

## Data Models

### Extended Battle Model

Add `room_code` field to existing battles table:

```sql
ALTER TABLE battles 
  ADD COLUMN room_code VARCHAR(6) UNIQUE;

CREATE INDEX idx_battles_room_code ON battles(room_code);
```

**Battle Record States**:
- `status='waiting'`: Room created, waiting for player2
- `status='in_progress'`: Both players joined, battle active
- `status='completed'`: Battle finished, winner determined

**Constraints**:
- `room_code` must be unique across all active battles
- `room_code` only set when status='waiting' or 'in_progress'
- `player2_id` is NULL when status='waiting'
- `player2_id` must be set when status='in_progress'

### Room Cleanup

**Stale Room Handling**:
- Rooms older than 10 minutes with status='waiting' should be auto-deleted
- Implement via database function or periodic cleanup job

```sql
-- Cleanup function (called periodically)
DELETE FROM battles 
WHERE status = 'waiting' 
  AND created_at < NOW() - INTERVAL '10 minutes';
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Room code uniqueness
*For any* two simultaneously created battle rooms, the generated room codes should be different
**Validates: Requirements 1.1**

### Property 2: Room creation persistence
*For any* valid player and beast combination, creating a room should result in a database record with status='waiting' and the correct player1_id and beast1_id
**Validates: Requirements 1.2**

### Property 3: Room cancellation cleanup
*For any* waiting battle room, canceling it should remove the record from the database
**Validates: Requirements 1.5**

### Property 4: Rooms list accuracy
*For any* point in time, the displayed rooms list should contain exactly the battles with status='waiting' from the database
**Validates: Requirements 2.1**

### Property 5: Room code format validation
*For any* input string, the validation function should return true only if the string is exactly 6 characters long and contains only valid alphanumeric characters
**Validates: Requirements 3.1**

### Property 6: Join updates battle state
*For any* valid room join operation, the battle record should be updated with player2_id set and status changed to 'in_progress'
**Validates: Requirements 3.3**

### Property 7: Invalid join rejection
*For any* non-existent room code or in-progress battle code, attempting to join should result in an error response
**Validates: Requirements 3.5, 3.6**

### Property 8: Telegram share URL format
*For any* room code, the generated Telegram share URL should contain both the room code and a valid join link
**Validates: Requirements 4.3**

### Property 9: Real-time move synchronization
*For any* move made by a player, both players should receive the move update via real-time subscription within 2 seconds
**Validates: Requirements 7.2**

### Property 10: HP reduction consistency
*For any* move execution, the target beast's HP should be reduced by the calculated damage amount, with a minimum HP of 0
**Validates: Requirements 7.4**

### Property 11: Battle completion on zero HP
*For any* battle where a beast's HP reaches zero, the battle status should be updated to 'completed' and the winner_id should be set to the owner of the beast with remaining HP
**Validates: Requirements 8.1, 8.2**

### Property 12: Turn determination by speed
*For any* two beasts starting a battle, the beast with higher speed stat should have the first turn, and if speeds are equal, player1 should go first
**Validates: Requirements 6.2**

### Property 13: Initial HP equals max HP
*For any* battle start, both beasts should have their current HP equal to their max_hp value
**Validates: Requirements 6.3**

### Property 14: No mock matchmaking
*For any* room creation, the system should not automatically assign player2_id, leaving it null until a real player joins
**Validates: Requirements 9.5**

### Property 15: Battle history completeness
*For any* player, their battle history should include all battles where they are either player1 or player2
**Validates: Requirements 10.1**

## Error Handling

### Room Code Collisions
- **Scenario**: Generated room code already exists
- **Handling**: Retry generation up to 5 times with different random seeds
- **Fallback**: If all retries fail, return error to user (extremely rare)

### Real-time Connection Failures
- **Scenario**: WebSocket connection drops during battle
- **Handling**: 
  - Display connection status indicator to user
  - Attempt automatic reconnection every 3 seconds
  - Queue moves locally if disconnected
  - Sync state when reconnected
- **Timeout**: After 30 seconds of failed reconnection, show error and option to refresh

### Stale Room Cleanup
- **Scenario**: Player creates room but never starts battle
- **Handling**: Database cleanup job runs every 5 minutes to delete rooms with status='waiting' older than 10 minutes
- **User Impact**: If player returns after 10 minutes, room will be gone and they'll need to create a new one

### Concurrent Join Attempts
- **Scenario**: Two players try to join the same room simultaneously
- **Handling**: Use database transaction with row locking to ensure only one player can update player2_id
- **Result**: First player succeeds, second player receives "room already full" error

### Invalid Room Codes
- **Scenario**: Player enters non-existent or malformed code
- **Handling**: 
  - Client-side validation for format (6 alphanumeric chars)
  - Server-side validation for existence and status
  - Clear error messages: "Invalid code format" vs "Room not found" vs "Room already started"

### Battle State Desynchronization
- **Scenario**: Real-time update missed, clients have different battle states
- **Handling**:
  - Each move includes turn_number for ordering
  - Clients periodically fetch full battle state (every 10 seconds)
  - If turn_number mismatch detected, force full state refresh

## Testing Strategy

### Unit Testing

**Room Code Generation**:
- Test code format (6 characters, valid charset)
- Test uniqueness check logic
- Test retry mechanism on collision

**Validation Functions**:
- Test room code format validation with valid and invalid inputs
- Test battle status validation (waiting, in_progress, completed)
- Test player authorization (can only cancel own rooms)

**Damage Calculation**:
- Test damage formula with various attack/defense combinations
- Test minimum damage of 1
- Test HP reduction doesn't go below 0

**Turn Logic**:
- Test turn switching after each move
- Test first turn determination by speed
- Test turn validation (only active player can move)

### Property-Based Testing

The system will use **fast-check** (for TypeScript/JavaScript) as the property-based testing library. Each property test should run a minimum of 100 iterations to ensure comprehensive coverage across the input space.

**Property Test 1: Room Code Uniqueness**
- Generate multiple room codes in parallel
- Verify no duplicates exist
- **Feature: real-time-pvp-battles, Property 1: Room code uniqueness**

**Property Test 2: Room Creation Persistence**
- Generate random valid player IDs and beast IDs
- Create rooms and verify database records
- **Feature: real-time-pvp-battles, Property 2: Room creation persistence**

**Property Test 3: Join State Transition**
- Generate random room states
- Perform join operations
- Verify status changes to 'in_progress' and player2_id is set
- **Feature: real-time-pvp-battles, Property 6: Join updates battle state**

**Property Test 4: HP Reduction**
- Generate random beast stats and move damages
- Calculate expected HP after move
- Verify HP never goes below 0
- **Feature: real-time-pvp-battles, Property 10: HP reduction consistency**

**Property Test 5: Turn Determination**
- Generate random beast speed stats
- Verify faster beast always goes first
- Verify player1 goes first on speed tie
- **Feature: real-time-pvp-battles, Property 12: Turn determination by speed**

**Property Test 6: Battle Completion**
- Generate random battle states with various HP values
- When HP reaches 0, verify status='completed' and winner_id is set correctly
- **Feature: real-time-pvp-battles, Property 11: Battle completion on zero HP**

### Integration Testing

**End-to-End Room Flow**:
1. Player A creates room
2. Verify room appears in rooms list
3. Player B joins room
4. Verify both players navigate to arena
5. Verify battle status is 'in_progress'

**Real-time Synchronization**:
1. Start battle with two clients
2. Player A makes move
3. Verify Player B receives update within 2 seconds
4. Verify HP values match on both clients

**Telegram Share Flow**:
1. Create room
2. Generate Telegram share URL
3. Verify URL contains room code
4. Navigate to URL with join parameter
5. Verify join interface pre-fills code

### Manual Testing Scenarios

- Test on mobile devices (touch interactions, screen sizes)
- Test with slow network connections (3G simulation)
- Test with multiple tabs open (same user, different battles)
- Test Telegram integration in actual Telegram app
- Test room cleanup after 10 minutes
- Test concurrent join attempts with multiple users

