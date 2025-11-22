# Design Document: User Profile System

## Overview

The User Profile System provides a comprehensive view of user information, including Telegram identity, RISE token balance, transaction history, and battle history. The system integrates with existing Telegram authentication, wallet connection, and database infrastructure to create a unified user dashboard.

## Architecture

### High-Level Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Profile   │─────▶│  Next.js API │─────▶│  Supabase   │
│   Page UI   │      │   Routes     │      │  Database   │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌─────────────┐      ┌──────────────┐
│  Telegram   │      │ RISE Jetton  │
│   WebApp    │      │   Contract   │
└─────────────┘      └──────────────┘
```

### Data Flow

1. User clicks profile image or RISE token display
2. System navigates to /profile route
3. Profile page fetches Telegram user data from context
4. Profile page fetches RISE balance from blockchain
5. Profile page fetches transactions from database
6. Profile page fetches battles from database
7. UI displays all information in organized sections

## Components and Interfaces

### Frontend Components

#### ProfilePage (`app/profile/page.tsx`)
- Main profile interface
- Displays Telegram profile information
- Shows RISE token balance
- Lists recent transactions
- Lists recent battles
- Handles loading and error states

#### ProfileHeader Component
- Displays Telegram profile photo
- Shows user name and username
- Shows premium badge if applicable
- Displays RISE balance prominently

#### TransactionList Component
- Displays transaction history
- Shows transaction type, amount, timestamp
- Handles empty state

#### BattleList Component
- Displays battle history
- Shows opponent, outcome, reward
- Handles empty state

### API Routes

#### `/api/profile/transactions` (GET)
**Query Parameters:**
- `wallet_address`: string

**Response:**
```typescript
{
  transactions: Array<{
    id: string
    type: 'swap' | 'reward' | 'transfer'
    rise_amount: number
    ton_amount?: number
    timestamp: string
    status: string
  }>
}
```

#### `/api/profile/battles` (GET)
**Query Parameters:**
- `user_id`: string

**Response:**
```typescript
{
  battles: Array<{
    id: string
    opponent_name: string
    battle_type: 'pvp' | 'pve'
    won: boolean
    reward: number
    created_at: string
  }>
}
```

## Data Models

### TypeScript Interfaces

```typescript
interface UserProfile {
  telegram: {
    id: number
    first_name: string
    last_name?: string
    username?: string
    photo_url?: string
    is_premium?: boolean
  }
  wallet_address: string
  rise_balance: number
}

interface Transaction {
  id: string
  type: 'swap' | 'reward' | 'transfer'
  rise_amount: number
  ton_amount?: number
  timestamp: string
  status: string
}

interface BattleHistoryEntry {
  id: string
  opponent_name: string
  battle_type: 'pvp' | 'pve'
  won: boolean
  reward: number
  created_at: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Balance formatting
*For any* RISE token balance value, the displayed format should include appropriate decimal places and thousand separators
**Validates: Requirements 3.2**

### Property 2: Transaction display completeness
*For any* transaction in the history, the displayed information should include transaction type, RISE amount, and timestamp
**Validates: Requirements 4.2, 4.3**

### Property 3: Transaction ordering
*For any* user's transaction history with multiple entries, entries should be ordered by timestamp in descending order (most recent first)
**Validates: Requirements 4.4**

### Property 4: Battle display completeness
*For any* battle in the history, the displayed information should include opponent name, outcome (win/loss), and reward if applicable
**Validates: Requirements 5.2, 5.3, 5.4**

### Property 5: Battle ordering
*For any* user's battle history with multiple entries, entries should be ordered by creation timestamp in descending order (most recent first)
**Validates: Requirements 5.5**

### Property 6: Wallet address verification
*For any* user data fetch request, the system should verify the requested wallet address matches the connected wallet
**Validates: Requirements 7.1**

### Property 7: Transaction data isolation
*For any* transaction query, the returned results should only include transactions associated with the authenticated user's wallet
**Validates: Requirements 7.2**

### Property 8: Battle data isolation
*For any* battle query, the returned results should only include battles where the authenticated user is a participant
**Validates: Requirements 7.3**

## Error Handling

### Data Fetching Errors
- **Balance Fetch Failure**: Display error message, show last known balance if available
- **Transaction Fetch Failure**: Display error message, show empty state
- **Battle Fetch Failure**: Display error message, show empty state

### Authentication Errors
- **No Wallet Connected**: Redirect to home page with message
- **Wallet Mismatch**: Display error, prevent data access
- **API Authentication Failure**: Display error message, log security event

### UI Errors
- **Missing Telegram Data**: Display default avatar and name
- **Missing Profile Photo**: Display default avatar
- **Network Timeout**: Display retry option

## Testing Strategy

### Unit Tests
- Balance formatting function
- Transaction list rendering
- Battle list rendering
- Authentication checks

### Property-Based Tests

The testing framework will use **fast-check** for JavaScript/TypeScript property-based testing.

Each property-based test will:
- Run a minimum of 100 iterations
- Generate random valid inputs (balances, transactions, battles)
- Verify the correctness property holds
- Be tagged with the corresponding design property number

Example test structure:
```typescript
// Feature: user-profile-system, Property 3: Transaction ordering
fc.assert(
  fc.property(
    fc.array(fc.record({ timestamp: fc.date() })),
    (transactions) => {
      const sorted = sortTransactions(transactions)
      return isDescending(sorted.map(t => t.timestamp))
    }
  ),
  { numRuns: 100 }
)
```

### Integration Tests
- End-to-end profile page load
- Navigation from navbar to profile
- Data fetching and display
- Authentication flow

### Edge Cases
- Empty transaction history
- Empty battle history
- Missing Telegram profile photo
- Very large balance values
- Very long transaction/battle lists
