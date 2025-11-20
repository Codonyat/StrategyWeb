import { useState, useEffect, useRef } from 'react';

export function AnimatedLogo() {
  const [gifKey, setGifKey] = useState(0);
  const [showGif, setShowGif] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const scheduleNextBlink = () => {
      // Random idle time between 12s and 20s (12000ms to 20000ms)
      const idleTime = 20000 + Math.random() * 4000;

      timeoutRef.current = setTimeout(() => {
        // Show GIF (this reloads it and plays the animation)
        setGifKey(prev => prev + 1);
        setShowGif(true);

        // Duration of one GIF loop - adjust this to match your actual GIF duration
        const blinkDuration = 300;

        setTimeout(() => {
          // Hide GIF and return to static image
          setShowGif(false);

          // 1/15 chance for double blink
          if (Math.random() < 1/15) {
            // Short pause before second blink (200ms)
            setTimeout(() => {
              // Show GIF again for second blink
              setGifKey(prev => prev + 1);
              setShowGif(true);

              setTimeout(() => {
                // Hide GIF after second blink
                setShowGif(false);
                scheduleNextBlink();
              }, blinkDuration);
            }, 200);
          } else {
            // Single blink - schedule next blink
            scheduleNextBlink();
          }
        }, blinkDuration);
      }, idleTime);
    };

    scheduleNextBlink();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <img
      key={showGif ? `gif-${gifKey}` : 'static'}
      src={showGif ? `/coins/monstr.gif?${gifKey}` : '/coins/monstr-icon.png'}
      alt="MONSTR"
      className="logo-icon"
    />
  );
}
