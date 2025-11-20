import confetti from 'canvas-confetti';

/**
 * Detect if device is mobile or low-end
 * Enhanced detection for better performance optimization
 */
const isMobileOrLowEnd = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check screen width for mobile
  const isMobile = window.innerWidth < 768;
  
  // Check for low-end device indicators
  const isLowEnd = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false;
  
  // Check for reduced motion preference (accessibility + performance)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Check device memory if available (Chrome/Edge)
  const hasLowMemory = (navigator as any).deviceMemory ? (navigator as any).deviceMemory < 4 : false;
  
  return isMobile || isLowEnd || prefersReducedMotion || hasLowMemory;
};

/**
 * Victory confetti configuration with green/gold theme
 * Optimized for mobile and low-end devices with aggressive performance tuning
 */
export const triggerVictoryConfetti = () => {
  const isMobileLowEnd = isMobileOrLowEnd();
  
  // Aggressive optimization for mobile/low-end devices
  // Desktop: 3s duration, 50 particles, 250ms interval
  // Mobile/Low-end: 2s duration, 20 particles, 400ms interval
  const duration = isMobileLowEnd ? 2000 : 3000;
  const baseParticleCount = isMobileLowEnd ? 20 : 50;
  const interval_ms = isMobileLowEnd ? 400 : 250;
  
  const animationEnd = Date.now() + duration;
  const defaults = { 
    startVelocity: isMobileLowEnd ? 15 : 30, 
    spread: 360, 
    ticks: isMobileLowEnd ? 30 : 60, 
    zIndex: 9999,
    colors: ['#FFD700', '#FFA500', '#00FF00', '#32CD32', '#FFFF00'],
    // Disable gravity on mobile for better performance
    gravity: isMobileLowEnd ? 0.5 : 1,
    // Reduce decay for faster cleanup on mobile
    decay: isMobileLowEnd ? 0.95 : 0.9,
    // Use scalar for better performance
    scalar: isMobileLowEnd ? 0.8 : 1
  };

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = baseParticleCount * (timeLeft / duration);
    
    // On mobile/low-end, fire from center only to reduce particle count
    if (isMobileLowEnd) {
      confetti({
        ...defaults,
        particleCount: particleCount * 2, // Compensate for single burst
        origin: { x: 0.5, y: 0.5 }
      });
    } else {
      // Fire confetti from left side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      
      // Fire confetti from right side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }
  }, interval_ms);
};

/**
 * Single burst confetti for victory
 * Optimized for mobile and low-end devices with reduced particle count
 */
export const triggerVictoryBurst = () => {
  const isMobileLowEnd = isMobileOrLowEnd();
  const particleCount = isMobileLowEnd ? 30 : 100;
  
  confetti({
    particleCount,
    spread: isMobileLowEnd ? 60 : 70,
    origin: { y: 0.6 },
    colors: ['#FFD700', '#FFA500', '#00FF00', '#32CD32', '#FFFF00'],
    zIndex: 9999,
    // Performance optimizations
    ticks: isMobileLowEnd ? 40 : 60,
    gravity: isMobileLowEnd ? 0.6 : 1,
    decay: isMobileLowEnd ? 0.95 : 0.9,
    scalar: isMobileLowEnd ? 0.7 : 1
  });
};
