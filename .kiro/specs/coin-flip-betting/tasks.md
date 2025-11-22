# Implementation Plan: Coin Flip Betting Game

- [x] 1. Set up database schema and types





  - Create `coin_flips` table migration
  - Add TypeScript interface for CoinFlip type





  - Create database indexes for performance


  - _Requirements: 5.1, 6.3_

- [ ] 2. Implement core betting logic and validation

  - [x] 2.1 Create bet amount validation function




    - Validate amount is greater than zero
    - Check against wallet balance
    - Return appropriate error messages


    - _Requirements: 2.3, 2.4_

  - [ ]* 2.2 Write property test for bet validation
    - **Property 1: Bet amount validation**
    - **Validates: Requirements 2.3**



  - [ ] 2.3 Create random result generation function

    - Use cryptographically secure random number generator
    - Return 'heads' or 'tails'
    - _Requirements: 6.1, 6.2_





  - [ ]* 2.4 Write property test for result validity
    - **Property 2: Random result validity**
    - **Validates: Requirements 3.4**

  - [ ]* 2.5 Write property test for result distribution
    - **Property 3: Random result distribution**
    - **Validates: Requirements 6.1, 6.2**









  - [ ] 2.6 Create payout calculation function

    - Calculate 2x bet amount for wins
    - Return 0 for losses
    - _Requirements: 4.1_

  - [ ]* 2.7 Write property test for payout calculation
    - **Property 4: Payout calculation**
    - **Validates: Requirements 4.1**

  - [ ] 2.8 Create win condition checker

    - Compare user choice with result
    - Return boolean win status
    - _Requirements: 3.5, 4.4_

  - [ ]* 2.9 Write property test for win condition
    - **Property 5: Win condition**
    - **Validates: Requirements 3.5, 4.4**

- [-] 3. Create API route for coin flip execution



  - [ ] 3.1 Implement POST /api/bets/flip endpoint

    - Validate request parameters
    - Verify TON transaction
    - Generate random result
    - Calculate payout
    - Store flip record in database
    - Return result to client
    - _Requirements: 3.2, 4.1, 4.5, 5.1_

  - [ ]* 3.2 Write property test for database record completeness
    - **Property 6: Database record completeness**
    - **Validates: Requirements 5.1**

  - [ ]* 3.3 Write property test for timestamp recording
    - **Property 9: Timestamp recording**
    - **Validates: Requirements 6.3**

  - [ ]* 3.4 Write property test for failed transaction safety
    - **Property 10: Failed transaction safety**
    - **Validates: Requirements 6.4**

  - [ ]* 3.5 Write unit tests for flip endpoint
    - Test successful flip flow
    - Test validation errors
    - Test transaction verification
    - _Requirements: 3.2, 4.1, 4.5_

- [x] 4. Create API route for betting history





  - [x] 4.1 Implement GET /api/bets/history endpoint


    - Query flips by wallet address
    - Order by created_at descending
    - Return formatted history
    - _Requirements: 5.2, 5.4_

  - [ ]* 4.2 Write property test for history ordering
    - **Property 7: History ordering**
    - **Validates: Requirements 5.4**







  - [x]* 4.3 Write property test for history display completeness


    - **Property 8: History display completeness**
    - **Validates: Requirements 5.3**



- [ ] 5. Build betting page UI

  - [ ] 5.1 Create /bets page component





    - Add wallet connection check
    - Create bet amount input field
    - Add heads/tails selection buttons



    - Add flip button
    - Display current wallet balance

    - _Requirements: 1.3, 2.1, 2.2, 2.5_



  - [ ] 5.2 Implement coin flip animation component

    - Create animated coin flip visual
    - Show result after animation

    - Display win/loss message

    - _Requirements: 3.3, 3.4, 3.5, 4.3, 4.4_

  - [ ] 5.3 Add betting history display

    - Fetch and display user's flip history
    - Show bet amount, choice, result, outcome
    - Handle empty history state
    - _Requirements: 5.2, 5.3, 5.5_

  - [ ] 5.4 Implement form validation and error handling

    - Show validation errors inline
    - Display transaction errors
    - Handle network errors
    - _Requirements: 2.3, 2.4, 6.4, 6.5_

- [ ] 6. Add navigation link

  - Update navbar component to include "BETS" link
  - Add link to both desktop and mobile navigation
  - Highlight active state when on /bets route
  - _Requirements: 1.1, 1.2_

- [ ] 7. Integrate TON transaction handling

  - [ ] 7.1 Implement TON payment flow

    - Create transaction with bet amount
    - Wait for confirmation
    - Pass transaction hash to API
    - _Requirements: 3.1_

  - [ ] 7.2 Add transaction error handling

    - Handle user rejection
    - Handle insufficient balance
    - Handle network errors
    - _Requirements: 6.4_

- [ ] 8. Integrate RISE token transfer (mock for now)

  - Add RISE transfer logic to flip endpoint
  - Log transfer details
  - Handle transfer failures gracefully
  - _Requirements: 4.2, 6.5_

- [ ] 9. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.
