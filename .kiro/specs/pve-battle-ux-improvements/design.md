# Design Document: PVE Battle UX Improvements

## Overview

The PVE Battle UX Improvements enhance the existing PVE battle system with three key features: automatic random enemy matching, dedicated PVE arena routing, and RISE token staking via jetton transfers. The system integrates with the existing battle infrastructure while adding new UI components and blockchain transaction handling.

## Architecture

### High-Level Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Battle    │─────▶│  Next.js API │─────▶│  Supabase   │
│  Page UI    │      │   Routes     │      │  Database   │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     
       │                     
       ▼                     
┌─────────────┐      ┌──────────────┐
│ TonConnect  │─────▶│ RISE Jetton  │
│     UI      │      │   Contract   │
└─────────────┘      └──────────────┘
```

### Battle Flow with Improvements

1. Player selects beast on `/battle` page
2. System automatically selects random enemy
3. Player optionally stakes RISE tokens
4. If staking, system sends jetton transfer to stake address
5. System creates PVE battle record
6. Player navigates to `/battle/pve/[id]` (not `/battle/arena/[id]`)
7. PVE arena loads real battle data
8. Battle executes with turn-based combat
9. Results display on PVE arena page

## Components and Interfaces

### Frontend Components

#### Battle Page (`app/battle/page.tsx`)
- Displays beast selection
- Automatically selects random enemy
- Shows auto-matched enemy (read-only)
- Handles stake input
- Initiates jetton transfer
- Creates PVE battle
- Navigates to `/battle/pve/[id]`

#### PVE Arena Page (`app/battle/pve/[id]/page.tsx`)
- New dedicated page for PVE battles
- Displays player beast and enemy
- Handles turn-based combat
- Shows battle outcome
- Displays rewards

### Utility Functions

#### Random Enemy Selection (`lib/enemy-utils.ts`)
```typescript
export function selectRandomEnemy(enemies: Enemy[]): Enemy | null {
  if (enemies.length === 0) return null
  const randomIndex = Math.floor(Math.random() * enemies.length)
  return enemies[randomIndex]
}
```

#### Jetton Transfer (`lib/jetton-transfer.ts`)
```typescript
interface JettonTransferParams {
  tonConnectUI: TonConnectUI
  jettonWalletAddress: string
  destinationAddress: string
  amount: number
  jettonDecimals: number
  forwardTonAmount?: string
}

export async function sendJettonTransfer(params: JettonTransferParams): Promise<void>
```

### API Routes

#### `/api/battles/pve` (POST)
**Request:**
```typescript
{
  player_id: string
  beast_id: number
  enemy_id: number
  stake_amount?: number
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
    stake_amount: number
  }
}
```

## Data Models

### Database Schema Updates

No new tables required. The existing `battles` table already supports:
- `battle_type: 'pve'`
- `enemy_id: number`
- `bet_amount: number` (can be used for stake amount)

### TypeScript Interfaces

```typescript
interface Enemy {
  id: number
  name: string
  level: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  reward: number
}

