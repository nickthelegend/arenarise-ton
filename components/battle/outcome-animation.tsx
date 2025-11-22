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
  rewardAmount?: number;
  stakeAmount?: number;
}

// Memoize component to prevent unnecessary re-renders
const OutcomeAnimationComponent = ({ outcome, onComplete, visible, rewardAmount, stakeAmount }: OutcomeAnimationProps) => {
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
              {(rewardAmount && rewardAmount > 0) || (stakeAmount && stakeAmount > 0) ? (
                <div className="mt-4 space-y-3">
                  {rewardAmount && rewardAmount > 0 && (
                    <div className="p-4 bg-gradient-to-r from-yellow-500/20 to-green-500/20 border-2 border-yellow-400 rounded-lg animate-in zoom-in duration-500">
                      <p className="text-2xl font-bold text-yellow-300">
                        +{rewardAmount} RISE
                      </p>
                      <p className="text-sm text-green-200">
                        Reward earned!
                      </p>
                    </div>
                  )}
                  {stakeAmount && stakeAmount > 0 && (
                    <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-400 rounded-lg animate-in zoom-in duration-700">
                      <p className="text-lg font-bold text-blue-300">
                        Stake: {stakeAmount} RISE
                      </p>
                      <p className="text-xs text-blue-200">
                        {outcome === 'victory' ? 'Stake returned + reward' : 'Stake lost'}
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
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
              {stakeAmount && stakeAmount > 0 && (
                <div className="mt-4 p-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-400 rounded-lg animate-in zoom-in duration-700">
                  <p className="text-lg font-bold text-red-300">
                    Stake: {stakeAmount} RISE
                  </p>
                  <p className="text-xs text-red-200">
                    Stake lost
                  </p>
                </div>
              )}
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
