'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import { Trophy, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerVictoryConfetti } from '@/lib/confetti';
import { useRouter } from 'next/navigation';

interface OutcomeAnimationProps {
  outcome: 'victory' | 'defeat';
  onComplete?: () => void;
  visible: boolean;
}

// Memoize component to prevent unnecessary re-renders
const OutcomeAnimationComponent = ({ outcome, onComplete, visible }: OutcomeAnimationProps) => {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (visible && !dismissed) {
      // Smooth entrance with loading state
      setIsTransitioning(true);
      
      const showTimeout = setTimeout(() => {
        setShow(true);
        setIsLoaded(true);
        setIsTransitioning(false);
      }, 150);
      
      // Trigger confetti for victory after component is loaded
      // Use requestAnimationFrame for better performance
      if (outcome === 'victory') {
        const confettiTimeout = setTimeout(() => {
          requestAnimationFrame(() => {
            triggerVictoryConfetti();
          });
        }, 300);
        
        return () => {
          clearTimeout(showTimeout);
          clearTimeout(confettiTimeout);
        };
      }

      // Auto-dismiss after animation duration
      const dismissTimeout = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, outcome === 'victory' ? 5000 : 3000);

      return () => {
        clearTimeout(showTimeout);
        clearTimeout(dismissTimeout);
      };
    }
  }, [visible, outcome, onComplete, dismissed]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setIsLoaded(false);
    setIsTransitioning(true);
    
    // Smooth fade out before navigation with transition
    setTimeout(() => {
      setShow(false);
      // Additional delay for complete fade out and smooth page transition
      setTimeout(() => {
        router.push('/battle');
      }, 200);
    }, 150);
  }, [router]);

  if (!show || !visible) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-500 ${dismissed || isTransitioning ? 'animate-out fade-out duration-300' : 'animate-in fade-in duration-500'}`}>
      <div className={`relative flex flex-col items-center justify-center space-y-6 p-8 transition-all duration-500 ${dismissed || isTransitioning ? 'animate-out zoom-out-95 duration-300' : 'animate-in zoom-in-95 duration-500'}`}>
        {outcome === 'victory' ? (
          <>
            {/* Victory Animation */}
            <div className="animate-bounce">
              <Trophy 
                className="h-32 w-32 text-yellow-400 drop-shadow-[0_0_25px_rgba(255,215,0,0.8)]" 
                strokeWidth={1.5}
              />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-green-400 to-yellow-400 animate-pulse">
                VICTORY!
              </h1>
              <p className="text-xl text-green-300">
                You have triumphed in battle!
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Defeat Animation */}
            <div className="animate-pulse">
              <ShieldX 
                className="h-32 w-32 text-red-500 drop-shadow-[0_0_25px_rgba(255,0,0,0.8)]" 
                strokeWidth={1.5}
              />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-6xl font-bold text-red-500 animate-pulse">
                DEFEAT
              </h1>
              <p className="text-xl text-red-300">
                Better luck next time...
              </p>
            </div>
          </>
        )}
        
        {/* CTA Button */}
        <Button
          onClick={handleDismiss}
          size="lg"
          className={`mt-8 ${
            outcome === 'victory' 
              ? 'bg-gradient-to-r from-yellow-500 to-green-500 hover:from-yellow-600 hover:to-green-600' 
              : 'bg-red-600 hover:bg-red-700'
          } text-white font-bold px-8 py-6 text-lg`}
        >
          Return to Battle Selection
        </Button>
      </div>
    </div>
  );
};

// Export memoized component for better performance
export const OutcomeAnimation = memo(OutcomeAnimationComponent);
