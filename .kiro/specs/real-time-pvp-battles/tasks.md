# Implementation Plan

- [x] 1. Database schema updates and room code generation





  - Add room_code column to battles table with unique constraint
  - Create index on room_code for fast lookups
  - Implement room code generator utility function
  - Implement stale room cleanup database function
  - _Requirements: 1.1, 1.2_

- [ ]* 1.1 Write property test for room code generation
  - **Property 1: Room code uniqueness**
  - **Validates: Requirements 1.1**



- [ ] 2. Create battle rooms API endpoints

  - Implement POST /api/battles/rooms (create room)
  - Implement GET /api/battles/rooms (list available rooms)
  - Implement POST /api/battles/rooms/join (join by code)
  - Implement DELETE /api/battles/rooms/:battleId (cancel room)
  - Add validation for room codes and battle states
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 3.1, 3.2, 3.3, 3.5, 3.6_

- [ ]* 2.1 Write property test for room creation persistence
  - **Property 2: Room creation persistence**
  - **Validates: Requirements 1.2**

- [ ]* 2.2 Write property test for room code validation
  - **Property 5: Room code format validation**
  - **Validates: Requirements 3.1**

- [ ]* 2.3 Write property test for join state updates
  - **Property 6: Join updates battle state**
  - **Validates: Requirements 3.3**

- [ ]* 2.4 Write property test for invalid join rejection
  - **Property 7: Invalid join rejection**



  - **Validates: Requirements 3.5, 3.6**

- [ ] 3. Update PVP page with room-based UI

  - Remove mock matchmaking logic from /app/battle/pvp/page.tsx
  - Add view state management (select, waiting, browse, join)
  - Implement beast selection view with action buttons
  - Implement waiting room view with room code display
  - Implement join by code view with input field
  - Add room cancellation functionality
  - _Requirements: 1.3, 1.4, 1.5, 3.1, 9.1, 9.2, 9.3_

- [ ]* 3.1 Write property test for room cancellation cleanup
  - **Property 3: Room cancellation cleanup**
  - **Validates: Requirements 1.5**

- [x]* 3.2 Write unit tests for PVP page views




  - Test view transitions (select → waiting, select → join)
  - Test room code input validation
  - Test cancel button functionality
  - _Requirements: 1.3, 1.4, 3.1_

- [ ] 4. Create rooms list page

  - Create /app/battle/pvp/rooms/page.tsx



  - Implement room cards with beast information display
  - Add join button for each room
  - Implement empty state when no rooms available
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [ ]* 4.1 Write property test for rooms list accuracy
  - **Property 4: Rooms list accuracy**
  - **Validates: Requirements 2.1**

- [ ] 5. Implement real-time subscriptions for rooms




  - Create real-time subscription manager utility
  - Subscribe to battles table changes for waiting rooms
  - Update rooms list in real-time as rooms are created/removed
  - Subscribe to specific battle updates in waiting view
  - Handle connection status and reconnection
  - _Requirements: 2.4, 5.1, 5.2, 5.5_

- [ ]* 5.1 Write integration test for real-time room updates
  - Test room appears in list when created



  - Test room disappears when joined or canceled
  - _Requirements: 2.4_

- [ ] 6. Implement player join notifications

  - Add real-time listener for battle updates in waiting view
  - Display opponent beast information when player2 joins
  - Auto-navigate both players to battle arena on join
  - _Requirements: 5.2, 5.3, 5.4, 6.4_

- [ ]* 6.1 Write integration test for join notifications
  - Test host receives notification when opponent joins
  - Test both players navigate to arena
  - _Requirements: 5.2, 5.4_




- [ ] 7. Add Telegram share integration

  - Implement Telegram share URL generator
  - Add share button to waiting room view
  - Implement deep link handling for join parameter
  - Auto-populate join code from URL parameter
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 7.1 Write property test for Telegram URL format
  - **Property 8: Telegram share URL format**
  - **Validates: Requirements 4.3**

- [ ]* 7.2 Write unit tests for deep link handling
  - Test URL with join parameter populates code input
  - Test URL without join parameter shows normal view
  - _Requirements: 4.4_

- [ ] 8. Update battle arena for real PVP

  - Remove PVE-specific logic from arena (keep for PVE battles)



  - Ensure real-time move synchronization works for PVP
  - Update turn logic to wait for opponent moves
  - Remove AI move execution for PVP battles
  - _Requirements: 6.1, 6.2, 6.3, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 8.1 Write property test for turn determination
  - **Property 12: Turn determination by speed**
  - **Validates: Requirements 6.2**

- [ ]* 8.2 Write property test for initial HP
  - **Property 13: Initial HP equals max HP**
  - **Validates: Requirements 6.3**

- [ ]* 8.3 Write property test for HP reduction
  - **Property 10: HP reduction consistency**




  - **Validates: Requirements 7.4**

- [ ]* 8.4 Write property test for real-time move sync
  - **Property 9: Real-time move synchronization**
  - **Validates: Requirements 7.2**

- [ ] 9. Implement battle completion for PVP

  - Update battle completion logic to handle PVP rewards
  - Ensure winner_id is set correctly
  - Display battle outcome to both players
  - Award rewards to winner
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x]* 9.1 Write property test for battle completion



  - **Property 11: Battle completion on zero HP**
  - **Validates: Requirements 8.1, 8.2**

- [ ]* 9.2 Write unit tests for battle outcome display
  - Test victory screen shows correct reward
  - Test defeat screen shows correct message
  - Test return to menu button works
  - _Requirements: 8.3, 8.5_








- [ ] 10. Update battle history for PVP

  - Ensure profile page displays PVP battles
  - Show opponent information in battle history
  - Distinguish between active and completed battles
  - Add navigation to active battles
  - Add battle summary view for completed battles
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 10.1 Write property test for battle history completeness
  - **Property 15: Battle history completeness**
  - **Validates: Requirements 10.1**




- [ ]* 10.2 Write unit tests for battle history display
  - Test active battles show "Resume" button
  - Test completed battles show summary
  - Test opponent name is displayed correctly
  - _Requirements: 10.2, 10.3, 10.4, 10.5_





- [ ] 11. Remove all mock matchmaking code

  - Delete or comment out random opponent selection logic
  - Remove auto-battle creation without player2
  - Update battle creation API to require explicit player IDs
  - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [ ]* 11.1 Write property test for no auto player2 assignment
  - **Property 14: No mock matchmaking**
  - **Validates: Requirements 9.5**

- [ ] 12. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Add error handling and edge cases

  - Implement room code collision retry logic
  - Add connection status indicators
  - Implement automatic reconnection for dropped connections
  - Add concurrent join attempt handling with database locking
  - Display clear error messages for all failure scenarios
  - _Requirements: All error handling scenarios from design_

- [ ]* 13.1 Write unit tests for error scenarios
  - Test room code collision retry
  - Test invalid code format errors
  - Test non-existent room errors
  - Test already-started room errors
  - _Requirements: 3.5, 3.6_

- [ ] 14. Final testing and polish

  - Test complete flow: create room → share → join → battle → complete
  - Test on mobile devices
  - Test with slow network conditions
  - Verify all real-time updates work correctly
  - Test room cleanup after 10 minutes
  - _Requirements: All requirements_

- [ ] 15. Final Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.
