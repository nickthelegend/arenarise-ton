'use client';

import { useEffect, useState } from 'react';
import { Trophy, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerVictoryConfetti } from '@/lib/confetti';
import { useRouter } from 'next/navigation';

interface OutcomeAnimationProps {
  outcome: 'victory' | 'defeat';
  onComplete?: () => void;
  visible: boolean;
}

export function OutcomeAnimation({ outcome, onComplete, visible }: OutcomeAnimationProps) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (visible && !dismissed) {
      // Small delay for smooth entrance
      setTimeout(() => {
        setShow(true);
        setIsLoaded(true);
      }, 100);
      
      // Trigger confetti for victory after component is loaded
      if (outcome === 'victory') {
        setTimeout(() => {
          triggerVictoryConfetti();
        }, 200);
      }

      // Auto-dismiss after animation duration
      const timeout = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, outcome === 'victory' ? 5000 : 3000);

      return () => clearTimeout(timeout);
    }
  }, [visible, outcome, onComplete, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setIsLoaded(false);
    
    // Smooth fade out before navigation
    setTimeout(() => {
      setShow(false);
      // Additional delay for complete fade out
      setTimeout(() => {
        router.push('/battle');
      }, 150);
    }, 200);
  };

  if (!show || !visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in">
      <div className="relative flex flex-col items-center justify-center space-y-6 p-8 animate-in zoom-in-95 duration-500">
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
}
