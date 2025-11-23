# Implementation Plan

- [x] 1. Database schema updates










  - [x] 1.1 Create migration file for beast lock columns

    - Add `beast1_locked` and `beast2_locked` boolean columns to battles table
    - Set default values to FALSE



    - Create index on (status, battle_type) for performance
    - _Requirements: 9.1, 9.2_


  - [x] 1.2 Run migration and verify schema changes


    - Execute migration on database



    - Verify columns exist with correct types and defaults
    - Test that existing battles are not affected


    - _Requirements: 9.1_

- [x] 2. Create new beast selection API endpoint





  - [x] 2.1 Implement PATCH /api/battles/rooms/[id]/select-beast endpoint






    - Accept player_id and beast_id in request body
    - Validate beast ownership
    - Validate player is part of the battle
    - Validate beast not already locked
    - Update beast1_id or beast2_id based on player
    - Set corresponding locked flag to true
    - If both beasts locked, update status to 'in_progress' and set current_turn
    - Return updated battle data
    - _Requirements: 2.4, 3.1, 3.2, 9.2, 9.4, 9.5_

  - [ ]* 2.2 Write property test for beast selection
    - **Property 2: Beast selection updates database**
    - **Validates: Requirements 2.4, 3.1, 9.2**

  - [ ]* 2.3 Write property test for beast lock immutability
    - **Property 3: Beast lock prevents changes**
    - **Validates: Requirements 3.2, 9.5**

  - [x]* 2.4 Write property test for beast ownership validation

    - **Property 13: Beast ownership validation**
    - **Validates: Requirements 9.4**


  - [ ]* 2.5 Write unit tests for edge cases
    - Test selecting beast for completed battle (should fail)
    - Test selecting beast that doesn't exist (should fail)
    - Test concurrent beast selection attempts
    - _Requirements: 2.4, 3.2, 9.4_

- [x] 3. Update existing room creation API



  - [x] 3.1 Modify POST /api/battles/rooms to make beast_id optional






    - Remove beast_id requirement from validation
    - Create battle with null beast1_id if not provided
    - Keep backward compatibility for clients that still send beast_id
    - Set beast1_locked to true if beast_id provided (old flow)
    - _Requirements: 1.2, 1.5, 9.1_

  - [ ]* 3.2 Write property test for room creation without beast
    - **Property 1: Room creation without beast requirement**
    - **Validates: Requirements 1.2, 1.5, 9.1**

  - [ ]* 3.3 Write unit tests for room creation
    - Test room creation without beast_id
    - Test room creation with beast_id (backward compatibility)
    - Test room creation with invalid player_id
    - _Requirements: 1.2, 9.1_

- [x] 4. Update room join API




  - [x] 4.1 Modify POST /api/battles/rooms/join to make beast_id optional







    - Remove beast_id requirement from validation
    - Set player2_id but leave beast2_id as null if not provided
    - Keep status as 'waiting' instead of 'in_progress'
    - Don't set current_turn yet
    - Keep backward compatibility for clients that still send beast_id
    - _Requirements: 1.5, 2.2_

  - [ ]* 4.2 Write property test for self-join prevention
    - **Property 9: Self-join prevention**
    - **Validates: Requirements 7.5**

  - [ ]* 4.3 Write unit tests for room join
    - Test joining without beast_id
    - Test joining with beast_id (backward compatibility)
    - Test joining own room (should fail)
    - Test joining full room (should fail)
    - _Requirements: 1.5, 7.5_
-

- [x] 5. Update PVP main page component





  - [x] 5.1 Remove beast selection UI from /battle/pvp/page.tsx






    - Remove beast selection state and UI components
    - Remove selectedBeast state
    - Keep myBeasts for validation only
    - Display warning if user has no beasts
    - _Requirements: 1.1, 6.1, 6.2, 6.4_
-

  - [x] 5.2 Update room action buttons






    - Make Create Room, Browse Rooms, and Join by Code primary actions
    - Remove beast selection requirement from button enable logic
    - Update Create Room handler to not send beast_id
    - Update navigation to room page after creation
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 5.3 Write component tests for PVP page
    - Test that action buttons are rendered
    - Test that beast selection UI is not rendered
    - Test warning message when no beasts
    - Test navigation on button clicks
    - _Requirements: 1.1, 6.1, 6.2, 6.4_
-

