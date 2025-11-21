# Implementation Plan

- [x] 1. Set up database schema and constants





  - Create `swap_transactions` table in Supabase with proper indexes
  - Add RISE exchange rate constants to `lib/constants.ts`
  - Add TypeScript interfaces for swap-related data types
  - _Requirements: 5.1, 5.2, 5.3_
-

- [ ] 2. Implement core swap calculation and validation logic

  - [x] 2.1 Create utility functions for exchange rate calculation and input validation








    - Write `calculateRiseAmount(tonAmount: number): number` function
    - Write `validateSwapAmount(amount: string): boolean` function
    - Write `formatTokenAmount(amount: number, decimals: number): string` function
    - _Requirements: 1.2, 2.2, 2.3, 1.4_

  - [ ]* 2.2 Write property test for exchange rate calculation
    - **Property 1: Exchange rate calculation consistency**
    - **Validates: Requirements 1.2**

  - [ ]* 2.3 Write property test for input validation
    - **Property 2: Input validation rejects invalid amounts**
    - **Validates: Requirements 2.2, 2.3**

  - [ ]* 2.4 Write property test for valid input button state
    - **Property 3: Valid input enables swap button**
    - **Validates: Requirements 2.4**
-

- [x] 3. Implement TON payment transaction flow




-

  - [x] 3.1 Create payment transaction handler using TonConnect




    - Implement `sendTonPayment(amount: string)` function
    - Add transaction state management (idle, pending, success, error)
    - Handle user rejection and transaction errors
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 3.2 Write property test for transaction address consistency
    - **Property 4: Transaction target address consistency**
    - **Validates: Requirements 3.1**

  - [ ]* 3.3 Write property test for transaction amount matching
    - **Property 5: Transaction amount matches user input**
    - **Validates: Requirements 3.2**

- [ ] 4. Implement backend API integration for RISE token transfer

  - [x] 4.1 Create backend API client function








    - Implement `requestRiseTokens(walletAddress: string, riseAmount: number)` function
    - Add error handling for API failures
    - Add retry logic with exponential backoff
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 4.2 Write property test for API request data
    - **Property 6: Backend API request contains required data**
    - **Validates: Requirements 4.2**

  - [ ]* 4.3 Write unit tests for API error handling
    - Test 5xx errors show retry option
    - Test 4xx errors show generic error
    - Test network timeout triggers retry
    - _Requirements: 4.4_
-

- [x] 5. Create database API endpoint for transaction history



  - [x] 5.1 Implement `/api/swap/history` endpoint







    - Create GET endpoint to fetch transactions by wallet address
    - Create POST endpoint to record new swap transactions
    - Add proper error handling and validation
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [ ]* 5.2 Write unit tests for history endpoint
    - Test fetching transactions for specific wallet
    - Test recording new transactions
    - Test empty history returns empty array
    - _Requirements: 5.1, 5.4_
-

- [x] 6. Build swap page UI components




  - [x] 6.1 Update swap page with real transaction flow







    - Replace mock data with real wallet connection check
    - Implement TON amount input with validation
    - Add RISE amount calculation display
    - Show exchange rate (1 TON = 3000 RISE)
    - Display user's TON balance
    - _Requirements: 1.1, 1.2, 2.1, 2.5, 6.1, 6.2, 6.3_

  - [x] 6.2 Implement swap button with state management


    - Enable/disable based on validation
    - Show loading state during transaction
    - Handle success and error states
    - _Requirements: 2.4, 3.3, 3.4_

  - [ ]* 6.3 Write property test for wallet address display
    - **Property 9: Connected wallet address is displayed**
    - **Validates: Requirements 6.4**
-

- [ ] 7. Implement transaction history UI

  - [x] 7.1 Create transaction history component








    - Fetch and display recent transactions on page load
    - Show TON amount, RISE amount, timestamp, and status for each transaction
    - Display empty state when no transactions exist
    - Add loading state while fetching
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 7.2 Write property test for transaction history display
    - **Property 7: Transaction history displays all required fields**
    - **Validates: Requirements 5.2, 5.3**

  - [ ]* 7.3 Write property test for history updates
    - **Property 8: Successful swap adds to history**
    - **Validates: Requirements 5.5**

- [x] 8. Integrate complete swap flow



-


  - [x] 8.1 Wire together payment and token transfer





    - Connect TON payment confirmation to backend API call
    - Update transaction status in database after each step
    - Display success message with received RISE amount
    - Update transaction history after successful swap
    - _Requirements: 4.1, 4.3, 4.5, 5.5_

  - [x] 8.2 Add comprehensive error handling







    - Handle payment failures gracefully
    - Handle backend API failures with retry
    - Handle partial failures (payment succeeded but transfer failed)
    - Log errors for debugging
    - _Requirements: 3.4, 4.4_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
