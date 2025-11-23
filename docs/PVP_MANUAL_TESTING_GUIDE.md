# PVP Battle System - Manual Testing Guide

This guide provides comprehensive manual testing procedures for the real-time PVP battle system, covering scenarios that require human interaction and real-world conditions.

## Prerequisites

- Two test devices (or one device + one browser)
- Access to the application (development or staging environment)
- Two test accounts with beasts
- Telegram app installed (for share testing)
- Network throttling tools (Chrome DevTools or similar)

## Test Scenarios

### 1. Complete Flow Test: Create → Share → Join → Battle → Complete

**Objective**: Verify the entire PVP battle flow works end-to-end

**Steps**:

1. **Device 1 - Create Room**
   - [ ] Open the app and navigate to Battle → PVP
   - [ ] Select a beast from your inventory
   - [ ] Click "Create Room"
   - [ ] Verify room code is displayed (6 characters, alphanumeric)
   - [ ] Verify "Waiting for opponent..." message appears
   - [ ] Verify beast stats are displayed correctly

2. **Device 1 - Share Room**
   - [ ] Click the "Share on Telegram" button
   - [ ] Verify Telegram opens with pre-filled message
   - [ ] Verify message contains room code
   - [ ] Verify message contains join link
   - [ ] Send message to yourself or test partner

3. **Device 2 - Join Room**
   - [ ] Click the Telegram link (or manually navigate to app)
   - [ ] Verify app opens to PVP page
   - [ ] Verify room code is pre-filled in join input
   - [ ] Select a beast
   - [ ] Click "Join Battle"
   - [ ] Verify navigation to battle arena

4. **Both Devices - Battle Start**
   - [ ] Verify both players see the battle arena
   - [ ] Verify both beasts are displayed with correct stats
   - [ ] Verify HP bars show full health
   - [ ] Verify turn indicator shows whose turn it is
   - [ ] Verify faster beast goes first (or player1 if speeds equal)

5. **Both Devices - Battle Execution**
   - [ ] Active player selects a move
   - [ ] Verify move animation plays on both devices
   - [ ] Verify damage is calculated and displayed
   - [ ] Verify HP bars update on both devices
   - [ ] Verify turn switches to other player
   - [ ] Continue until one beast reaches 0 HP

6. **Both Devices - Battle Completion**
   - [ ] Verify battle ends when HP reaches 0
   - [ ] Verify winner sees victory screen
   - [ ] Verify loser sees defeat screen
   - [ ] Verify rewards are displayed (winner only)
   - [ ] Verify "Return to Menu" button works
   - [ ] Verify battle appears in battle history for both players

**Expected Results**: Complete flow works smoothly with real-time synchronization

---

### 2. Mobile Device Testing

**Objective**: Ensure the PVP system works correctly on mobile devices

**Test Devices**:
- iOS (iPhone/iPad)
- Android (various screen sizes)

**Test Cases**:

#### 2.1 Touch Interactions
- [ ] Tap to select beast works correctly
- [ ] Tap to create room works correctly
- [ ] Tap to join room works correctly
- [ ] Tap to select moves in battle works correctly
- [ ] Tap to share on Telegram works correctly
- [ ] All buttons are large enough for touch (minimum 44x44px)

#### 2.2 Screen Sizes
- [ ] Room code is readable on small screens
- [ ] Beast stats are properly displayed
- [ ] Battle arena fits on screen without scrolling
- [ ] HP bars are visible and clear
- [ ] Move buttons are accessible
- [ ] No UI elements overlap

#### 2.3 Orientation
- [ ] Portrait mode works correctly
- [ ] Landscape mode works correctly (if supported)
- [ ] Orientation changes don't break battle state

#### 2.4 Mobile Browser
- [ ] Works in Safari (iOS)
- [ ] Works in Chrome (Android)
- [ ] Works in Telegram in-app browser
- [ ] Deep links work from Telegram

