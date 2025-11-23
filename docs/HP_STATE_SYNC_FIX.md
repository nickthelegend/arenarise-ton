# HP State Synchronization Fix

## Problem
The game state was showing different HP values for the same beast across different players' views. When a player's beast took damage, the opponent's screen would still show the beast at full health after refreshing or joining the battle.

### Root Cause
The HP changes were only being tracked in local React state (`myBeastHp`, `opponentHp`), but were never persisted to the database. When a player refreshed or joined a battle, they would fetch the beast data from the database which still had the original HP values.

The `battle_moves` table was recording `target_hp_remaining` for each move, but this data was never being used to reconstruct the current HP state.

## Solution
Modified the PVP room page to fetch and apply battle moves history to calculate the current HP state:

### 1. Initial Load (useEffect)
- Fetch battle moves history when loading the room
- Calculate current HP for both beasts based on the last move against each
- Use `target_hp_remaining` from the most recent move, or fall back to the beast's original HP

### 2. Polling Fallback
- Updated the polling logic to fetch battle moves every 2 seconds
- Sync HP state from the moves history on each poll
- Ensures HP stays synchronized even if WebSocket updates are missed

### 3. WebSocket Updates
- Enhanced `onBattleUpdate` callback to fetch and apply moves history
- Updated `onMoveReceived` to handle both opponent's moves (updating my HP) and my moves (updating opponent HP)
- Ensures real-time HP synchronization when moves are made

## Technical Details

### HP Calculation Logic
```typescript
// For my beast HP - find opponent's moves against me
const movesAgainstMe = battleMoves.filter((m: any) => m.player_id !== userId)
const lastMoveAgainstMe = movesAgainstMe[movesAgainstMe.length - 1]
const currentMyHp = lastMoveAgainstMe?.target_hp_remaining ?? originalHp

// For opponent HP - find my moves against them
const movesAgainstOpponent = battleMoves.filter((m: any) => m.player_id === userId)
const lastMoveAgainstOpponent = movesAgainstOpponent[movesAgainstOpponent.length - 1]
const currentOppHp = lastMoveAgainstOpponent?.target_hp_remaining ?? originalHp
```

### Files Modified
- `app/battle/pvp/room/[id]/page.tsx` - Added HP synchronization from battle moves

## Testing
- All 241 tests passing
- HP state now correctly synchronized across all players
- Works with both WebSocket real-time updates and polling fallback

## Future Improvements
Consider updating the beast HP directly in the database when moves are made, though the current solution using battle moves history is more reliable and provides a complete audit trail.
