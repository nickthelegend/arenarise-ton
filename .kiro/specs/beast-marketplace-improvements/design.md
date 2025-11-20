# Design Document

## Overview

This design addresses multiple improvements to the ArenaRise beast marketplace application:
1. Restoration of retro 8-bit font styling
2. Integration of beast creation with backend NFT minting
3. Implementation of beast purchase flow with TON payment
4. Default PVP selection on battle page
5. Removal of mock data in favor of database queries
6. Real beast inventory fetching from database
7. Real statistics API endpoint for home page
8. Automatic user registration on wallet connection

The system follows a client-server architecture where the Next.js frontend communicates with both a Supabase database and an external blockchain backend service.

## Architecture

### System Components

```
┌─────────────────┐
│   User Browser  │
│  (TonConnect)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Next.js Frontend Application  │
│  ┌──────────────────────────┐   │
│  │  Pages & Components      │   │
│  │  - Create Page           │   │
│  │  - Battle Page           │   │
│  │  - Inventory Page        │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │  API Routes              │   │
│  │  - /api/create/beast     │   │
│  │  - /api/purchase/beast   │   │
│  │  - /api/beasts           │   │
│  │  - /api/battles          │   │
│  └──────────────────────────┘   │
└────────┬────────────────┬────────┘
         │                │
         ▼                ▼
┌─────────────────┐  ┌──────────────────────┐
│  Supabase DB    │  │  Backend Service     │
│  - beasts       │  │  arenarise-backend   │
│  - users        │  │  - /api/mint         │
│  - moves        │  │  - /api/send         │
│  - battles      │  │  - /api/send/rise    │
└─────────────────┘  └──────────────────────┘
```

### Data Flow

**Beast Creation Flow:**
1. User connects wallet via TonConnect
2. User clicks "Generate Beast" on create page
3. Frontend calls `/api/create/beast` with wallet address
4. API calls backend `/api/mint` to generate and mint NFT
5. API stores beast data in Supabase with combat stats
6. API assigns default battle moves to beast
7. Frontend displays beast preview

**Beast Purchase Flow:**
1. User reviews generated beast preview
2. User clicks "Buy Beast - 1 TON"
3. Frontend initiates TON transaction via TonConnect
4. User confirms payment in wallet
5. Frontend calls `/api/purchase/beast` with beast_id and wallet
6. API calls backend `/api/send` to transfer NFT
7. API updates beast ownership in database
8. Frontend redirects to inventory

## Components and Interfaces

### Frontend Components

#### Create Page (`app/create/page.tsx`)
- **Purpose**: Beast generation and purchase interface
- **State Management**:
  - `generatedBeast`: Currently generated beast data
  - `isGenerating`: Loading state for generation
  - `isPurchasing`: Loading state for purchase
  - `purchaseComplete`: Success state
  - `error`: Error message display
- **Key Functions**:
  - `handleGenerateBeast()`: Calls API to create beast
  - `handlePurchase()`: Initiates payment and NFT transfer

#### Battle Page (`app/battle/page.tsx`)
- **Purpose**: Battle mode selection and beast/opponent selection
- **State Management**:
  - `selectedBeast`: User's chosen beast for battle
  - `selectedEnemy`: Chosen opponent (PVE) or matched player (PVP)
  - `defaultTab`: Set to "pvp" for default selection
- **Data Sources**: Replace mock arrays with API calls

### API Routes

#### `/api/create/beast` (POST)
**Request:**
```typescript
{
  wallet_address: string
}
```

**Response:**
```typescript
{
  success: boolean
  beast: {
    id: number
    name: string
    description: string
    nft_address: string
    owner_address: string
    hp: number
    max_hp: number
    attack: number
    defense: number
    speed: number
    level: number
    traits: object
  }
  mintData: object
}
```

**Process:**
1. Validate wallet address
2. Call backend `/api/mint`
3. Extract combat stats from traits
4. Insert beast into database
5. Assign default battle moves
6. Return beast data

#### `/api/purchase/beast` (POST)
**Request:**
```typescript
{
  beast_id: number
  wallet_address: string
  nft_address: string
  payment_verified: boolean
}
```

**Response:**
```typescript
{
  success: boolean
  message: string
  transferData: object
}
```

**Process:**
1. Validate required fields
2. Verify payment (check payment_verified flag)
3. Call backend `/api/send` with NFT and wallet addresses
4. Update beast ownership in database
5. Return success response

#### `/api/beasts` (GET)
**Purpose**: Fetch user's beasts from database
**Query Parameters:**
- `wallet_address`: Filter by owner

**Response:**
```typescript
{
  beasts: Beast[]
}
```

#### `/api/stats` (GET)
**Purpose**: Fetch real ArenaRise statistics for home page display
**Query Parameters:** None

**Response:**
```typescript
{
  totalBeasts: number
  activePlayers: number
  battlesFought: number
  totalVolume: string
}
```

**Process:**
1. Query beasts table for total count
2. Query users table for total count
3. Query battles table for total count
4. Calculate total volume from transactions or set to calculated value
5. Return aggregated statistics

#### `/api/users` (POST)
**Purpose**: Create or verify user record on wallet connection
**Request:**
```typescript
{
  wallet_address: string
}
```

**Response:**
```typescript
{
  success: boolean
  user: {
    id: string
    wallet_address: string
    created_at: string
  }
  isNew: boolean
}
```

**Process:**
1. Check if wallet_address exists in users table
2. If not exists, insert new user record
3. If exists, return existing user
4. Return user data with isNew flag

## Data Models

