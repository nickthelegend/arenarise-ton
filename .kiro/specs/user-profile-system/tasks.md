# Implementation Plan: User Profile System

- [x] 1. Create profile page route and basic structure





  - Create app/profile/page.tsx
  - Add authentication check (redirect if no wallet)




  - Set up page layout with sections
  - _Requirements: 1.4, 7.4_



- [ ] 2. Implement profile header component




  - [ ] 2.1 Create ProfileHeader component

    - Display Telegram profile photo
    - Show first name and username


    - Show premium badge if applicable
    - Display RISE balance prominently




    - Handle missing profile photo with default avatar
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1_










  - [ ] 2.2 Create balance formatting function

    - Format balance with decimal places
    - Add thousand separators


    - Handle very large values
    - _Requirements: 3.2_











  - [ ]* 2.3 Write property test for balance formatting
    - **Property 1: Balance formatting**
    - **Validates: Requirements 3.2**

  - [x] 2.4 Add loading and error states





    - Show loading indicator while fetching balance
    - Display error message on fetch failure
    - _Requirements: 3.3, 3.4_











- [ ] 3. Create transaction history component

  - [ ] 3.1 Create TransactionList component

    - Display transaction type, amount, timestamp
    - Handle empty state
    - Show loading state
    - _Requirements: 4.2, 4.3, 4.5_

  - [ ]* 3.2 Write property test for transaction display completeness
    - **Property 2: Transaction display completeness**
    - **Validates: Requirements 4.2, 4.3**

  - [ ] 3.3 Implement transaction sorting
    - Sort by timestamp descending
    - _Requirements: 4.4_









  - [ ]* 3.4 Write property test for transaction ordering
    - **Property 3: Transaction ordering**
    - **Validates: Requirements 4.4**

- [ ] 4. Create battle history component

  - [ ] 4.1 Create BattleList component

    - Display opponent name, outcome, reward
    - Handle empty state
    - Show loading state
    - _Requirements: 5.2, 5.3, 5.4, 5.6_







  - [ ]* 4.2 Write property test for battle display completeness
    - **Property 4: Battle display completeness**
    - **Validates: Requirements 5.2, 5.3, 5.4**





  - [x] 4.3 Implement battle sorting







    - Sort by created_at descending



    - _Requirements: 5.5_

  - [ ]* 4.4 Write property test for battle ordering
    - **Property 5: Battle ordering**
    - **Validates: Requirements 5.5**

- [ ] 5. Create API route for transactions

  - [x] 5.1 Implement GET /api/profile/transactions endpoint

    - Validate wallet address parameter
    - Verify wallet matches connected wallet
    - Query swap_transactions table
    - Query coin_flips table for rewards
    - Combine and sort results
    - Return formatted transaction list
    - _Requirements: 4.1, 7.1, 7.2_

  - [ ]* 5.2 Write property test for wallet address verification
    - **Property 6: Wallet address verification**
    - **Validates: Requirements 7.1**

  - [ ]* 5.3 Write property test for transaction data isolation
    - **Property 7: Transaction data isolation**
    - **Validates: Requirements 7.2**

  - [ ]* 5.4 Write unit tests for transactions endpoint
    - Test successful fetch
    - Test authentication failure
    - Test empty results
    - _Requirements: 4.1, 7.5_

- [ ] 6. Create API route for battles

  - [ ] 6.1 Implement GET /api/profile/battles endpoint

    - Validate user_id parameter
    - Verify user_id matches authenticated user
    - Query battles table
    - Join with enemy/player data
    - Return formatted battle list
    - _Requirements: 5.1, 7.1, 7.3_

  - [ ]* 6.2 Write property test for battle data isolation
    - **Property 8: Battle data isolation**
    - **Validates: Requirements 7.3**

  - [ ]* 6.3 Write unit tests for battles endpoint
    - Test successful fetch
    - Test authentication failure
    - Test empty results
    - _Requirements: 5.1, 7.5_

- [ ] 7. Update navigation bar

  - [ ] 7.1 Add profile image to mobile navigation

    - Display Telegram profile photo when in Telegram
    - Display default icon when not in Telegram
    - Make image clickable
    - Navigate to /profile on click
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ] 7.2 Make RISE token display clickable

    - Add click handler to RISE display
    - Navigate to /profile on click
    - _Requirements: 1.3_

- [ ] 8. Implement responsive design

  - Add mobile-optimized layout
  - Add desktop-optimized layout
  - Use Tailwind responsive classes
  - Test on different screen sizes
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 9. Add error handling and edge cases

  - Handle missing Telegram data gracefully
  - Handle API failures with retry options
  - Handle empty states for all lists
  - Add loading states for all async operations
  - _Requirements: 2.5, 3.4, 4.5, 5.6_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
