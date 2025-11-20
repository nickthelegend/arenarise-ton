import confetti from 'canvas-confetti';

/**
 * Detect if device is mobile or low-end
 */
const isMobileOrLowEnd = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check screen width for mobile
  const isMobile = window.innerWidth < 768;
  
  // Check for low-end device indicators
  const isLowEnd = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false;
  
  return isMobile || isLowEnd;
};

/**
 * Victory confetti configuration with green/gold theme
 * Optimized for mobile and low-end devices
 */
export const triggerVictoryConfetti = () => {
  const isMobileLowEnd = isMobileOrLowEnd();
  
  // Reduce duration and particle count on mobile/low-end devices
  const duration = isMobileLowEnd ? 2000 : 3000;
  const baseParticleCount = isMobileLowEnd ? 25 : 50;
  const interval_ms = isMobileLowEnd ? 350 : 250;
  
  const animationEnd = Date.now() + duration;
  const defaults = { 
    startVelocity: isMobileLowEnd ? 20 : 30, 
    spread: 360, 
    ticks: isMobileLowEnd ? 40 : 60, 
    zIndex: 9999,
    colors: ['#FFD700', '#FFA500', '#00FF00', '#32CD32', '#FFFF00']
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
  }, interval_ms);
};

/**
 * Single burst confetti for victory
 * Optimized for mobile and low-end devices
 */
export const triggerVictoryBurst = () => {
  const isMobileLowEnd = isMobileOrLowEnd();
  const particleCount = isMobileLowEnd ? 50 : 100;
  
  confetti({
    particleCount,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FFD700', '#FFA500', '#00FF00', '#32CD32', '#FFFF00'],
    zIndex: 9999
  });
};
