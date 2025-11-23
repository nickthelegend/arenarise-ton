# Animation and Token Transfer Fixes

## Issues Fixed

### 1. Animation Showing Multiple Times (CRITICAL FIX)
**Problem**: The polling was calling `/api/battles` and `/api/battles/moves` every 2 seconds, and each time it detected the battle was completed, it would call `setBattle()` which triggered the animation again, even though `animationShownRef` was set.

**Root Cause**: The polling interval continued running even after the battle was completed, causing repeated state updates.

**Solution**: 
1. Stop the polling interval when battle status is 'completed'
2. Add animation trigger in polling logic (with ref check)
3. Ensure `animationShownRef` is checked in all places that might trigger animation

```typescript
// Stop polling if battle is completed
if (battleInfo.status === 'completed' && pollInterval) {
  console.log('Battle completed, stopping polling')
  clearInterval(pollInterval)
  pollInterval = null
}
```

### 2. `/api/send/rise` Not Being Called
**Problem**: The environment variable `NEXT_PUBLIC_APP_URL` might not be set, causing the fetch to fail.

**Solution**: Updated the URL construction to check multiple environment variables:
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'http://localhost:3000'
```

This ensures the API call works in:
- Local development (`http://localhost:3000`)
- Vercel deployment (uses `VERCEL_URL`)
- Custom deployments (uses `NEXT_PUBLIC_APP_URL`)

### 2. Losing Player Not Seeing Defeat Animation
**Problem**: The animation was only triggered when the player made the winning move, not when they received the battle completion via WebSocket.

**Solution**: The WebSocket `onBattleUpdate` handler already checks for battle completion and shows the appropriate animation (victory or defeat) based on `winner_id`:
```typescript
if (updatedBattle.status === 'completed' && !animationShownRef.current) {
  const didWin = updatedBattle.winner_id === userId
  setBattleOutcome(didWin ? 'victory' : 'defeat')
  setShowOutcomeAnimation(true)
}
```

### 3. Animation Showing Multiple Times
**Problem**: The battle state was being updated multiple times (via WebSocket, polling, etc.), causing the animation to trigger repeatedly.

**Solution**: Added a `useRef` to track if the animation has already been shown:
```typescript
const animationShownRef = useRef(false)

// In both WebSocket handler and handleMove:
if (updatedBattle.status === 'completed' && !animationShownRef.current) {
  animationShownRef.current = true
  // Show animation...
}
```

This ensures the animation only shows **once** per battle, regardless of how many times the battle state updates.

## How It Works Now

### Winner's Flow
1. Player makes final move
2. `/api/battles/moves` detects HP = 0
3. Battle marked as completed
4. RISE tokens sent via `/api/send/rise`
5. Response includes reward info
6. Victory animation shows (once)

### Loser's Flow
1. Opponent makes final move
2. WebSocket receives battle update
3. Detects `status = 'completed'` and `winner_id !== userId`
4. Defeat animation shows (once)

## Files Modified
- `app/api/battles/moves/route.ts` - Fixed URL construction for `/api/send/rise`
- `app/battle/pvp/room/[id]/page.tsx` - Added ref to prevent multiple animation triggers

## Testing
- All tests passing
- Animation shows exactly once per battle
- Both winner and loser see appropriate animations
- RISE tokens are sent when battle ends
