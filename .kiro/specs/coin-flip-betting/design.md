# Design Document: Coin Flip Betting Game

## Overview

The Coin Flip Betting Game is a simple gambling feature that allows users to bet TON tokens on a coin flip outcome (heads or tails). Winners receive double their bet amount in RISE tokens. The system integrates with TON Connect for wallet interactions and uses the existing RISE jetton infrastructure for payouts.

## Architecture

### High-Level Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Browser   │─────▶│  Next.js API │─────▶│  Supabase   │
│  (React UI) │      │   Routes     │      │  Database   │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌─────────────┐      ┌──────────────┐
│ TON Connect │      │ RISE Jetton  │
│   Wallet    │      │   Contract   │
└─────────────┘      └──────────────┘
```

### Component Flow

1. User navigates to /bets page
2. User enters bet amount and selects heads/tails
3. System initiates TON transaction via TON Connect
4. Upon transaction confirmation, system generates random result
5. If user wins, system transfers RISE tokens
6. System records transaction in database
7. UI displays result and updates balance

## Components and Interfaces

### Frontend Components

#### BetsPage (`app/bets/page.tsx`)
- Main betting interface
- Displays coin flip animation
- Shows betting history
- Handles user input and wallet connection

#### CoinFlipAnimation Component
- Animated coin flip visualization
- Shows heads/tails result
- Provides visual feedback for win/loss

### API Routes

#### `/api/bets/flip` (POST)
**Request:**
```typescript
{
  wallet_address: string
  bet_amount: number  // in TON
  choice: 'heads' | 'tails'
  transaction_hash: string
}
```

**Response:**
```typescript
{
  success: boolean
  result: 'heads' | 'tails'
  won: boolean
  payout?: number  // in RISE tokens
  flip_id: string
  error?: string
}
```

#### `/api/bets/history` (GET)
**Query Parameters:**
- `wallet_address`: string

**Response:**
```typescript
{
  flips: Array<{
    id: string
    bet_amount: number
    choice: 'heads' | 'tails'
    result: 'heads' | 'tails'
    won: boolean
    payout: number
    created_at: string
  }>
}
```

## Data Models

### Database Schema

#### `coin_flips` Table
```sql
CREATE TABLE coin_flips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  bet_amount DECIMAL(18, 9) NOT NULL,
  choice TEXT NOT NULL CHECK (choice IN ('heads', 'tails')),
  result TEXT NOT NULL CHECK (result IN ('heads', 'tails')),
  won BOOLEAN NOT NULL,
  payout DECIMAL(18, 9) DEFAULT 0,
  transaction_hash TEXT NOT NULL,
  rise_transfer_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_coin_flips_wallet ON coin_flips(wallet_address);
CREATE INDEX idx_coin_flips_created ON coin_flips(created_at DESC);
```

### TypeScript Interfaces

```typescript
interface CoinFlip {
  id: string
  wallet_address: string
  user_id: string | null
  bet_amount: number
  choice: 'heads' | 'tails'
  result: 'heads' | 'tails'
  won: boolean
  payout: number
  transaction_hash: string
  rise_transfer_hash: string | null
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Bet amount validation
*For any* bet amount entered by a user, if the amount is less than or equal to zero, the system should reject the bet and display an error
**Validates: Requirements 2.3**

### Property 2: Random result validity
*For any* coin flip execution, the result should be either 'heads' or 'tails' (no other values)
**Validates: Requirements 3.4**

### Property 3: Random result distribution
*For any* large number of coin flips (n >= 100), the distribution of heads and tails should be approximately equal (within 40-60% range)
**Validates: Requirements 6.1, 6.2**

### Property 4: Payout calculation
*For any* winning coin flip with bet amount X, the payout should equal exactly 2 * X in RISE tokens
**Validates: Requirements 4.1**

### Property 5: Win condition
*For any* coin flip, the user should win if and only if their choice matches the result
**Validates: Requirements 3.5, 4.4**

### Property 6: Database record completeness
*For any* completed coin flip, the database record should contain all required fields: bet_amount, choice, result, won, payout, transaction_hash, and created_at
**Validates: Requirements 5.1**

### Property 7: History ordering
*For any* user's betting history with multiple entries, entries should be ordered by creation timestamp in descending order (most recent first)
**Validates: Requirements 5.4**

### Property 8: History display completeness
*For any* flip in the betting history, the displayed information should include bet amount, choice, result, and outcome
**Validates: Requirements 5.3**

### Property 9: Timestamp recording
*For any* stored coin flip, the created_at timestamp should be present and represent the time of flip execution
**Validates: Requirements 6.3**

### Property 10: Failed transaction safety
*For any* failed TON transaction, the system should not create a completed flip record or transfer RISE tokens
**Validates: Requirements 6.4**

## Error Handling

### Transaction Errors
- **TON Transaction Failure**: Display error message, do not proceed with flip
- **RISE Transfer Failure**: Log error, mark flip as 'failed', notify user
- **Database Write Failure**: Log error, attempt retry, notify user

### Validation Errors
- **Invalid Bet Amount**: Display inline error message
- **Insufficient Balance**: Display error with current balance
- **No Wallet Connected**: Prompt user to connect wallet

### Network Errors
- **API Timeout**: Display retry option
- **Connection Lost**: Queue transaction for retry when connection restored

## Testing Strategy

### Unit Tests
- Bet amount validation logic
- Payout calculation function
- Result generation randomness
- Database query functions

### Property-Based Tests

The testing framework will use **fast-check** for JavaScript/TypeScript property-based testing.

Each property-based test will:
- Run a minimum of 100 iterations
- Generate random valid inputs
- Verify the correctness property holds
- Be tagged with the corresponding design property number

Example test structure:
```typescript
// Feature: coin-flip-betting, Property 4: Payout calculation
fc.assert(
  fc.property(fc.double({ min: 0.01, max: 100 }), (betAmount) => {
    const payout = calculatePayout(betAmount, true)
    return payout === betAmount * 2
  }),
  { numRuns: 100 }
)
```

### Integration Tests
- End-to-end flip flow with mock wallet
- Database transaction recording
- RISE token transfer simulation

### Edge Cases
- Zero bet amount
- Extremely large bet amounts
- Rapid consecutive flips
- Network interruption during flip
