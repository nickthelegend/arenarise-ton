# PVP Battle Outcome Animation

## Overview
Added victory/defeat animations and reward display to the PVP battle room page, matching the functionality from the PVE arena page.

## Features Added

### 1. Outcome Animation Component
- Dynamically imported `OutcomeAnimation` component for better performance
- Shows victory or defeat animation when battle completes
- Displays confetti effect for victories
- Shows reward amount earned (RISE tokens)

### 2. Victory Animation
- Large trophy icon with glow effect
- "VICTORY!" text with gradient animation
- Reward amount display in highlighted box
- Confetti celebration effect
- Auto-dismisses after 5 seconds or manual dismiss

### 3. Defeat Animation
- Shield-X icon with red glow
- "DEFEAT" text with pulse animation
- "Better luck next time" message
- Auto-dismisses after 3 seconds or manual dismiss

### 4. Reward Display
- Shows RISE token reward amount
- Highlights the reward in a gradient box
- Adds reward information to battle log
- Displays reward status (completed/pending)

## Implementation Details

### State Management
```typescript
const [showOutcomeAnimation, setShowOutcomeAnimation] = useState(false)
const [battleOutcome, setBattleOutcome] = useState<'victory' | 'defeat' | null>(null)
const [rewardAmount, setRewardAmount] = useState<number>(0)
```

### Trigger Points

1. **When Player Wins (handleMove)**
   - Battle ends with opponent HP reaching 0
   - Reward amount is set from API response
   - Animation shows after 500ms delay

2. **When Opponent Wins (WebSocket Update)**
   - Battle status changes to 'completed'
   - Checks if current user is winner
   - Animation shows after 500ms delay

### Animation Flow
1. Battle completes
2. Reward amount is fetched from battle data
3. Battle log is updated with result
4. 500ms delay for smooth transition
5. Outcome animation appears with confetti (victory) or pulse (defeat)
6. User can dismiss or wait for auto-dismiss
7. Redirects to PVP menu

## Files Modified
- `app/battle/pvp/room/[id]/page.tsx` - Added outcome animation integration

## Testing
- All 241 tests passing
- Animation triggers correctly on battle completion
- Reward amounts display properly
- Smooth transitions between battle and outcome

## User Experience
- Celebratory feedback for victories with confetti
- Clear visual indication of battle outcome
- Reward information prominently displayed
- Smooth animations and transitions
- Automatic return to PVP menu after viewing results
