import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock canvas-confetti before importing
vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

// Import after mocking
import { triggerVictoryConfetti, triggerVictoryBurst } from './confetti';
import confetti from 'canvas-confetti';

const mockConfetti = confetti as any;

describe('Confetti Performance Optimizations', () => {
  let originalWindow: any;
  let originalNavigator: any;

  beforeEach(() => {
    // Store original values
    originalWindow = global.window;
    originalNavigator = global.navigator;

    // Setup window mock
    global.window = {
      innerWidth: 1024,
      matchMedia: vi.fn().mockReturnValue({ matches: false })
    } as any;

    // Setup navigator mock
    global.navigator = {
      hardwareConcurrency: 8
    } as any;

    // Clear mock calls
    mockConfetti.mockClear();

    // Mock timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore original values
    global.window = originalWindow;
    global.navigator = originalNavigator;
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Mobile/Low-end Device Detection', () => {
    it('should detect mobile devices by screen width', () => {
      global.window.innerWidth = 600;

      triggerVictoryBurst();

      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 30, // Mobile particle count
          scalar: 0.7
        })
      );
    });

    it('should detect low-end devices by CPU cores', () => {
      global.navigator.hardwareConcurrency = 2;

      triggerVictoryBurst();

      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 30, // Low-end particle count
          scalar: 0.7
        })
      );
    });

    it('should detect reduced motion preference', () => {
      global.window.matchMedia = vi.fn().mockReturnValue({ matches: true });

      triggerVictoryBurst();

      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 30, // Reduced motion particle count
          scalar: 0.7
        })
      );
    });

    it('should detect low memory devices', () => {
      (global.navigator as any).deviceMemory = 2;

      triggerVictoryBurst();

      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 30, // Low memory particle count
          scalar: 0.7
        })
      );
    });

    it('should use full effects on desktop with good specs', () => {
      global.window.innerWidth = 1920;
      global.navigator.hardwareConcurrency = 8;
      (global.navigator as any).deviceMemory = 8;

      triggerVictoryBurst();

      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 100, // Desktop particle count
          scalar: 1
        })
      );
    });
  });

  describe('Victory Confetti Performance', () => {
    it('should use reduced particle count on mobile', () => {
      global.window.innerWidth = 600;

      triggerVictoryConfetti();
      vi.advanceTimersByTime(400); // First interval on mobile

      // Check that confetti was called with reduced particles
      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          startVelocity: 15,
          ticks: 30,
          gravity: 0.5,
          decay: 0.95,
          scalar: 0.8
        })
      );
    });

    it('should use longer intervals on mobile to reduce CPU load', () => {
      global.window.innerWidth = 600;

      triggerVictoryConfetti();
      
      // Mobile should use 400ms intervals
      vi.advanceTimersByTime(400);
      const callsAfter400ms = mockConfetti.mock.calls.length;
      
      vi.advanceTimersByTime(400);
      const callsAfter800ms = mockConfetti.mock.calls.length;

      expect(callsAfter800ms).toBeGreaterThan(callsAfter400ms);
    });

    it('should fire from center only on mobile to reduce particle count', () => {
      global.window.innerWidth = 600;

      triggerVictoryConfetti();
      vi.advanceTimersByTime(400);

      // On mobile, should only fire once per interval (from center)
      // On desktop, fires twice per interval (left and right)
      const callsPerInterval = mockConfetti.mock.calls.length;
      expect(callsPerInterval).toBe(1);
    });

    it('should fire from both sides on desktop', () => {
      global.window.innerWidth = 1920;

      triggerVictoryConfetti();
      vi.advanceTimersByTime(250); // Desktop interval

      // Desktop fires from both left and right
      expect(mockConfetti.mock.calls.length).toBe(2);
    });

    it('should complete faster on mobile (2s vs 3s)', () => {
      global.window.innerWidth = 600;

      triggerVictoryConfetti();
      
      // Advance to just before mobile duration ends
      vi.advanceTimersByTime(1900);
      expect(mockConfetti.mock.calls.length).toBeGreaterThan(0);
      
      // Advance past mobile duration
      vi.advanceTimersByTime(200);
      const callsAfterMobileDuration = mockConfetti.mock.calls.length;
      
      // Advance more - should not increase
      vi.advanceTimersByTime(1000);
      expect(mockConfetti.mock.calls.length).toBe(callsAfterMobileDuration);
    });
  });

  describe('Victory Burst Performance', () => {
    it('should reduce spread on mobile for better performance', () => {
      global.window.innerWidth = 600;

      triggerVictoryBurst();

      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          spread: 60 // Mobile spread
        })
      );
    });

    it('should use full spread on desktop', () => {
      global.window.innerWidth = 1920;

      triggerVictoryBurst();

      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          spread: 70 // Desktop spread
        })
      );
    });

    it('should apply all performance optimizations on mobile', () => {
      global.window.innerWidth = 600;

      triggerVictoryBurst();

      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 30,
          spread: 60,
          ticks: 40,
          gravity: 0.6,
          decay: 0.95,
          scalar: 0.7
        })
      );
    });
  });
});
