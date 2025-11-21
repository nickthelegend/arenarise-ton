# Design Document

## Overview

The RISE Token Swap feature enables users to purchase RISE jetton tokens by paying TON cryptocurrency at a fixed exchange rate of 1 TON = 3000 RISE. The system integrates with the existing ArenaRise backend service to facilitate secure token transfers after payment confirmation. The swap interface will be implemented on the existing `/swap` page, replacing the current mock implementation with real blockchain transactions.

## Architecture

The system follows a client-server architecture with three main components:

1. **Frontend Swap Interface** (`/app/swap/page.tsx`): React component that handles user input, wallet connection, and transaction initiation
2. **Backend Integration Layer**: Communicates with the hosted backend service at `arenarise-backend.vercel.app`
3. **TON Blockchain**: Handles payment transactions and jetton transfers

### Data Flow

1. User enters TON amount → Frontend calculates RISE amount (TON × 3000)
2. User confirms swap → Frontend initiates TON payment transaction to payment wallet
3. Payment confirmed → Frontend calls backend API `/api/send/rise` with user wallet and RISE amount
4. Backend transfers RISE jettons → User receives tokens in their wallet
5. Transaction recorded → Frontend displays success and updates history

## Components and Interfaces

### 1. Swap Page Component (`/app/swap/page.tsx`)

**State Management:**
```typescript
interface SwapState {
  tonAmount: string
  riseAmount: string
  isProcessing: boolean
  transactionStatus: 'idle' | 'payment-pending' | 'transfer-pending' | 'success' | 'error'
  errorMessage: string | null
}
```

**Key Functions:**
- `calculateRiseAmount(tonAmount: number): number` - Multiplies TON by 3000
- `handleSwap()` - Orchestrates the payment and token transfer flow
- `sendTonPayment(amount: string): Promise<void>` - Initiates TON transaction
- `requestRiseTokens(walletAddress: string, amount: number): Promise<void>` - Calls backend API

### 2. Backend API Integration

**Endpoint:** `POST https://arenarise-backend.vercel.app/api/send/rise`

**Request Format:**
```typescript
interface RiseTransferRequest {
  userWallet: string  // User's TON wallet address
  amount: number      // RISE amount in whole tokens (not decimals)
}
```

**Response Format:**
```typescript
interface RiseTransferResponse {
  success: boolean
  message: string
  fromWallet: string
  toWallet: string
  jettonAmount: string
  seqno: number
}
```

### 3. Transaction History Component

**Data Model:**
```typescript
interface SwapTransaction {
  id: string
  wallet_address: string
  ton_amount: string
  rise_amount: string
  status: 'pending' | 'completed' | 'failed'
  transaction_hash?: string
  created_at: string
}
```

**Storage:** Supabase table `swap_transactions`

## Data Models

### Swap Transactions Table

```sql
CREATE TABLE swap_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  ton_amount DECIMAL(18, 9) NOT NULL,
  rise_amount DECIMAL(18, 9) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_hash TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_swap_wallet ON swap_transactions(wallet_address);
CREATE INDEX idx_swap_created ON swap_transactions(created_at DESC);
```

### Constants

