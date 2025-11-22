# Design Document

## Overview

This design addresses three critical production bugs in the PVP battle system. The solution involves replacing mock data with real database queries, implementing blockchain transaction creation for stakes, and properly displaying beast images from the database. The implementation will leverage existing APIs and the TON Connect jetton transfer system.

## Architecture

### Data Flow

**Current (Broken) Flow:**
1. User navigates to `/battle/[id]/start`
2. Page displays hardcoded mock data
3. User confirms stake → only stored in session storage
4. User enters arena → sees emoji placeholders instead of images

**Fixed Flow:**
1. User navigates to `/battle/[id]/start`
2. Page fetches real battle data from `/api/battles?battle_id={id}`
3. Page displays actual player and opponent beasts
4. User confirms stake → initiates blockchain transaction via TonConnect
5. Transaction completes → hash stored in database
6. User enters arena → displays actual beast images from `image_url` field

### Component Structure

```
app/
├── battle/
│   ├── [id]/
│   │   ├── start/
│   │   │   └── page.tsx (fix mock data, add transaction)
│   │   └── arena/
│   │       └── page.tsx (fix image display)
lib/
├── jetton-transfer.ts (existing - will be used)
├── jetton-utils.ts (existing - will be used)
└── stake-storage.ts (existing - will be enhanced)
```

## Components and Interfaces

### 1. Battle Start Page Enhancement

**File:** `app/battle/[id]/start/page.tsx`

**Changes Required:**
- Remove mock data constants (`mockBeast`, `mockOpponent`)
- Add battle data fetching from API
- Add real user balance fetching
- Implement blockchain transaction for stake
- Store transaction hash in database

**New Interfaces:**

```typescript
interface BattleData {
  id: string
  player1_id: string
  player2_id: string
  beast1_id: number
  beast2_id: number
  beast1: Beast
  beast2: Beast
  player1: User
  player2: User
  bet_amount: number
  status: string
}

interface StakeTransaction {
  battle_id: string
  player_id: string
  amount: number
  transaction_hash: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}
```

**API Integration:**
- `GET /api/battles?battle_id={id}` - Fetch battle details with beasts
- `GET /api/users?wallet_address={address}` - Get current user
- `POST /api/battles/stake` - Record stake transaction (new endpoint)

### 2. Blockchain Transaction Implementation

**Transaction Flow:**
1. User confirms stake amount
2. Fetch user's RISE jetton wallet using `fetchRiseJettonWallet()`
3. Initiate jetton transfer using `sendJettonTransfer()`
4. Wait for transaction confirmation
5. Store transaction hash in database
6. Redirect to arena

**Transaction Parameters:**
- **From:** User's jetton wallet
- **To:** Battle contract or escrow address
- **Amount:** Stake amount in RISE tokens
- **Forward TON:** 0.05 TON for gas

**Error Handling:**
- Transaction rejected by user → show error, stay on page
- Insufficient balance → prevent transaction, show error
- Network error → retry mechanism with timeout
- Transaction failed → show error, allow retry

### 3. Beast Image Display

**File:** `app/battle/[id]/arena/page.tsx`

**Changes Required:**
- Replace emoji fallbacks with actual images
- Add image loading states
- Implement error handling for failed image loads
- Add default placeholder for missing images

**Image Component:**

```typescript
interface BeastImageProps {
  imageUrl?: string
  beastName: string
  size?: 'sm' | 'md' | 'lg'
}

function BeastImage({ imageUrl, beastName, size = 'md' }: BeastImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  if (!imageUrl || imageError) {
    return <DefaultBeastPlaceholder name={beastName} size={size} />
  }
  
  return (
    <img
      src={imageUrl}
      alt={beastName}
      onLoad={() => setIsLoading(false)}
      onError={() => setImageError(true)}
      className={/* size-based classes */}
    />
  )
}
```

## Data Models

### Stake Transaction Table

New table needed in database:

```sql
CREATE TABLE stake_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  battle_id UUID REFERENCES battles(id) NOT NULL,
  player_id UUID REFERENCES users(id) NOT NULL,
  amount DECIMAL NOT NULL,
  transaction_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stake_transactions_battle ON stake_transactions(battle_id);
CREATE INDEX idx_stake_transactions_player ON stake_transactions(player_id);
```

### Enhanced Battle Model

Add transaction tracking to battles:

