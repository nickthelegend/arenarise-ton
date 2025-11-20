# Implementation Plan

- [x] 1. Restore retro 8-bit font styling






  - Update CSS to ensure retro font is applied consistently
  - Verify font-family declarations in globals.css
  - Check that all components use font-mono class where appropriate
  - Test font rendering across different browsers
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Implement beast-moves database relationship




-

  - [x] 2.1 Create beast_moves junction table migration





    - Add SQL migration for beast_moves table with beast_id, move_id, and slot columns
    - Add foreign key constraints to beasts and moves tables
    - Add indexes for performance
    - _Requirements: 3.1, 3.2_
-

  - [x] 2.2 Create API endpoint to assign default moves






    - Implement POST `/api/beasts/[id]/moves` endpoint
    - Select 4 random moves from moves table
    - Insert records into beast_moves table
    - Return assigned moves in response
    - _Requirements: 3.1, 3.2_

  - [x] 2.3 Write property test for move assignment





    - **Property 4: Battle moves assignment**
    - **Validates: Requirements 3.1, 3.2**
-

- [x] 3. Update beast creation API to assign moves



  - [x] 3.1 Modify `/api/create/beast` to call move assignment







    - After beast insertion, call move assignment logic
    - Handle errors if move assignment fails
    - Include assigned moves in API response
    - _Requirements: 2.3, 2.4, 3.1_

  - [ ]* 3.2 Write property test for beast creation with wallet
    - **Property 2: Beast creation with wallet**
    - **Validates: Requirements 2.4**

  - [ ]* 3.3 Write property test for combat stats extraction
    - **Property 3: Combat stats extraction**
    - **Validates: Requirements 2.5**






- [x] 4. Implement beast purchase flow



  - [ ] 4.1 Update purchase API to verify payment

    - Modify `/api/purchase/beast` to accept payment verification
    - Call backend `/api/send` with correct parameters
    - Update beast ownership in database


    - Handle transfer failures appropriately
    - _Requirements: 5.3, 5.4, 5.5_

  - [x] 4.2 Update create page purchase handler




    - Ensure payment amount is exactly 1 TON using toNano('1')
    - Verify payment address matches specification
    - Handle transaction confirmation
    - Display success state and redirect to inventory
    - _Requirements: 5.1, 5.2, 5.6_

  - [ ]* 4.3 Write property test for payment validation
    - **Property 6: Payment amount validation**
    - **Property 7: Payment address validation**
    - **Validates: Requirements 5.1, 5.2**

  - [ ]* 4.4 Write property test for ownership transfer
    - **Property 8: Ownership transfer**
    - **Validates: Requirements 5.5**
-

- [x] 5. Set PVP as default battle mode



  - [x] 5.1 Update battle page default tab







    - Change Tabs defaultValue from "pve" to "pvp"
    - Verify tab switching works correctly
    - Test that PVP content displays by default
    - _Requirements: 6.1, 6.2_

  - [ ]* 5.2 Write property test for PVP default
    - **Property 9: PVP default selection**
    - **Validates: Requirements 6.1**
-

- [ ] 6. Remove mock data and implement real data fetching

  - [-] 6.1 Create API endpoint to fetch user beasts


    - Implement GET `/api/beasts` with wallet_address query param
    - Query beasts table filtered by owner_address
    - Return array of beasts with all attributes
    - Handle empty results with empty array
    - _Requirements: 7.1, 7.3_

  - [ ] 6.2 Update battle page to fetch real beast data

    - Remove mockBeasts array
    - Add useEffect to fetch beasts from API
    - Update state management for loaded beasts
    - Display loading state while fetching
    - Show empty state if no beasts found
    - _Requirements: 7.1, 7.3_

  - [ ] 6.3 Create API endpoint to fetch enemies

    - Implement GET `/api/enemies` endpoint
    - Query enemies from database (or generate procedurally)
    - Return array of enemy data
    - _Requirements: 7.2_

  - [ ] 6.4 Update battle page to fetch real enemy data

    - Remove mockEnemies array
    - Add useEffect to fetch enemies from API
    - Update state management for loaded enemies
    - Display loading state while fetching
    - Show empty state if no enemies found
    - _Requirements: 7.2, 7.3_

  - [ ]* 6.5 Write property test for real data usage
    - **Property 10: Real data usage**
    - **Validates: Requirements 7.1, 7.2**

  - [ ]* 6.6 Write unit tests for API endpoints
    - Test `/api/beasts` returns correct data structure
    - Test `/api/beasts` filters by wallet address
    - Test `/api/enemies` returns enemy data
    - Test error handling for database failures
    - _Requirements: 7.1, 7.2, 7.4_

- [ ] 7. Update create page preview display

  - [ ] 7.1 Ensure all beast attributes are displayed

    - Verify name, description, and emoji/image display
    - Verify all combat stats (HP, Attack, Defense, Speed) display
    - Verify all trait badges render correctly
    - Verify purchase price displays as "1 TON"
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 7.2 Write property test for preview completeness
    - **Property 5: Preview data completeness**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 8. Add wallet connection validation to create page

  - [ ] 8.1 Implement redirect for non-connected wallets

    - Check wallet connection status on page load
    - Redirect to home page if not connected
    - Add toast notification explaining why redirect occurred
    - _Requirements: 2.1_

  - [ ]* 8.2 Write property test for wallet requirement
    - **Property 1: Wallet connection requirement**
    - **Validates: Requirements 2.1**

- [ ] 9. Final checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.