```typescript
// Add to lib/constants.ts
export const RISE_EXCHANGE_RATE = 3000  // 1 TON = 3000 RISE
export const RISE_JETTON_DECIMALS = 9   // Standard jetton decimals
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Exchange rate calculation consistency

*For any* valid TON amount input, the calculated RISE amount should equal TON amount × 3000
**Validates: Requirements 1.2**

### Property 2: Input validation rejects invalid amounts

*For any* input that is not a positive number (negative, zero, non-numeric, or empty), the validation function should return false and prevent the swap
**Validates: Requirements 2.2, 2.3**

### Property 3: Valid input enables swap button

*For any* positive numeric TON amount, the swap button should be enabled
**Validates: Requirements 2.4**

### Property 4: Transaction target address consistency

*For any* swap transaction, the payment destination address should always be 0QD77r9HUu7VXdz-l_pgzfDgJWdHKNgk45oza4QZ7Z1CyqUX
**Validates: Requirements 3.1**

### Property 5: Transaction amount matches user input

*For any* user-specified TON amount, the initiated transaction should have exactly that amount
**Validates: Requirements 3.2**

### Property 6: Backend API request contains required data

*For any* backend API call, the request payload should include both the user's wallet address and the calculated RISE amount
**Validates: Requirements 4.2**

### Property 7: Transaction history displays all required fields

*For any* transaction record in the history, the display should include TON amount, RISE amount, timestamp, and status
**Validates: Requirements 5.2, 5.3**

### Property 8: Successful swap adds to history

*For any* completed swap transaction, the transaction history list should grow by exactly one entry
**Validates: Requirements 5.5**

### Property 9: Connected wallet address is displayed

*For any* connected wallet, the wallet address should be visible in the swap interface
**Validates: Requirements 6.4**

## Error Handling

### Payment Transaction Errors

1. **User Rejection**: When user cancels the transaction in their wallet, return to idle state without error message
2. **Insufficient Balance**: Detect before transaction and display clear error message
3. **Network Errors**: Display retry option with exponential backoff
4. **Transaction Timeout**: After 5 minutes, mark as failed and allow retry

### Backend API Errors

1. **API Unavailable (5xx)**: Display "Service temporarily unavailable" with retry button
2. **Invalid Request (4xx)**: Log error details and display generic error to user
3. **Network Timeout**: Retry up to 3 times with exponential backoff
4. **Partial Failure**: If payment succeeded but token transfer failed, log transaction for manual resolution

### Validation Errors

1. **Invalid Amount**: Display inline error "Please enter a valid positive number"
2. **Zero Amount**: Display "Amount must be greater than zero"
3. **Insufficient TON Balance**: Display "Insufficient TON balance. You have X TON available"
4. **Wallet Not Connected**: Disable swap interface and show connection prompt

## Testing Strategy

### Unit Testing

The testing approach will use Vitest as the testing framework (already configured in the project).

**Unit Test Coverage:**

1. **Exchange Rate Calculation**
   - Test calculation with various TON amounts (0.1, 1, 10, 100)
   - Test decimal precision handling
   - Test edge cases (very small amounts, very large amounts)

2. **Input Validation**
   - Test positive numbers (valid)
   - Test negative numbers (invalid)
   - Test zero (invalid)
   - Test non-numeric strings (invalid)
   - Test empty input (invalid)

3. **Number Formatting**
   - Test decimal place formatting
   - Test thousand separators
   - Test very large numbers
   - Test very small decimals

4. **Transaction History Rendering**
   - Test with empty history
   - Test with single transaction
   - Test with multiple transactions
   - Test status display for each state

### Property-Based Testing

The testing approach will use **fast-check** as the property-based testing library (already available in the project dependencies).

**Property Test Configuration:**
- Each property test should run a minimum of 100 iterations
- Use appropriate generators for TON amounts (positive decimals with up to 9 decimal places)
- Use wallet address generators that produce valid TON address formats

**Property Test Coverage:**

1. **Property 1: Exchange rate calculation consistency**
   - Generator: Arbitrary positive decimal numbers (0.000000001 to 1000000)
   - Assertion: `calculateRiseAmount(tonAmount) === tonAmount * 3000`
   - Tag: `**Feature: rise-token-swap, Property 1: Exchange rate calculation consistency**`

2. **Property 2: Input validation rejects invalid amounts**
   - Generator: Union of negative numbers, zero, non-numeric strings, null, undefined
   - Assertion: `validateAmount(invalidInput) === false`
   - Tag: `**Feature: rise-token-swap, Property 2: Input validation rejects invalid amounts**`

3. **Property 3: Valid input enables swap button**
   - Generator: Arbitrary positive decimal numbers
   - Assertion: `isSwapButtonEnabled(validAmount) === true`
   - Tag: `**Feature: rise-token-swap, Property 3: Valid input enables swap button**`

4. **Property 4: Transaction target address consistency**
   - Generator: Arbitrary positive TON amounts
   - Assertion: `getTransactionAddress(amount) === PAYMENT_ADDRESS`
   - Tag: `**Feature: rise-token-swap, Property 4: Transaction target address consistency**`

5. **Property 5: Transaction amount matches user input**
   - Generator: Arbitrary positive TON amounts
   - Assertion: `getTransactionAmount(userInput) === userInput`
   - Tag: `**Feature: rise-token-swap, Property 5: Transaction amount matches user input**`

6. **Property 6: Backend API request contains required data**
   - Generator: Arbitrary wallet addresses and RISE amounts
   - Assertion: `apiRequest.userWallet !== undefined && apiRequest.amount !== undefined`
   - Tag: `**Feature: rise-token-swap, Property 6: Backend API request contains required data**`

7. **Property 7: Transaction history displays all required fields**
   - Generator: Arbitrary transaction records
   - Assertion: Transaction display includes tonAmount, riseAmount, timestamp, and status
   - Tag: `**Feature: rise-token-swap, Property 7: Transaction history displays all required fields**`

8. **Property 8: Successful swap adds to history**
   - Generator: Arbitrary swap transactions
   - Assertion: `historyAfterSwap.length === historyBeforeSwap.length + 1`
   - Tag: `**Feature: rise-token-swap, Property 8: Successful swap adds to history**`

9. **Property 9: Connected wallet address is displayed**
   - Generator: Arbitrary valid TON wallet addresses
   - Assertion: Rendered output contains the wallet address
   - Tag: `**Feature: rise-token-swap, Property 9: Connected wallet address is displayed**`

### Integration Testing

1. **End-to-End Swap Flow**
   - Mock TonConnect wallet connection
   - Mock TON payment transaction
   - Mock backend API response
   - Verify complete flow from input to success message

2. **Backend API Integration**
   - Test actual API endpoint with test wallet
   - Verify request/response format
   - Test error scenarios

3. **Transaction History Persistence**
   - Test database insertion after swap
   - Test history retrieval on page load
   - Test filtering by wallet address

## Implementation Notes

### TON Transaction Integration

Use the existing `@tonconnect/ui-react` library for transaction handling:

```typescript
import { useTonConnectUI } from '@tonconnect/ui-react'

const [tonConnectUI] = useTonConnectUI()

const sendTonPayment = async (amount: string) => {
  const tx = {
    validUntil: Math.floor(Date.now() / 1000) + 300,
    messages: [{
      address: PAYMENT_ADDRESS,
      amount: toNano(amount).toString()
    }]
  }
  
  await tonConnectUI.sendTransaction(tx)
}
```

### Backend API Call

```typescript
const requestRiseTokens = async (walletAddress: string, riseAmount: number) => {
  const response = await fetch(`${BACKEND_URL}/api/send/rise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userWallet: walletAddress,
      amount: riseAmount
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to transfer RISE tokens')
  }
  
  return await response.json()
}
```

### State Machine

The swap flow follows this state machine:

```
idle → payment-pending → transfer-pending → success
  ↓         ↓                  ↓
error ← error ← error
```

Each state should have clear UI feedback and appropriate actions available to the user.
