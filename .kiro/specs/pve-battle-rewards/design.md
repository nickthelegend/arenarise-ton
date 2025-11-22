# Design Document: PVE Battle Rewards System

## Overview

The PVE Battle Rewards system extends the existing battle functionality to award RISE tokens to players who defeat AI enemies. The system integrates with the current battle arena, database schema, and RISE jetton infrastructure to provide a complete reward mechanism for PVE gameplay.

## Architecture

### High-Level Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Battle    │─────▶│  Next.js API │─────▶│  Supabase   │
│  Arena UI   │      │   Routes     │      │  Database   │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌─────────────┐      ┌──────────────┐
│   Battle    │      │ RISE Jetton  │
│   Engine    │      │   Contract   │
└─────────────┘      └──────────────┘
```

### Battle Flow

1. Player selects beast and enemy on /battle page
2. System creates battle record with PVE flag
3. Player navigates to battle arena
4. Turn-based combat executes
5. System determines winner when HP reaches zero
6. If player wins, system awards 200 RISE tokens
7. System records battle outcome and reward

## Components and Interfaces

### Frontend Components

#### Battle Arena Page (`app/battle/arena/[id]/page.tsx`)
- Displays battle state
- Shows beast and enemy stats
- Handles move selection
- Displays battle outcome
- Shows reward notification

#### Battle Engine (Client-side logic)
- Calculates damage
- Manages turn order
- Tracks HP changes
- Determines winner

### API Routes

#### `/api/battles/pve` (POST)
**Request:**
```typescript
{
  player_id: string
  beast_id: number
  enemy_id: number
}
```

**Response:**
```typescript
{
  success: boolean
  battle: {
    id: string
    player_id: string
    beast_id: number
    enemy_id: number
    status: 'in_progress'
  }
}
```

#### `/api/battles/[id]/complete` (POST)
**Request:**
```typescript
{
  battle_id: string
  winner: 'player' | 'enemy'
  final_player_hp: number
  final_enemy_hp: number
}
```

**Response:**
```typescript
{
  success: boolean
  won: boolean
  reward?: number  // 200 RISE if won
  battle: {
    id: string
    status: 'completed'
    winner: string
  }
}
```

#### `/api/battles/history` (GET)
**Query Parameters:**
- `player_id`: string

**Response:**
```typescript
{
  battles: Array<{
    id: string
    enemy_name: string
    won: boolean
    reward: number
    created_at: string
  }>
}
```

## Data Models

### Database Schema Updates

#### Update `battles` Table
```sql
ALTER TABLE battles
  ADD COLUMN IF NOT EXISTS battle_type TEXT DEFAULT 'pvp' CHECK (battle_type IN ('pvp', 'pve')),
  ADD COLUMN IF NOT EXISTS enemy_id INTEGER,
  ADD COLUMN IF NOT EXISTS reward_amount DECIMAL(18, 9) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_status TEXT CHECK (reward_status IN ('none', 'pending', 'completed', 'failed'));

CREATE INDEX idx_battles_type ON battles(battle_type);
CREATE INDEX idx_battles_player_history ON battles(player1_id, created_at DESC);
```

### TypeScript Interfaces

```typescript
interface PVEBattle extends Battle {
  battle_type: 'pve'
  enemy_id: number
  reward_amount: number
  reward_status: 'none' | 'pending' | 'completed' | 'failed'
}

interface BattleOutcome {
  battle_id: string
  winner: 'player' | 'enemy'
  reward: number
  final_player_hp: number
  final_enemy_hp: number
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Battle record creation
*For any* battle start with valid beast and enemy selections, a battle record should be created in the database
**Validates: Requirements 1.2**

### Property 2: Battle initialization
*For any* newly created battle, both the player beast and enemy should start with HP equal to their max_hp
**Validates: Requirements 1.5**

### Property 3: Damage calculation
*For any* move execution with beast stats and move power, the calculated damage should be a positive integer based on the formula
**Validates: Requirements 2.2**

### Property 4: HP reduction
*For any* damage dealt to a combatant, the new HP should equal the old HP minus the damage amount (minimum 0)
**Validates: Requirements 2.3**

### Property 5: Turn switching
*For any* completed player move, the turn should switch to the enemy
**Validates: Requirements 2.4**

### Property 6: Player win condition
*For any* battle where enemy HP reaches zero, the player should be declared the winner
**Validates: Requirements 3.1**

### Property 7: Player loss condition
*For any* battle where player beast HP reaches zero, the enemy should be declared the winner
**Validates: Requirements 3.2**

### Property 8: Battle completion status
*For any* battle where a winner is determined, the battle status should be updated to "completed"
**Validates: Requirements 3.3**

### Property 9: Win reward amount
*For any* PVE battle won by the player, the reward amount should be exactly 200 RISE tokens
**Validates: Requirements 4.1**

### Property 10: Loss no reward
*For any* PVE battle lost by the player, the reward amount should be 0 RISE tokens
**Validates: Requirements 4.4**

### Property 11: Reward recording
*For any* completed battle with a reward, the reward amount should be recorded in the database
**Validates: Requirements 4.5, 5.1**

### Property 12: History display completeness
*For any* battle in the history, the displayed information should include enemy name, outcome (won/lost), and reward earned
**Validates: Requirements 5.3**

### Property 13: History ordering
*For any* player's battle history with multiple entries, entries should be ordered by creation timestamp in descending order
**Validates: Requirements 5.4**

### Property 14: Battle existence validation
*For any* reward processing request, the system should verify the battle exists before awarding rewards
**Validates: Requirements 6.1**

### Property 15: Player participation validation
*For any* reward award, the system should verify the requesting player is the battle participant
**Validates: Requirements 6.2**

### Property 16: Battle completion validation
*For any* reward award, the system should verify the battle status is "completed"
**Validates: Requirements 6.3**

### Property 17: Winner validation
*For any* reward award, the system should verify the player is marked as the winner
**Validates: Requirements 6.4**

## Error Handling

### Battle Errors
- **Invalid Beast Selection**: Display error message, prevent battle start
- **Invalid Enemy Selection**: Display error message, prevent battle start
- **Battle Creation Failure**: Log error, display user-friendly message

### Combat Errors
- **Invalid Move Selection**: Prevent move execution, display error
- **Damage Calculation Error**: Log error, use default damage value
- **HP Update Failure**: Log error, retry update

### Reward Errors
- **RISE Transfer Failure**: Mark battle as "reward_pending", log error, notify player
- **Database Update Failure**: Retry update, log error if persistent
- **Validation Failure**: Reject reward request, log security event

## Testing Strategy

### Unit Tests
- Battle creation logic
- Damage calculation formulas
- HP reduction logic
- Win/loss condition checks
- Reward amount calculation

### Property-Based Tests

The testing framework will use **fast-check** for JavaScript/TypeScript property-based testing.

Each property-based test will:
- Run a minimum of 100 iterations
- Generate random valid inputs (beast stats, move power, HP values)
- Verify the correctness property holds
- Be tagged with the corresponding design property number

Example test structure:
```typescript
// Feature: pve-battle-rewards, Property 9: Win reward amount
fc.assert(
  fc.property(fc.record({ won: fc.constant(true) }), (battle) => {
    const reward = calculateReward(battle)
    return reward === 200
  }),
  { numRuns: 100 }
)
```

### Integration Tests
- End-to-end battle flow from start to reward
- Database transaction recording
- RISE token transfer simulation

### Edge Cases
- Battle with zero damage moves
- Simultaneous HP reaching zero
- Rapid consecutive battles
- Network interruption during battle
