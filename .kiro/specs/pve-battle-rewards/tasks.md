# Implementation Plan: PVE Battle Rewards System

- [x] 1. Update database schema for PVE battles




  - Add battle_type column to battles table
  - Add enemy_id column to battles table
  - Add reward_amount and reward_status columns
  - Create database indexes
  - _Requirements: 1.2, 4.5, 5.1_






- [x] 2. Implement battle initialization logic



  - [ ] 2.1 Create PVE battle creation function

    - Validate beast and enemy selections
    - Create battle record with battle_type='pve'
    - Initialize HP values to max_hp
    - Return battle ID
    - _Requirements: 1.2, 1.5_

  - [x]* 2.2 Write property test for battle record creation






    - **Property 1: Battle record creation**



    - **Validates: Requirements 1.2**

  - [x]* 2.3 Write property test for battle initialization


    - **Property 2: Battle initialization**
    - **Validates: Requirements 1.5**

- [ ] 3. Implement battle combat logic


  - [-] 3.1 Create damage calculation function




    - Calculate damage from beast stats and move power
    - Apply defense modifiers
    - Return damage value
    - _Requirements: 2.2_

  - [ ]* 3.2 Write property test for damage calculation
    - **Property 3: Damage calculation**






    - **Validates: Requirements 2.2**




  - [ ] 3.3 Create HP reduction function


    - Reduce HP by damage amount
    - Ensure HP doesn't go below zero
    - Return new HP value
    - _Requirements: 2.3_


  - [ ]* 3.4 Write property test for HP reduction
    - **Property 4: HP reduction**
    - **Validates: Requirements 2.3**




  - [ ] 3.5 Create turn management function

    - Switch between player and enemy turns
    - Track current turn state

    - _Requirements: 2.4_








  - [ ]* 3.6 Write property test for turn switching
    - **Property 5: Turn switching**
    - **Validates: Requirements 2.4**

- [ ] 4. Implement win/loss condition logic

  - [ ] 4.1 Create win condition checker




    - Check if enemy HP is zero
    - Declare player as winner
    - _Requirements: 3.1_


  - [ ]* 4.2 Write property test for player win condition
    - **Property 6: Player win condition**



    - **Validates: Requirements 3.1**

  - [ ] 4.3 Create loss condition checker

    - Check if player HP is zero

    - Declare enemy as winner




    - _Requirements: 3.2_



  - [ ]* 4.4 Write property test for player loss condition
    - **Property 7: Player loss condition**
    - **Validates: Requirements 3.2**

  - [ ] 4.5 Create battle completion handler

    - Update battle status to "completed"
    - Record winner
    - _Requirements: 3.3_

  - [ ]* 4.6 Write property test for battle completion status
    - **Property 8: Battle completion status**
    - **Validates: Requirements 3.3**

- [ ] 5. Implement reward calculation and distribution

  - [ ] 5.1 Create reward calculation function




    - Return 200 RISE for wins
    - Return 0 RISE for losses


    - _Requirements: 4.1, 4.4_

  - [ ]* 5.2 Write property test for win reward amount
    - **Property 9: Win reward amount**
    - **Validates: Requirements 4.1**

  - [ ]* 5.3 Write property test for loss no reward
    - **Property 10: Loss no reward**
    - **Validates: Requirements 4.4**

  - [x] 5.4 Create reward recording function




    - Store reward amount in database
    - Update reward_status
    - _Requirements: 4.5, 5.1_


  - [ ]* 5.5 Write property test for reward recording
    - **Property 11: Reward recording**
    - **Validates: Requirements 4.5, 5.1**

- [ ] 6. Create API route for PVE battle creation

  - Implement POST /api/battles/pve endpoint
  - Validate player, beast, and enemy
  - Create battle record
  - Return battle ID
  - _Requirements: 1.2_

- [ ] 7. Create API route for battle completion

  - [ ] 7.1 Implement POST /api/battles/[id]/complete endpoint

    - Validate battle exists
    - Validate player is participant
    - Validate battle status
    - Validate winner
    - Calculate and award reward
    - Update battle record
    - _Requirements: 3.3, 4.1, 4.2, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 7.2 Write property test for battle existence validation
    - **Property 14: Battle existence validation**
    - **Validates: Requirements 6.1**

  - [ ]* 7.3 Write property test for player participation validation
    - **Property 15: Player participation validation**
    - **Validates: Requirements 6.2**

  - [ ]* 7.4 Write property test for battle completion validation
    - **Property 16: Battle completion validation**
    - **Validates: Requirements 6.3**

  - [ ]* 7.5 Write property test for winner validation
    - **Property 17: Winner validation**
    - **Validates: Requirements 6.4**

- [ ] 8. Create API route for battle history

  - [ ] 8.1 Implement GET /api/battles/history endpoint

    - Query battles by player ID
    - Filter for PVE battles
    - Order by created_at descending
    - Include enemy name, outcome, reward
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ]* 8.2 Write property test for history display completeness
    - **Property 12: History display completeness**
    - **Validates: Requirements 5.3**

  - [ ]* 8.3 Write property test for history ordering
    - **Property 13: History ordering**
    - **Validates: Requirements 5.4**

- [ ] 9. Update battle page UI

  - Update beast and enemy selection to work with PVE
  - Wire "Start Battle" button to PVE battle creation
  - Navigate to battle arena after creation
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 10. Update battle arena UI



  - Display beast and enemy stats
  - Show available moves during player turn
  - Execute AI moves during enemy turn
  - Display battle outcome when complete
  - Show reward notification for wins
  - _Requirements: 1.4, 2.1, 2.5, 3.4, 3.5, 4.3_



- [ ] 11. Integrate RISE token transfer (mock for now)

  - Add RISE transfer logic to completion endpoint
  - Log transfer details
  - Handle transfer failures gracefully
  - Mark battles as "reward_pending" on failure


  - _Requirements: 4.2, 6.5_

- [ ] 12. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.
