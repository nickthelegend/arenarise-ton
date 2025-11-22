# Implementation Plan: PVE Battle UX Improvements

- [x] 1. Create utility functions for enemy selection and jetton transfers







-

  - [x] 1.1 Create enemy selection utility function



    - Implement `selectRandomEnemy` function in `lib/enemy-utils.ts`
    - Handle empty enemy list case
    - Return null if no enemies available
    - _Requirements: 1.1, 1.4_

  - [ ]* 1.2 Write property test for automatic enemy selection
    - **Property 1: Automatic enemy selection**
    - **Validates: Requirements 1.1, 6.2**

  - [ ]* 1.3 Write property test for uniform random distribution
    - **Property 4: Uniform random distribution**
    - **Validates: Requirements 1.4**


  - [x] 1.4 Create jetton transfer utility function

    - Implement `sendJettonTransfer` function in `lib/jetton-transfer.ts`
    - Build TEP-74 compliant payload with op code 0xf8a7ea5
    - Convert amounts to smallest units using 9 decimals
    - Include forward TON amount of 0.05
    - Handle transfer errors
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3_

  - [ ]* 1.5 Write property test for decimal conversion accuracy
    - **Property 11: Decimal conversion accuracy**
    - **Validates: Requirements 3.3, 4.3**

  - [ ]* 1.6 Write property test for TEP-74 op code
    - **Property 12: TEP-74 op code**
    - **Validates: Requirements 3.4**

  - [ ]* 1.7 Write property test for forward TON amount
    - **Property 14: Forward TON amount**
    - **Validates: Requirements 4.1**

  - [x] 1.8 Create stake validation utility function


    - Implement validation for stake amount > 0
    - Validate wallet connection
    - Validate jetton wallet address
    - Return validation errors
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 1.9 Write property test for positive stake validation
    - **Property 17: Positive stake validation**
    - **Validates: Requirements 5.1**

  - [ ]* 1.10 Write property test for wallet connection validation
    - **Property 18: Wallet connection validation**
    - **Validates: Requirements 5.2**
-

- [x] 2. Update battle page to remove enemy selection UI








-

  - [x] 2.1 Remove enemy selection UI components






    - Remove "Choose Your Enemy" section from battle page
    - Remove enemy selection grid
    - Remove enemy card click handlers
    - Remove `selectedEnemy` state
    - _Requirements: 6.1, 6.5_

  - [ ]* 2.2 Write property test for no enemy selection UI
    - **Property 22: No enemy selection UI**
    - **Validates: Requirements 6.1, 6.5**

  - [x] 2.3 Implement automatic enemy assignment






    - Call `selectRandomEnemy` when beast is selected
    - Store auto-matched enemy in state
    - Display auto-matched enemy (read-only)
    - _Requirements: 1.1, 1.2, 6.2_

  - [ ]* 2.4 Write property test for enemy display after selection
    - **Property 2: Enemy display after selection**
    - **Validates: Requirements 1.2**

  - [ ]* 2.5 Write property test for clean battle setup display
    - **Property 23: Clean battle setup display**
    - **Validates: Requirements 6.3**
-

- [x] 3. Add stake input and jetton transfer to battle page





  - [x] 3.1 Add stake input UI






    - Add stake amount input field
    - Add stake button
    - Display validation errors
    - _Requirements: 3.1, 5.1_
-

  - [x] 3.2 Implement stake flow





    - Validate stake inputs
    - Call jetton transfer function
    - Handle transfer success/failure
    - Display error messages
    - _Requirements: 3.1, 3.5, 4.4, 5.4, 5.5_

  - [ ]* 3.3 Write property test for correct stake destination address
    - **Property 9: Correct stake destination address**
    - **Validates: Requirements 3.1, 4.2**

  - [ ]* 3.4 Write property test for transfer error handling
    - **Property 15: Transfer error handling**
    - **Validates: Requirements 4.4**

  - [ ]* 3.5 Write property test for validation failure prevents transfer
    - **Property 20: Validation failure prevents transfer**
    - **Validates: Requirements 5.4**
-

- [x] 4. Update battle creation to use PVE route




  - [x] 4.1 Modify battle creation navigation






    - Change navigation from `/battle/arena/${id}` to `/battle/pve/${id}`
    - Pass battle ID to PVE route
    - _Requirements: 2.1_

  - [ ]* 4.2 Write property test for PVE route navigation
    - **Property 5: PVE route navigation**
    - **Validates: Requirements 2.1**
-

  - [x] 4.3 Update battle creation to include stake amount






    - Pass stake amount to battle creation API
    - Store stake amount in battle record
    - _Requirements: 4.5_

  - [ ]* 4.4 Write property test for battle creation with selected enemy
    - **Property 3: Battle creation with selected enemy**
    - **Validates: Requirements 1.3**

  - [ ]* 4.5 Write property test for stake amount persistence
    - **Property 16: Stake amount persistence**
    - **Validates: Requirements 4.5**
-

- [x] 5. Create PVE arena page





  - [x] 5.1 Create new PVE arena page component







    - Create `app/battle/pve/[id]/page.tsx`
    - Copy structure from existing arena page
    - Modify to handle enemy data instead of opponent beast
    - Fetch battle data from database
    - Fetch enemy data from enemies API
    - Display player beast and enemy
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ]* 5.2 Write property test for combatant data display
    - **Property 6: Combatant data display**
    - **Validates: Requirements 2.2, 2.4**

  - [ ]* 5.3 Write property test for real data fetching
    - **Property 7: Real data fetching**
    - **Validates: Requirements 2.3**
-

  - [x] 5.4 Implement PVE battle logic





    - Handle player move selection
    - Execute AI enemy moves
    - Update HP for both combatants
    - Determine winner
    - Display battle outcome
    - _Requirements: 2.2, 2.5_

  - [ ]* 5.5 Write property test for no navigation on completion
    - **Property 8: No navigation on completion**
    - **Validates: Requirements 2.5**
-

  - [x] 5.6 Add reward display





    - Show reward amount when battle completes
    - Display stake amount if applicable
    - _Requirements: 2.2_
-

- [x] 6. Update API route to handle stake amounts






-

  - [x] 6.1 Modify `/api/battles/pve` endpoint


    - Accept optional `stake_amount` parameter
    - Store stake amount in battle record using `bet_amount` field
    - Validate stake amount if provided
    - _Requirements: 4.5, 5.1_

  - [ ]* 6.2 Write property test for jetton wallet as sender
    - **Property 10: Jetton wallet as sender**
    - **Validates: Requirements 3.2**

  - [ ]* 6.3 Write property test for battle creation after transfer
    - **Property 13: Battle creation after transfer**
    - **Validates: Requirements 3.5**
-

- [x] 7. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.
