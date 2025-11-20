import { describe, it, expect, vi, beforeEach } from 'vitest';
import confetti from 'canvas-confetti';
import { triggerVictoryConfetti, triggerVictoryBurst } from './confetti';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

describe('Confetti Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('should call confetti with victory colors for burst', () => {
    triggerVictoryBurst();
    
    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        colors: expect.arrayContaining(['#FFD700', '#FFA500', '#00FF00', '#32CD32', '#FFFF00']),
        particleCount: 100,
        spread: 70
      })
    );
  });

  it('should trigger continuous confetti for victory animation', () => {
    triggerVictoryConfetti();
    
    // Fast-forward time to trigger interval
    vi.advanceTimersByTime(250);
    
    // Should have been called at least twice (left and right side)
    expect(confetti).toHaveBeenCalled();
    expect((confetti as any).mock.calls.length).toBeGreaterThanOrEqual(2);
    
    // Verify colors are green/gold themed
    const firstCall = (confetti as any).mock.calls[0][0];
    expect(firstCall.colors).toEqual(
      expect.arrayContaining(['#FFD700', '#FFA500', '#00FF00', '#32CD32', '#FFFF00'])
    );
  });

  it('should stop confetti after duration', () => {
    triggerVictoryConfetti();
    
    const initialCallCount = (confetti as any).mock.calls.length;
    
    // Fast-forward past the 3 second duration
    vi.advanceTimersByTime(3500);
    
    const finalCallCount = (confetti as any).mock.calls.length;
    
    // Should have stopped calling confetti
    expect(finalCallCount).toBeGreaterThan(initialCallCount);
    
    // Advance more time - should not increase call count
    const callCountAfterStop = (confetti as any).mock.calls.length;
    vi.advanceTimersByTime(1000);
    expect((confetti as any).mock.calls.length).toBe(callCountAfterStop);
  });
});