interface JettonTransferPayload {
  opCode: number // 0xf8a7ea5
  queryId: number // 0
  amount: bigint
  destination: Address
  responseDestination: Address
  customPayload: Cell | null
  forwardTonAmount: bigint
  forwardPayload: Cell | null
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*



### Property 1: Automatic enemy selection
*For any* beast selection in PVE mode, the system should automatically assign a random enemy from the available enemy list
**Validates: Requirements 1.1, 6.2**

### Property 2: Enemy display after selection
*For any* automatically selected enemy, the enemy data should be present in the UI state and displayed to the player
**Validates: Requirements 1.2**

### Property 3: Battle creation with selected enemy
*For any* battle creation request, the created battle record should contain the enemy_id of the randomly selected enemy
**Validates: Requirements 1.3**

### Property 4: Uniform random distribution
*For any* large number of random enemy selections, the distribution of selected enemies should approach uniform probability across all available enemies
**Validates: Requirements 1.4**

### Property 5: PVE route navigation
*For any* successfully created PVE battle, the system should navigate to the route `/battle/pve/[id]` where [id] is the battle ID
**Validates: Requirements 2.1**

### Property 6: Combatant data display
*For any* PVE arena page load, both the player's beast data and enemy data should be fetched from the database and displayed
**Validates: Requirements 2.2, 2.4**

### Property 7: Real data fetching
*For any* PVE arena page load, the system should call database fetch functions and not use hardcoded mock data
**Validates: Requirements 2.3**

### Property 8: No navigation on completion
*For any* battle status change to 'completed', the system should remain on the PVE arena page without triggering navigation
**Validates: Requirements 2.5**

### Property 9: Correct stake destination address
*For any* jetton transfer for staking, the destination address in the transfer payload should equal `0QD77r9HUu7VXdz-l_pgzfDgJWdHKNgk45oza4QZ7Z1CyqUX`
**Validates: Requirements 3.1, 4.2**

### Property 10: Jetton wallet as sender
*For any* jetton transfer transaction, the transaction should be sent to the player's jetton wallet address
**Validates: Requirements 3.2**

### Property 11: Decimal conversion accuracy
*For any* stake amount in human-readable format, the converted amount in smallest units should equal the amount multiplied by 10^9
**Validates: Requirements 3.3, 4.3**

### Property 12: TEP-74 op code
*For any* jetton transfer payload, the first 32 bits should contain the op code `0xf8a7ea5`
**Validates: Requirements 3.4**

### Property 13: Battle creation after transfer
*For any* successful jetton transfer, the battle creation function should be called immediately after
**Validates: Requirements 3.5**

### Property 14: Forward TON amount
*For any* jetton transfer, the forward TON amount in the payload should equal 0.05 TON (50000000 nanotons)
**Validates: Requirements 4.1**

### Property 15: Transfer error handling
*For any* failed jetton transfer, the system should set an error state and display an error message to the player
**Validates: Requirements 4.4**

### Property 16: Stake amount persistence
*For any* successful battle creation with stake, the battle record in the database should contain the correct stake amount
**Validates: Requirements 4.5**

### Property 17: Positive stake validation
*For any* stake initiation, amounts less than or equal to zero should be rejected with a validation error
**Validates: Requirements 5.1**

### Property 18: Wallet connection validation
*For any* stake initiation, the system should verify a wallet is connected before proceeding
**Validates: Requirements 5.2**

### Property 19: Jetton wallet address validation
*For any* stake initiation, the system should verify the jetton wallet address is provided and valid
**Validates: Requirements 5.3**

### Property 20: Validation failure prevents transfer
*For any* failed validation, the jetton transfer function should not be called
**Validates: Requirements 5.4**

### Property 21: Validation success enables transfer
*For any* successful validation, the jetton transfer function should be called
**Validates: Requirements 5.5**

### Property 22: No enemy selection UI
*For any* battle page render in PVE mode, the enemy selection UI components should not be present in the DOM
**Validates: Requirements 6.1, 6.5**

### Property 23: Clean battle setup display
*For any* battle setup display, only the selected beast card and auto-matched enemy card should be shown
**Validates: Requirements 6.3**

### Property 24: Start button functionality
*For any* UI update, clicking the "Start Battle" button should trigger the battle creation flow
**Validates: Requirements 6.4**

## Error Handling

### Random Enemy Selection Errors
- **No Enemies Available**: Display error message "No enemies available for battle", disable Start Battle button
- **Selection Function Error**: Log error, retry selection once, fallback to first enemy if retry fails

### Routing Errors
- **Invalid Battle ID**: Redirect to `/battle` page with error message
- **PVE Arena Load Failure**: Display error message, provide "Return to Battle Selection" button

### Jetton Transfer Errors
- **Wallet Not Connected**: Display "Please connect your wallet to stake tokens"
- **Insufficient Balance**: Display "Insufficient RISE token balance"
- **Transfer Rejected**: Display "Transaction rejected by user", allow retry
- **Transfer Failed**: Display "Transaction failed: [error message]", allow retry
- **Invalid Address**: Display "Invalid jetton wallet address"

### Validation Errors
- **Zero Stake Amount**: Display "Stake amount must be greater than zero"
- **Missing Jetton Wallet**: Display "Jetton wallet address not found"
- **Invalid Amount Format**: Display "Invalid stake amount format"

## Testing Strategy

### Unit Tests
- Random enemy selection function
- Decimal conversion for jetton amounts
- Payload construction for TEP-74 standard
- Validation functions for stake inputs
- Route path generation for PVE battles

### Property-Based Tests

The testing framework will use **fast-check** for JavaScript/TypeScript property-based testing.

Each property-based test will:
- Run a minimum of 100 iterations
- Generate random valid inputs (enemy lists, stake amounts, addresses)
- Verify the correctness property holds
- Be tagged with the corresponding design property number

Example test structure:
```typescript
// Feature: pve-battle-ux-improvements, Property 11: Decimal conversion accuracy
fc.assert(
  fc.property(
    fc.double({ min: 0.000000001, max: 1000000 }),
    (amount) => {
      const converted = convertToSmallestUnits(amount, 9)
      const expected = BigInt(Math.floor(amount * 1e9))
      return converted === expected
    }
  ),
  { numRuns: 100 }
)
```

### Integration Tests
- End-to-end PVE battle flow from selection to completion
- Jetton transfer integration with TonConnect
- Database persistence of stake amounts
- Navigation flow through PVE routes

### Edge Cases
- Empty enemy list
- Zero stake amount
- Disconnected wallet during stake
- Network failure during jetton transfer
- Invalid jetton wallet address
- Battle creation failure after successful transfer

## Implementation Notes

### Jetton Transfer Implementation

The jetton transfer follows TEP-74 standard:

```typescript
const body = beginCell()
  .storeUint(0xf8a7ea5, 32)                    // op code
  .storeUint(0, 64)                             // query_id
  .storeCoins(amountInSmallestUnits)            // jetton amount
  .storeAddress(Address.parse(destinationAddress)) // recipient
  .storeAddress(Address.parse(senderAddress))   // response destination
  .storeUint(0, 1)                              // no custom payload
  .storeCoins(toNano("0.05"))                   // forward TON amount
  .storeUint(0, 1)                              // no forward payload
  .endCell()
```

### Route Structure

- `/battle` - Battle selection page (PVE and PVP tabs)
- `/battle/pve/[id]` - PVE arena page (new)
- `/battle/arena/[id]` - PVP arena page (existing)
- `/battle/pvp` - PVP matchmaking page (existing)

### UI Changes

Remove from `/battle` page:
- Enemy selection grid
- "Choose Your Enemy" heading
- Enemy card click handlers

Add to `/battle` page:
- Auto-matched enemy display (read-only)
- Stake input field
- Stake button with jetton transfer

Create new `/battle/pve/[id]` page:
- Copy structure from `/battle/arena/[id]`
- Modify to handle enemy data instead of opponent beast
- Remove PVP-specific features (betting, opponent waiting)
- Add PVE-specific features (enemy AI, reward display)