- [x] 6. Implement beast selection in room page





  - [x] 6.1 Add beast selection UI to /battle/pvp/room/[id]/page.tsx





    - Add state for available beasts
    - Add state for beast selection locked status
    - Fetch user's beasts when room page loads
    - Display beast selection cards when myBeast is null
    - Show opponent's beast if already selected
    - Add confirm selection button
    - _Requirements: 2.1, 2.2, 2.3, 5.1, 5.3_

  - [x] 6.2 Implement beast selection handler







    - Call PATCH /api/battles/rooms/[id]/select-beast
    - Update local state with selected beast
    - Set beastSelectionLocked to true
    - Handle errors and display messages
    - Transition to waiting view after selection
    - _Requirements: 2.4, 3.1_


  - [x] 6.3 Add locked beast indicator






    - Display visual indicator when beast is locked
    - Disable beast selection UI when locked
    - Show "Beast Locked" badge or icon
    - _Requirements: 3.5_

  - [ ]* 6.4 Write property test for battle start on both beasts locked
    - **Property 4: Both beasts locked triggers battle start**
    - **Validates: Requirements 3.3, 4.4, 9.3**

  - [ ]* 6.5 Write property test for beast lock persistence
    - **Property 5: Beast lock persists across states**
    - **Validates: Requirements 3.4**

  - [ ]* 6.6 Write component tests for room page beast selection
    - Test beast selection UI renders when beast is null
    - Test locked indicator displays when beast is locked
    - Test opponent beast displays if selected
    - Test waiting screen after selection
    - _Requirements: 2.3, 3.5, 5.1_
- [x] 7. Update waiting screen in room page


- [ ] 7. Update waiting screen in room page

  - [x] 7.1 Enhance waiting screen after beast selection






    - Display room code prominently
    - Show selected beast with locked indicator
    - Add copy room code button
    - Add Telegram share button
    - Add cancel room button
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ]* 7.2 Write property test for room cancellation
    - **Property 6: Room cancellation in waiting state**
    - **Validates: Requirements 4.5**

  - [ ]* 7.3 Write unit tests for waiting screen
    - Test room code display
    - Test copy to clipboard functionality
    - Test cancel room functionality
    - Test Telegram share functionality
    - _Requirements: 4.1, 4.2, 4.5_
-

- [x] 8. Update real-time subscriptions



  - [x] 8.1 Update battle subscription handler in room page







    - Listen for opponent beast selection
    - Update opponent beast state when selected
    - Trigger battle start when both beasts locked
    - Display notification when opponent joins
    - _Requirements: 4.3, 5.4_

  - [ ]* 8.2 Write property test for battle start on second selection
    - **Property 8: Battle start on second beast selection**
    - **Validates: Requirements 5.4**

  - [ ]* 8.3 Write integration tests for real-time updates
    - Test opponent join notification
    - Test opponent beast selection update
    - Test battle start trigger
    - _Requirements: 4.3, 5.4_
-

- [ ] 9. Update browse rooms page


  - [x] 9.1 Remove beast selection requirement from /battle/pvp/rooms/page.tsx







    - Remove beast selection state and UI
    - Allow browsing without pre-selected beast
    - Update join room handler to not send beast_id
    - Navigate to room page instead of arena on join
    - _Requirements: 1.3, 7.1, 7.3_

  - [ ]* 9.2 Write property test for beast info rendering
    - **Property 7: Beast information rendering completeness**
    - **Validates: Requirements 5.3, 7.2**

  - [ ]* 9.3 Write component tests for browse rooms
    - Test rooms list displays without beast selection
    - Test room cards show all beast information
    - Test navigation to room page on join
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 10. Update join by code functionality



  - [x] 10.1 Update join by code handler






    - Remove beast selection requirement
    - Update API call to not send beast_id
    - Navigate to room page instead of arena
    - _Requirements: 1.4, 8.1, 8.2_

  - [ ]* 10.2 Write property test for valid room code navigation
    - **Property 10: Valid room code navigation**
    - **Validates: Requirements 8.2**

  - [ ]* 10.3 Write property test for invalid room code handling
    - **Property 11: Invalid room code error handling**
    - **Validates: Requirements 8.3**

  - [ ]* 10.4 Write property test for case-insensitive room codes
    - **Property 12: Case-insensitive room codes**
    - **Validates: Requirements 8.5**

  - [ ]* 10.5 Write unit tests for join by code
    - Test valid room code navigation
    - Test invalid room code error
    - Test full room error
    - Test completed battle error
    - Test case insensitivity
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [x] 11. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Update error handling and validation






  - [x] 12.1 Add client-side validation






    - Validate user has beasts before allowing room actions
    - Validate room code format before API call
    - Add loading states and error messages
    - _Requirements: 6.4, 8.3_

  - [x] 12.2 Enhance server-side error messages







    - Make error messages user-friendly and actionable
    - Add specific error codes for different scenarios
    - Improve validation error responses
    - _Requirements: 8.3, 8.4_

  - [ ]* 12.3 Write unit tests for error handling
    - Test no beasts warning
    - Test invalid room code format
    - Test network error handling
    - Test concurrent operation errors
    - _Requirements: 6.4, 8.3_
-


- [x] 13. Final checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.
