# Design Document

## Overview

This design document outlines the implementation approach for three key improvements to the battle arena feature: adding a pre-battle staking flow, implementing winner/loser animations, and making the arena UI mobile-responsive. The solution leverages existing Next.js routing patterns, Magic UI components for animations, and Tailwind CSS responsive utilities.

## Architecture

### Routing Flow

The current flow redirects users directly to `/battle/arena/[id]`. The improved flow will be:

1. User initiates battle → `/battle/[id]/start` (existing staking page)
2. User confirms stake → `/battle/arena/[id]` (redirected with stake data)
3. Battle completes → Show outcome animation on same page
4. User clicks CTA → Return to `/battle` selection page

### Component Structure

```
app/
├── battle/
│   ├── [id]/
│   │   └── start/
│   │       └── page.tsx (existing - will be enhanced)
│   └── arena/
│       └── [id]/
│           └── page.tsx (will be modified for animations & mobile)
components/
└── battle/
    ├── outcome-animation.tsx (new - victory/defeat animations)
    └── mobile-move-grid.tsx (new - responsive move selection)
```

## Components and Interfaces

### 1. Staking Page Enhancement

The existing `/battle/[id]/start/page.tsx` already implements staking functionality. We need to ensure it's always visited before the arena:

**Middleware/Redirect Logic:**
- Add check in `/battle/arena/[id]/page.tsx` to verify stake was placed
- Store stake in session storage or URL params when redirecting
- If no stake found, redirect back to `/battle/[id]/start`

### 2. Outcome Animation Component

**Component: `OutcomeAnimation.tsx`**

```typescript
interface OutcomeAnimationProps {
  outcome: 'victory' | 'defeat'
  onComplete: () => void
  visible: boolean
}
```

**Victory Animation:**
- Use Magic UI confetti component
- Green/gold color scheme
- Trophy icon with glow effect
- "VICTORY!" text with animation
- Particle effects

**Defeat Animation:**
- Red color scheme
- Broken shield or similar icon
- "DEFEAT" text
- Red flash/fade effect
- No confetti

### 3. Mobile-Responsive Move Grid

**Component: `MobileMove Grid.tsx`**

```typescript
interface MobileMoveGridProps {
  moves: Move[]
  onMoveSelect: (move: Move) => void
  disabled: boolean
}
```

**Responsive Breakpoints:**
- Mobile (<640px): 1-2 columns, full-width buttons
- Tablet (640-1024px): 2-3 columns
- Desktop (>1024px): 3-5 columns (current layout)

## Data Models

### Stake Data

```typescript
interface StakeData {
  amount: number
  battleId: string
  timestamp: number
}
```

Stored in:
- Session storage (client-side)
- Battle record (database) - may need schema update

### Battle Outcome