### Beast
```typescript
interface Beast {
  id: number
  request_id: string
  name: string
  description: string
  image_ipfs_uri: string
  nft_address: string | null
  owner_address: string
  status: 'pending' | 'completed'
  hp: number
  max_hp: number
  attack: number
  defense: number
  speed: number
  level: number
  traits: {
    trait_type: string
    value: string
  }[]
  created_at: string
  updated_at: string
}
```

### Move
```typescript
interface Move {
  id: number
  name: string
  damage: number
  type: string
  description: string
}
```

### BeastMove (Junction)
```typescript
interface BeastMove {
  beast_id: number
  move_id: number
  slot: number // 1-4 for move slots
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Wallet connection requirement
*For any* user attempting to access the create page, if the wallet is not connected, the system should redirect to the home page
**Validates: Requirements 2.1**

### Property 2: Beast creation with wallet
*For any* connected wallet address, when generating a beast, the created beast should have the owner_address field set to that wallet address
**Validates: Requirements 2.4**

### Property 3: Combat stats extraction
*For any* minted beast with traits, the stored combat attributes (HP, Attack, Defense, Speed) should match the values extracted from the NFT traits
**Validates: Requirements 2.5**

### Property 4: Battle moves assignment
*For any* newly created beast, the database should contain associated battle move records linked to that beast's ID
**Validates: Requirements 3.1, 3.2**

### Property 5: Preview data completeness
*For any* generated beast preview, the displayed data should include name, description, all combat attributes, and all trait badges
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: Payment amount validation
*For any* purchase transaction, the payment amount should equal exactly 1 TON
**Validates: Requirements 5.1**

### Property 7: Payment address validation
*For any* purchase transaction, the recipient address should be 0QD77r9HUu7VXdz-l_pgzfDgJWdHKNgk45oza4QZ7Z1CyqUX
**Validates: Requirements 5.2**

### Property 8: Ownership transfer
*For any* successful purchase, the beast's owner_address in the database should be updated to the buyer's wallet address
**Validates: Requirements 5.5**

### Property 9: PVP default selection
*For any* user navigating to the battle page, the PVP tab should be the active tab by default
**Validates: Requirements 6.1**

### Property 10: Real data usage
*For any* beast or enemy display, the data should come from database queries, not from hardcoded mock arrays
**Validates: Requirements 7.1, 7.2**

### Property 11: Inventory beast filtering
*For any* user wallet address, the inventory page should only display beasts where the owner_address matches that wallet address
**Validates: Requirements 8.1**

### Property 12: Statistics accuracy
*For any* statistics API call, the returned values should match the actual counts in the database tables
**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 13: User registration idempotency
*For any* wallet address, calling the user registration endpoint multiple times should not create duplicate user records
**Validates: Requirements 10.1, 10.2, 10.3**

## Error Handling

### Frontend Error Handling
- **Wallet Not Connected**: Redirect to home page with toast notification
- **Generation Failure**: Display error message in UI, allow retry
- **Payment Cancelled**: Clear loading state, display cancellation message
- **Purchase Failure**: Display error, keep beast preview visible for retry
- **Network Errors**: Show user-friendly error messages with retry options

### API Error Handling
- **Missing Parameters**: Return 400 Bad Request with descriptive error
- **Backend Service Down**: Return 500 with message to try again later
- **Database Errors**: Log error, return 500 with generic message
- **NFT Transfer Failure**: Return 500, do not update ownership
- **Invalid Wallet Address**: Return 400 with validation error

### Database Error Handling
- **Connection Failures**: Retry with exponential backoff
- **Query Timeouts**: Return error to client, log for monitoring
- **Constraint Violations**: Return 400 with specific constraint error
- **Empty Results**: Return empty array with 200 status

## Testing Strategy

### Unit Testing
We will use **Vitest** as the testing framework for this Next.js application.

**Unit Test Coverage:**
- API route handlers (`/api/create/beast`, `/api/purchase/beast`)
- Data transformation functions (traits to combat stats)
- Validation functions (wallet address, payment amount)
- Error handling paths
- Database query functions

**Example Unit Tests:**
- Test that `/api/create/beast` returns 400 when wallet_address is missing
- Test that combat stats are correctly extracted from trait array
- Test that payment address constant matches specification
- Test that empty database results return appropriate empty state

### Property-Based Testing
We will use **fast-check** as the property-based testing library for TypeScript/JavaScript.

**Configuration:**
- Each property test should run a minimum of 100 iterations
- Each test must be tagged with a comment referencing the design property
- Tag format: `// Feature: beast-marketplace-improvements, Property {number}: {property_text}`

**Property Test Coverage:**
- Property 1: Wallet connection requirement (redirect behavior)
- Property 2: Beast creation with wallet (owner_address assignment)
- Property 3: Combat stats extraction (trait parsing accuracy)
- Property 4: Battle moves assignment (database relationships)
- Property 5: Preview data completeness (UI rendering)
- Property 6: Payment amount validation (transaction value)
- Property 7: Payment address validation (recipient address)
- Property 8: Ownership transfer (database updates)
- Property 9: PVP default selection (tab state)
- Property 10: Real data usage (no mock data in production)

**Test Generators:**
- Generate random wallet addresses (valid TON format)
- Generate random beast trait arrays with varying attributes
- Generate random combat stat values within valid ranges
- Generate random NFT addresses
- Generate random database query results

### Integration Testing
- Test complete beast creation flow from API call to database storage
- Test complete purchase flow from payment to NFT transfer
- Test battle page data loading from database
- Test error scenarios with mocked backend failures

### Manual Testing Checklist
- Verify retro font displays correctly across all pages
- Test wallet connection and disconnection flows
- Generate multiple beasts and verify uniqueness
- Complete purchase flow with real TON testnet transaction
- Verify NFT appears in wallet after purchase
- Check battle page loads real data
- Verify PVP tab is selected by default
- Test error states and user feedback