#### 2.5 Performance
- [ ] Animations are smooth (60fps)
- [ ] No lag when switching views
- [ ] Real-time updates arrive quickly
- [ ] No memory leaks during long battles

**Expected Results**: Full functionality on mobile devices with good UX

---

### 3. Slow Network Conditions Testing

**Objective**: Verify the system handles poor network conditions gracefully

**Setup**:
- Use Chrome DevTools Network Throttling
- Test profiles: Slow 3G, Fast 3G, Offline

#### 3.1 Room Creation on Slow Network
- [ ] Enable "Slow 3G" throttling
- [ ] Create a room
- [ ] Verify loading indicator appears
- [ ] Verify room is created successfully (may take longer)
- [ ] Verify no errors are shown
- [ ] Verify room code appears when ready

#### 3.2 Room Joining on Slow Network
- [ ] Enable "Slow 3G" throttling
- [ ] Enter room code and join
- [ ] Verify loading indicator appears
- [ ] Verify join succeeds eventually
- [ ] Verify navigation to arena happens
- [ ] Verify no duplicate join attempts

#### 3.3 Real-time Updates on Slow Network
- [ ] Enable "Fast 3G" throttling on both devices
- [ ] Start a battle
- [ ] Make moves alternately
- [ ] Verify updates arrive (may be delayed)
- [ ] Verify no moves are lost
- [ ] Verify HP values stay synchronized
- [ ] Verify turn order is maintained

#### 3.4 Connection Loss During Battle
- [ ] Start a battle
- [ ] Enable "Offline" mode on one device
- [ ] Wait 5 seconds
- [ ] Disable "Offline" mode
- [ ] Verify connection status indicator appears
- [ ] Verify automatic reconnection occurs
- [ ] Verify battle state is synchronized
- [ ] Verify battle can continue

#### 3.5 Connection Loss During Room Wait
- [ ] Create a room
- [ ] Enable "Offline" mode
- [ ] Wait 10 seconds
- [ ] Disable "Offline" mode
- [ ] Verify room still exists
- [ ] Verify can still be joined

**Expected Results**: System handles network issues gracefully with appropriate feedback

---

### 4. Real-time Updates Verification

**Objective**: Verify all real-time updates work correctly

#### 4.1 Room List Updates
- [ ] Device 1: Navigate to "Browse Rooms"
- [ ] Device 2: Create a new room
- [ ] Device 1: Verify new room appears in list (within 2 seconds)
- [ ] Device 2: Cancel the room
- [ ] Device 1: Verify room disappears from list (within 2 seconds)

#### 4.2 Waiting Room Updates
- [ ] Device 1: Create a room and wait
- [ ] Device 2: Join the room
- [ ] Device 1: Verify opponent info appears (within 2 seconds)
- [ ] Device 1: Verify automatic navigation to arena

#### 4.3 Battle Move Updates
- [ ] Start a battle
- [ ] Player 1: Make a move
- [ ] Player 2: Verify move appears immediately (within 2 seconds)
- [ ] Player 2: Verify HP update is visible
- [ ] Player 2: Verify turn indicator updates
- [ ] Repeat for Player 2's turn

#### 4.4 Battle Completion Updates
- [ ] Continue battle until one beast reaches 0 HP
- [ ] Verify both players see completion screen simultaneously
- [ ] Verify winner/loser status is correct on both devices

**Expected Results**: All real-time updates arrive within 2 seconds

---

### 5. Room Cleanup Testing

**Objective**: Verify stale rooms are cleaned up after 10 minutes

**Steps**:
1. [ ] Create a room
2. [ ] Note the room code and time
3. [ ] Do NOT join the room
4. [ ] Wait 10 minutes
5. [ ] Try to join the room using the code
6. [ ] Verify error message: "Room not found" or similar
7. [ ] Verify room does not appear in browse list

**Alternative (Faster)**:
1. [ ] Manually update database to set room created_at to 11 minutes ago
2. [ ] Run cleanup function/cron job
3. [ ] Verify room is deleted

