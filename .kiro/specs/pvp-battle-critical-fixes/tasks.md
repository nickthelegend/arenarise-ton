# Implementation Plan

- [x] 1. Create database migration for stake transactions





  - Create `stake_transactions` table with proper schema
  - Add indexes for performance (battle_id, player_id, transaction_hash)
  - Add stake transaction columns to battles table (player1_stake_tx, player2_stake_tx)
  - _Requirements: 2.3_

- [x] 2. Create stake transaction API endpoint




  - [x] 2.1 Implement POST /api/battles/stake endpoint







    - Accept battle_id, player_id, amount, transaction_hash
    - Validate all required fields
    - Insert stake transaction record into database
    - Update battles table with transaction hash
    - Return success response with transaction data
    - _Requirements: 2.3_

  - [ ]* 2.2 Write unit tests for stake API
    - Test successful stake recording
    - Test validation errors
    - Test database constraints
    - _Requirements: 2.3_
-

- [x] 3. Fix battle start page to use real data



-

  - [x] 3.1 Remove mock data and fetch real battle information






    - Remove mockBeast and mockOpponent constants
    - Add battle data fetching from /api/battles?battle_id={id}
    - Add loading state during fetch
    - Parse and display real beast1 and beast2 data
    - Display player names or wallet addresses
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
-

  - [x] 3.2 Fetch and display real user balance




    - Use fetchRiseBalance() to get actual token balance
    - Replace hardcoded userBalance with real data
    - Update balance display in UI
    - _Requirements: 2.1_
-

  - [x] 3.3 Add error handling for failed data loading





    - Handle API errors gracefully
    - Display error message if battle not found
    - Add retry button for network failures
    - Redirect to battle selection if battle invalid
    - _Requirements: 1.5_

  - [ ]* 3.4 Write property test for battle data display
    - **Property 1: Battle data fetching and display**
    - **Validates: Requirements 1.1, 1.2, 1.3**

  - [ ]* 3.5 Write property test for opponent identification
    - **Property 2: Opponent identification display**
    - **Validates: Requirements 1.4**

- [x] 4. Implement blockchain transaction for stakes




-

  - [x] 4.1 Add transaction initiation on stake confirmation





    - Fetch user's jetton wallet address using fetchRiseJettonWallet()
    - Call sendJettonTransfer() with stake parameters
    - Show transaction status UI (pending, confirming)
    - Handle transaction confirmation
    - _Requirements: 2.1, 2.2_

  - [x] 4.2 Store transaction hash in database







    - Call POST /api/battles/stake with transaction hash
    - Update stake data in session storage with transaction hash
    - Handle API errors
    - _Requirements: 2.3_
-

  - [x] 4.3 Add comprehensive transaction error handling





    - Handle user rejection (show message, allow retry)
    - Handle insufficient balance (prevent transaction, show error)
    - Handle network errors (retry with backoff)
    - Handle transaction timeout (show status check)
    - _Requirements: 2.4_

  - [ ]* 4.4 Write property test for transaction initiation
    - **Property 3: Transaction initiation and status**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 4.5 Write property test for transaction persistence
    - **Property 4: Transaction persistence**
    - **Validates: Requirements 2.3**
- [x] 5. Checkpoint - Ensure all tests pass




- [ ] 5. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.
-

- [x] 6. Fix beast image display in arena





  - [x] 6.1 Replace emoji fallbacks with actual images






    - Use beast.image_url for player beast
    - Use beast.image_url for opponent beast
    - Add proper img tags with styling
    - Ensure images are properly sized (responsive)
    - _Requirements: 3.1, 3.2, 3.5_

  - [x] 6.2 Implement image loading states and error handling






    - Add loading spinner while image loads
    - Add onError handler to show placeholder
    - Create default placeholder component for missing images
    - Use type-based fallback icons when no image
    - _Requirements: 3.3, 3.4_

  - [ ]* 6.3 Write property test for beast image display
    - **Property 6: Beast image display**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 6.4 Write unit tests for image component
    - Test image rendering with valid URL
    - Test placeholder rendering
    - Test error handling
    - Test loading states
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 7. Add arena entry validation




  - [x] 7.1 Implement transaction check before arena entry







    - Check for completed transaction in session storage
    - Verify transaction exists in database
    - Redirect to stake page if no transaction
    - Show loading state during validation
    - _Requirements: 2.5_

  - [ ]* 7.2 Write property test for arena entry validation
    - **Property 5: Arena entry validation**
    - **Validates: Requirements 2.5**
-

- [x] 8. Enhance stake storage with transaction data



  - [x] 8.1 Update StakeData interface





    - Add transactionHash field
    - Add status field (pending/completed)
    - Update setStakeData and getStakeData functions
    - _Requirements: 2.3_

  - [ ]* 8.2 Write unit tests for enhanced stake storage
    - Test storing transaction hash
    - Test retrieving transaction data
    - Test status updates
    - _Requirements: 2.3_
-

- [x] 9. Final integration and testing



  - [x] 9.1 Test complete flow end-to-end


    - Navigate to battle start page
    - Verify real data loads
    - Confirm stake and complete transaction
    - Enter arena and verify images display
    - _Requirements: All_

  - [x] 9.2 Add loading states and transitions







    - Smooth transitions between pages
    - Loading indicators for all async operations
    - Optimistic UI updates where appropriate
    - _Requirements: All_

  - [ ]* 9.3 Write integration tests
    - Test full flow with mocked APIs
    - Test transaction flow with mocked TonConnect
    - Test error scenarios
    - _Requirements: All_
-

- [x] 10. Final Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.