```typescript
interface BattleOutcome {
  winner_id: string
  loser_id: string
  stake_amount: number
  winnings: number
  completed_at: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Analyzing the acceptance criteria for redundancy:

**Requirement 1 (Staking):**
- 1.1, 1.2, 1.3, 1.4, 1.5 are all distinct validation and flow properties
- No redundancy - each tests a different aspect of staking

**Requirement 2 (Animations):**
- 2.1 and 2.2 both test victory state but different aspects (animation vs message)
- 2.3 and 2.4 both test defeat state but different aspects (visual vs message)
- These can be combined into comprehensive properties

**Requirement 3 (Mobile UI):**
- 3.1, 3.2, 3.3 all test responsive layout but at different levels
- Can be combined into a single comprehensive responsive property
- 3.4 and 3.5 are distinct (accessibility and dynamic resizing)

**Consolidated Properties:**

Property 1: Stake validation and flow
*For any* user attempting to stake, the system should validate balance, record the stake, and redirect to arena only on successful confirmation
**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

Property 2: Victory outcome display
*For any* completed battle where the player wins, the system should display confetti animation and victory message with green/gold styling
**Validates: Requirements 2.1, 2.2**

Property 3: Defeat outcome display
*For any* completed battle where the player loses, the system should display red-themed visual feedback and defeat message
**Validates: Requirements 2.3, 2.4**

Property 4: Outcome navigation
*For any* completed battle, after the outcome animation completes, the system should provide a functional return button
**Validates: Requirements 2.5**

Property 5: Mobile responsive layout
*For any* viewport width below 768px, all move buttons should be visible without horizontal overflow and arranged in an appropriate grid
**Validates: Requirements 3.1, 3.2, 3.3**

Property 6: Interactive element accessibility
*For any* mobile viewport, all interactive elements should remain tappable with adequate touch target sizes
**Validates: Requirements 3.4**

Property 7: Dynamic layout adjustment
*For any* viewport size change, the layout should adjust without requiring page refresh
**Validates: Requirements 3.5**

## Error Handling

### Staking Errors

1. **Insufficient Balance**
   - Display error toast/message
   - Disable stake button
   - Highlight balance vs stake amount

2. **Invalid Stake Amount**
   - Validate min/max bounds
   - Show inline validation errors
   - Prevent form submission

3. **Network Errors**
   - Retry mechanism for stake recording
   - Fallback to local storage
   - Clear error messaging

### Animation Errors

1. **Component Load Failure**
   - Fallback to simple text-based outcome
   - Log error for debugging
   - Don't block user flow

2. **Performance Issues**
   - Reduce animation complexity on low-end devices
   - Provide skip animation option
   - Timeout after 5 seconds

### Mobile Layout Errors

1. **Overflow Detection**
   - Use CSS overflow: hidden with scroll fallback
   - Monitor for layout shifts
   - Test across device sizes

2. **Touch Target Issues**
   - Minimum 44x44px touch targets
   - Adequate spacing between buttons
   - Visual feedback on tap

## Testing Strategy

### Unit Tests

**Staking Flow:**
- Test stake validation logic
- Test redirect with stake data
- Test insufficient balance handling
- Test stake amount boundaries (min/max)

**Outcome Animations:**
- Test victory component renders with correct props
- Test defeat component renders with correct props
- Test onComplete callback fires
- Test animation visibility toggle

**Mobile Responsiveness:**
- Test grid column calculation at different breakpoints
- Test button sizing on mobile
- Test overflow prevention

### Property-Based Tests

Property-based tests will use `@fast-check/vitest` for TypeScript/React testing. Each test will run a minimum of 100 iterations.

**Property 1: Stake validation**
- Generate random stake amounts and balances
- Verify validation logic correctly allows/denies stakes
- Tag: **Feature: battle-arena-improvements, Property 1: Stake validation and flow**

**Property 2 & 3: Outcome display**
- Generate random battle outcomes
- Verify correct animation component renders
- Verify correct color schemes applied
- Tag: **Feature: battle-arena-improvements, Property 2: Victory outcome display** and **Property 3: Defeat outcome display**

**Property 5: Mobile layout**
- Generate random viewport widths
- Verify grid columns adjust correctly
- Verify no horizontal overflow
- Tag: **Feature: battle-arena-improvements, Property 5: Mobile responsive layout**

### Integration Tests

- Full flow: stake → battle → outcome → return
- Test with real API calls (mocked Supabase)
- Test animation timing and transitions
- Test mobile device emulation

### Manual Testing Checklist

- [ ] Test on actual mobile devices (iOS/Android)
- [ ] Test different screen orientations
- [ ] Test with slow network conditions
- [ ] Test animation performance on low-end devices
- [ ] Verify confetti animation visual quality
- [ ] Verify red defeat animation clarity

## Implementation Notes

### Magic UI Confetti

Research shows Magic UI provides a confetti component. We'll need to:
1. Install Magic UI dependencies if not already present
2. Import confetti component
3. Configure colors (green/gold for victory)
4. Trigger on battle completion

### Session Storage for Stake

Using session storage ensures stake data persists during navigation but clears on tab close:

```typescript
// Store stake
sessionStorage.setItem('battle_stake', JSON.stringify(stakeData))

// Retrieve in arena
const stakeData = JSON.parse(sessionStorage.getItem('battle_stake') || '{}')
```

### Responsive Grid Implementation

Use Tailwind's responsive grid utilities:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
  {/* Move buttons */}
</div>
```

### Animation Timing

- Victory confetti: 3-5 seconds
- Defeat animation: 2-3 seconds
- Auto-dismiss or manual CTA button
- Prevent spam clicking during animation

## Dependencies

- **Magic UI**: For confetti component (verify installation)
- **Tailwind CSS**: Already present for responsive utilities
- **Lucide React**: Already present for icons
- **Next.js**: Already present for routing
- **@fast-check/vitest**: For property-based testing

## Performance Considerations

1. **Animation Performance**
   - Use CSS transforms over position changes
   - Leverage GPU acceleration
   - Reduce particle count on mobile

2. **Mobile Optimization**
   - Lazy load animation components
   - Optimize image/icon sizes
   - Minimize re-renders during battle

3. **Bundle Size**
   - Code-split animation components
   - Dynamic import for Magic UI confetti
   - Tree-shake unused utilities