**Expected Results**: Stale rooms are automatically cleaned up

---

### 6. Edge Cases and Error Scenarios

#### 6.1 Invalid Room Codes
- [ ] Try to join with code: "ABC" (too short)
- [ ] Try to join with code: "ABCDEFGH" (too long)
- [ ] Try to join with code: "ABC!@#" (invalid characters)
- [ ] Try to join with code: "XXXXXX" (non-existent)
- [ ] Verify appropriate error messages for each

#### 6.2 Room Already Started
- [ ] Device 1: Create room
- [ ] Device 2: Join room (battle starts)
- [ ] Device 3: Try to join same room code
- [ ] Verify error: "Room already in progress"

#### 6.3 Concurrent Join Attempts
- [ ] Device 1: Create room
- [ ] Device 2 & 3: Simultaneously try to join
- [ ] Verify only one succeeds
- [ ] Verify other gets error message

#### 6.4 Room Cancellation
- [ ] Create a room
- [ ] Click "Cancel" button
- [ ] Verify return to beast selection
- [ ] Verify room no longer in browse list
- [ ] Try to join with the code
- [ ] Verify error: "Room not found"

#### 6.5 Browser Refresh During Battle
- [ ] Start a battle
- [ ] Refresh browser on one device
- [ ] Verify battle state is restored
- [ ] Verify can continue battle

#### 6.6 Multiple Tabs
- [ ] Open app in two tabs (same account)
- [ ] Create room in Tab 1
- [ ] Verify room appears in Tab 2 (if on browse page)
- [ ] Join room in Tab 2 with different account
- [ ] Verify both tabs update correctly

**Expected Results**: All edge cases handled gracefully with clear error messages

---

## Test Results Template

Use this template to record test results:

```
Test Date: _______________
Tester: _______________
Environment: [ ] Development [ ] Staging [ ] Production
Devices Used: _______________

| Test Scenario | Status | Notes |
|--------------|--------|-------|
| 1. Complete Flow | ⬜ Pass ⬜ Fail | |
| 2. Mobile Testing | ⬜ Pass ⬜ Fail | |
| 3. Slow Network | ⬜ Pass ⬜ Fail | |
| 4. Real-time Updates | ⬜ Pass ⬜ Fail | |
| 5. Room Cleanup | ⬜ Pass ⬜ Fail | |
| 6. Edge Cases | ⬜ Pass ⬜ Fail | |

Issues Found:
1. _______________
2. _______________
3. _______________

Overall Assessment: ⬜ Ready for Production ⬜ Needs Fixes
```

---

## Performance Benchmarks

Record these metrics during testing:

- **Room Creation Time**: _______ ms (target: < 500ms)
- **Room Join Time**: _______ ms (target: < 500ms)
- **Real-time Update Latency**: _______ ms (target: < 2000ms)
- **Move Execution Time**: _______ ms (target: < 300ms)
- **Battle Completion Time**: _______ ms (target: < 500ms)

---

## Troubleshooting

### Common Issues

**Issue**: Real-time updates not arriving
- Check Supabase real-time is enabled
- Check WebSocket connection in DevTools
- Verify subscription is active
- Check for console errors

**Issue**: Room code not working
- Verify code is exactly 6 characters
- Check database for room existence
- Verify room status is 'waiting'
- Check for typos (O vs 0, I vs 1)

**Issue**: Battle state desynchronized
- Refresh both clients
- Check turn_number in database
- Verify move records are sequential
- Check for network issues

**Issue**: Mobile performance issues
- Check for memory leaks
- Verify animations are optimized
- Check bundle size
- Test on lower-end devices

---

## Sign-off

After completing all tests:

- [ ] All automated tests pass
- [ ] All manual tests pass
- [ ] Performance benchmarks met
- [ ] No critical bugs found
- [ ] Documentation updated
- [ ] Ready for production deployment

**Tested by**: _______________
**Date**: _______________
**Signature**: _______________