```typescript
interface Battle {
  id: string
  player1_id: string
  player2_id: string
  beast1_id: number
  beast2_id: number
  bet_amount: number
  player1_stake_tx?: string  // Transaction hash
  player2_stake_tx?: string  // Transaction hash
  status: string
  winner_id: string | null
  // ... existing fields
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

Analyzing the prework for redundancy:

**Requirement 1 (Real Battle Data):**
- 1.1, 1.2, 1.3 all test that battle data is fetched and displayed correctly
- These can be combined into a single comprehensive property about battle data display
- 1.4 is distinct (opponent identification)
- 1.5 is an edge case

**Requirement 2 (Blockchain Transactions):**
- 2.1 and 2.2 both test transaction initiation but different aspects (creation vs UI feedback)
- Can be combined into one property
- 2.3 is distinct (database persistence)
- 2.4 is an edge case
- 2.5 is distinct (validation)

**Requirement 3 (Beast Images):**
- 3.1 and 3.2 both test image display for different beasts
- Can be combined into one property
- 3.3 and 3.4 are edge cases
- 3.5 is not testable

**Consolidated Properties:**

Property 1: Battle data fetching and display
*For any* valid battle ID, when navigating to the start page, the system should fetch battle data from the API and display both player and opponent beast information (name, level, type) correctly
**Validates: Requirements 1.1, 1.2, 1.3**

Property 2: Opponent identification display
*For any* battle with a real player opponent, the system should display the opponent's username or wallet address
**Validates: Requirements 1.4**

Property 3: Transaction initiation and status
*For any* stake confirmation, the system should initiate a blockchain transaction and display its status to the user
**Validates: Requirements 2.1, 2.2**

Property 4: Transaction persistence
*For any* successfully completed transaction, querying the database should return the transaction hash
**Validates: Requirements 2.3**

Property 5: Arena entry validation
*For any* attempt to enter the arena, if no completed transaction exists, the system should redirect to the stake page
**Validates: Requirements 2.5**

Property 6: Beast image display
*For any* battle arena load where beasts have valid image URLs, the system should display those images correctly
**Validates: Requirements 3.1, 3.2**

## Error Handling

### Battle Data Loading Errors

1. **Battle Not Found**
   - Display: "Battle not found" error message
   - Action: Redirect to battle selection page
   - Log: Error details for debugging

2. **API Connection Failure**
   - Display: "Unable to load battle data" with retry button
   - Action: Allow manual retry
   - Fallback: Show loading state, timeout after 10 seconds

3. **Invalid Battle State**
   - Display: "This battle is no longer available"
   - Action: Redirect to battle selection
   - Log: Battle status for investigation

### Transaction Errors

1. **User Rejection**
   - Display: "Transaction cancelled by user"
   - Action: Stay on stake page, allow retry
   - No logging needed (user action)

2. **Insufficient Balance**
   - Display: "Insufficient RISE balance"
   - Action: Prevent transaction, show current balance
   - Suggest: Link to swap page to get more RISE

3. **Network/Blockchain Error**
   - Display: "Transaction failed. Please try again."
   - Action: Allow retry with exponential backoff
   - Log: Error details for debugging
   - Timeout: 30 seconds per attempt, max 3 attempts

4. **Transaction Timeout**
   - Display: "Transaction is taking longer than expected"
   - Action: Show status check button
   - Fallback: Manual verification via transaction hash

### Image Loading Errors

1. **Missing Image URL**
   - Display: Default placeholder with beast type icon
   - Fallback: Use type-based color scheme
   - No error message (graceful degradation)

2. **Image Load Failure**
   - Display: Placeholder with beast name initial
   - Retry: Attempt reload once after 2 seconds
   - Log: Failed URL for investigation

3. **Slow Image Loading**
   - Display: Loading skeleton/spinner
   - Timeout: 5 seconds, then show placeholder
   - Progressive: Show low-res version if available

## Testing Strategy

### Unit Tests

**Battle Data Fetching:**
- Test API call with valid battle ID
- Test response parsing and state updates
- Test error handling for failed API calls
- Test loading states during fetch

**Transaction Flow:**
- Test transaction parameter construction
- Test transaction status updates
- Test database persistence after success
- Test error handling for various failure modes

**Image Display:**
- Test image component with valid URL
- Test placeholder rendering
- Test error state handling
- Test loading state display

### Property-Based Tests

Property-based tests will use `@fast-check/vitest` for TypeScript/React testing. Each test will run a minimum of 100 iterations.

**Property 1: Battle data display**
- Generate random battle data with various beast configurations
- Verify all beast properties are correctly displayed
- Tag: **Feature: pvp-battle-critical-fixes, Property 1: Battle data fetching and display**

**Property 3: Transaction initiation**
- Generate random stake amounts and user states
- Verify transaction is created with correct parameters
- Verify UI shows transaction status
- Tag: **Feature: pvp-battle-critical-fixes, Property 3: Transaction initiation and status**

**Property 4: Transaction persistence**
- Generate random successful transactions
- Verify database contains transaction hash
- Tag: **Feature: pvp-battle-critical-fixes, Property 4: Transaction persistence**

**Property 5: Arena entry validation**
- Generate random arena entry attempts with/without transactions
- Verify redirect behavior is correct
- Tag: **Feature: pvp-battle-critical-fixes, Property 5: Arena entry validation**

**Property 6: Beast image display**
- Generate random beasts with various image URL states
- Verify correct image or placeholder is shown
- Tag: **Feature: pvp-battle-critical-fixes, Property 6: Beast image display**

### Integration Tests

- Full flow: Navigate to start → fetch data → confirm stake → create transaction → enter arena
- Test with real API calls (mocked Supabase)
- Test transaction flow with mocked TonConnect
- Test image loading with various network conditions

### Manual Testing Checklist

- [ ] Test with real battle IDs from database
- [ ] Test transaction flow on testnet
- [ ] Test with various beast image URLs
- [ ] Test error scenarios (no internet, rejected transaction)
- [ ] Test on mobile devices
- [ ] Verify transaction hashes in blockchain explorer
- [ ] Test with different wallet balances

## Implementation Notes

### Battle Data API

The existing `/api/battles?battle_id={id}` endpoint already returns beast data with the correct structure:

```typescript
{
  battle: {
    id: string,
    beast1: { id, name, level, traits, image_url, ... },
    beast2: { id, name, level, traits, image_url, ... },
    player1: { id, username, wallet_address },
    player2: { id, username, wallet_address },
    ...
  }
}
```

We just need to use this data instead of mock constants.

### Transaction Implementation

Use existing `sendJettonTransfer()` function from `lib/jetton-transfer.ts`:

```typescript
await sendJettonTransfer({
  tonConnectUI,
  jettonWalletAddress: userJettonWallet,
  destinationAddress: BATTLE_ESCROW_ADDRESS,
  amount: stakeAmount,
  jettonDecimals: 9,
  forwardTonAmount: '0.05',
  senderAddress: address
})
```

**Note:** Need to define `BATTLE_ESCROW_ADDRESS` - the contract that holds stakes.

### Image Display

Replace emoji fallbacks with:

```tsx
{myBeast.image_url ? (
  <img 
    src={myBeast.image_url} 
    alt={myBeast.name}
    className="w-32 h-32 object-cover rounded-lg"
    onError={(e) => {
      e.currentTarget.src = '/placeholder-beast.png'
    }}
  />
) : (
  <div className="w-32 h-32 bg-primary/20 rounded-lg flex items-center justify-center">
    <span className="text-4xl">{getTypeEmoji(myBeast.traits?.type)}</span>
  </div>
)}
```

### Session Storage Enhancement

Current stake storage only saves amount and battle ID. Enhance to include transaction hash:

```typescript
interface StakeData {
  amount: number
  battleId: string
  timestamp: number
  transactionHash?: string  // Add this
  status: 'pending' | 'completed'  // Add this
}
```

## Dependencies

- **@ton/core**: Already present for blockchain interactions
- **@tonconnect/ui-react**: Already present for wallet connection
- **@fast-check/vitest**: For property-based testing (may need installation)
- **Supabase**: Already present for database operations

## Performance Considerations

1. **Battle Data Loading**
   - Cache battle data in component state
   - Avoid refetching on component remount
   - Use SWR or React Query for better caching (optional enhancement)

2. **Transaction Processing**
   - Show immediate UI feedback
   - Don't block UI during transaction
   - Use optimistic updates where appropriate

3. **Image Loading**
   - Lazy load images below the fold
   - Use appropriate image sizes (don't load 4K images for 128px display)
   - Consider WebP format for better compression
   - Implement image CDN if many users (future enhancement)

## Security Considerations

1. **Transaction Validation**
   - Verify transaction hash on backend
   - Don't trust client-side transaction status
   - Validate stake amount matches battle record

2. **Battle Access Control**
   - Verify user is participant in battle
   - Prevent unauthorized arena access
   - Validate battle state before allowing actions

3. **Image URLs**
   - Sanitize image URLs to prevent XSS
   - Use Content Security Policy for image sources
   - Validate image URLs are from trusted domains

## Database Migration

New table for stake transactions:

```sql
-- Create stake_transactions table
CREATE TABLE IF NOT EXISTS stake_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  battle_id UUID REFERENCES battles(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(20, 9) NOT NULL,
  transaction_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_stake_transactions_battle ON stake_transactions(battle_id);
CREATE INDEX idx_stake_transactions_player ON stake_transactions(player_id);
CREATE INDEX idx_stake_transactions_hash ON stake_transactions(transaction_hash);

-- Add columns to battles table
ALTER TABLE battles 
ADD COLUMN IF NOT EXISTS player1_stake_tx TEXT,
ADD COLUMN IF NOT EXISTS player2_stake_tx TEXT;
```

## API Endpoints

### New Endpoint: POST /api/battles/stake

Records a stake transaction:

```typescript
// Request
{
  battle_id: string
  player_id: string
  amount: number
  transaction_hash: string
}

// Response
{
  success: boolean
  stake_transaction: StakeTransaction
}
```

### Enhanced Endpoint: GET /api/battles?battle_id={id}

Already exists, no changes needed. Returns full battle data with beasts and players.
