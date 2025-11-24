import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SlideData, NivoEffectType } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ModernNivoSliderProps {
  slides: SlideData[];
  slices?: number;
  boxCols?: number;
  boxRows?: number;
  animSpeed?: number;
  pauseTime?: number;
  startSlide?: number;
  effect?: NivoEffectType;
  randomStart?: boolean;
}

interface AnimationPiece {
  id: string;
  style: React.CSSProperties;
}

export const ModernNivoSlider: React.FC<ModernNivoSliderProps> = ({
  slides,
  slices = 15,
  boxCols = 8,
  boxRows = 4,
  animSpeed = 500,
  pauseTime = 4000,
  startSlide = 0,
  effect = 'random',
}) => {
  const [currentIndex, setCurrentIndex] = useState(startSlide);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPieces, setAnimationPieces] = useState<AnimationPiece[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  
  // Refs for timers
  const autoPlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to get valid next index
  const getNextIdx = useCallback((current: number, direction: 'next' | 'prev' = 'next') => {
    if (direction === 'next') {
      return (current + 1) % slides.length;
    } else {
      return (current - 1 + slides.length) % slides.length;
    }
  }, [slides.length]);

  // --- The Core Logic: Generating Animation Grids/Slices ---

  const generatePieces = (targetEffect: NivoEffectType, nextImgSrc: string): AnimationPiece[] => {
    const pieces: AnimationPiece[] = [];
    const isBox = (targetEffect as string).includes('box');
    
    if (isBox) {
      const totalBoxes = boxCols * boxRows;
      const boxWidth = 100 / boxCols;
      const boxHeight = 100 / boxRows;

      for (let r = 0; r < boxRows; r++) {
        for (let c = 0; c < boxCols; c++) {
          pieces.push({
            id: `box-${r}-${c}`,
            style: {
              position: 'absolute',
              top: `${r * boxHeight}%`,
              left: `${c * boxWidth}%`,
              width: `${boxWidth}%`,
              height: `${boxHeight}%`,
              backgroundImage: `url(${nextImgSrc})`,
              backgroundPosition: `${-c * 100}% ${-r * 100}%`, // Relative to piece size isn't enough, we need explicit mapping
              backgroundSize: `${boxCols * 100}% ${boxRows * 100}%`, // Scale bg to match container
              opacity: 0,
              zIndex: 20,
              transition: `all ${animSpeed}ms ease-in-out`
            }
          });
        }
      }
    } else if (targetEffect === 'zoomOut' || targetEffect === 'slideLeft') {
        // Single big piece
        pieces.push({
            id: 'full-slide',
            style: {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url(${nextImgSrc})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                zIndex: 20,
                transition: `all ${animSpeed}ms ease-in-out`,
                // Initial states
                ...(targetEffect === 'zoomOut' ? { transform: 'scale(1.4)', opacity: 0 } : {}),
                ...(targetEffect === 'slideLeft' ? { transform: 'translateX(100%)' } : {}),
            }
        })
    } else {
      // Slices
      const sliceWidth = 100 / slices;
      for (let i = 0; i < slices; i++) {
        pieces.push({
          id: `slice-${i}`,
          style: {
            position: 'absolute',
            top: 0,
            left: `${i * sliceWidth}%`,
            width: `${sliceWidth}%`,
            height: targetEffect === 'fold' ? '100%' : '0%', // Fold starts full height but 0 width (handled in logic below), others start 0 height
            backgroundImage: `url(${nextImgSrc})`,
            backgroundPosition: `${-i * 100}% 0`, 
            backgroundSize: `${slices * 100}% cover`, // Important for slices
            opacity: targetEffect === 'fade' ? 0 : 1, // Fold uses opacity or width? Classic fold uses width.
            zIndex: 20,
            transition: `all ${animSpeed}ms ease-in-out`,
            ...(targetEffect === 'fold' ? { width: '0%' } : {}),
            ...(targetEffect === 'sliceUpDown' || targetEffect === 'sliceUpDownLeft' 
                 ? { bottom: i % 2 === 0 ? 'auto' : 0, top: i % 2 === 0 ? 0 : 'auto' } 
                 : {})
          }
        });
      }
    }
    return pieces;
  };

  // --- Running the Animation ---

  const runAnimation = (targetIndex: number, specificEffect?: NivoEffectType) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setNextIndex(targetIndex);

    // 1. Determine Effect
    let selectedEffect: NivoEffectType = specificEffect || effect;
    if (selectedEffect === 'random') {
      const availableEffects: NivoEffectType[] = ['sliceDown', 'sliceDownRight', 'sliceUp', 'sliceUpDown', 'fold', 'fade', 'boxRain', 'boxRainGrow', 'zoomOut', 'slideLeft'];
      selectedEffect = availableEffects[Math.floor(Math.random() * availableEffects.length)];
    }

    // 2. Generate Initial State Pieces
    const pieces = generatePieces(selectedEffect, slides[targetIndex].src);
    setAnimationPieces(pieces);

    // 3. Trigger Reflow/Styles (Next Tick)
    // We use a slight timeout to ensure the DOM renders the "initial" state of pieces before we apply the "final" state
    setTimeout(() => {
      setAnimationPieces(prev => prev.map((piece, i) => {
        let delay = 0;
        const total = prev.length;

        // Calculate Delays based on effect
        if (selectedEffect === 'sliceDownRight' || selectedEffect === 'fade') {
          delay = 100 + i * 50;
        } else if (selectedEffect === 'sliceDown') {
          delay = 100 + i * 30;
        } else if (selectedEffect === 'sliceUpDown' || selectedEffect === 'sliceUpDownLeft') {
            delay = 100 + i * 40;
        } else if (selectedEffect === 'fold') {
            delay = 100 + i * 50;
        } else if (selectedEffect === 'boxRain' || selectedEffect === 'boxRainGrow') {
            // Map 1D array index back to 2D (row, col)
            const r = Math.floor(i / boxCols);
            const c = i % boxCols;
            // Diagonal delay
            delay = 100 + (r + c) * 100;
            if ((selectedEffect as string).includes('Reverse')) {
                delay = 100 + ((boxCols - c) + (boxRows - r)) * 100;
            }
        } 
        
        // Modern effect delays
        if (selectedEffect === 'zoomOut' || selectedEffect === 'slideLeft') delay = 0;


        // Calculate Final Styles
        const newStyle: React.CSSProperties = { ...piece.style };
        
        // Apply Transformations
        if ((selectedEffect as string).includes('slice')) {
           newStyle.height = '100%';
           newStyle.opacity = 1;
        }
        if (selectedEffect === 'fold') {
           newStyle.width = `${100 / slices}%`;
           newStyle.opacity = 1;
        }
        if (selectedEffect === 'fade') {
            newStyle.opacity = 1;
        }
        if ((selectedEffect as string).includes('box')) {
            newStyle.opacity = 1;
            if (selectedEffect === 'boxRainGrow') {
                // Grow effect implies scaling up? 
                // Original Nivo just faded, but let's add a slight scale for 'modern' feel
                // But here we stick to opacity 0->1 for classic Box Rain
            }
        }
        if (selectedEffect === 'zoomOut') {
            newStyle.transform = 'scale(1)';
            newStyle.opacity = 1;
        }
        if (selectedEffect === 'slideLeft') {
            newStyle.transform = 'translateX(0%)';
        }

        newStyle.transitionDelay = `${delay}ms`;
        
        return { ...piece, style: newStyle };
      }));
    }, 20);

    // 4. Cleanup after animation
    // Calculate max duration to know when to swap
    let maxDelay = 0;
    const effStr = selectedEffect as string;
    // Approximate max delay based on logic above (simplified for brevity)
    if (effStr.includes('slice')) maxDelay = slices * 60 + animSpeed;
    else if (effStr.includes('box')) maxDelay = (boxCols + boxRows) * 120 + animSpeed;
    else maxDelay = animSpeed + 100;

    // Safety buffer
    const totalDuration = maxDelay + 200; 

    animTimer.current = setTimeout(() => {
      setCurrentIndex(targetIndex);
      setNextIndex(null);
      setAnimationPieces([]);
      setIsAnimating(false);
    }, totalDuration);
  };

  // --- AutoPlay Logic ---
  useEffect(() => {
    if (isHovered || isAnimating) {
        if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
        return;
    }

    autoPlayTimer.current = setInterval(() => {
        const nxt = getNextIdx(currentIndex);
        runAnimation(nxt);
    }, pauseTime);

    return () => {
        if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, [currentIndex, isHovered, isAnimating, pauseTime, getNextIdx]); // Dependencies matter here

  // Clean up on unmount
  useEffect(() => {
      return () => {
          if (animTimer.current) clearTimeout(animTimer.current);
          if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
      }
  }, [])

  const handlePrev = () => {
    if (isAnimating) return;
    runAnimation(getNextIdx(currentIndex, 'prev'), 'slideLeft'); // Force slide for manual nav maybe? Or random.
  };

  const handleNext = () => {
    if (isAnimating) return;
    runAnimation(getNextIdx(currentIndex, 'next'));
  };

  const handleDotClick = (idx: number) => {
      if (isAnimating || idx === currentIndex) return;
      runAnimation(idx);
  }

  // Current slide data
  const currentSlide = slides[currentIndex];
  
  return (
    <div 
      className="group relative w-full overflow-hidden bg-slate-900 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // Min-height ensures mobile responsiveness isn't a thin strip
      style={{ minHeight: '300px', aspectRatio: '16/9' }}
    >
      {/* 1. Base Image (Current) */}
      {currentSlide && (
         <div className="absolute inset-0 w-full h-full">
             <img 
               src={currentSlide.src} 
               alt={currentSlide.alt || 'slide'} 
               className="w-full h-full object-cover"
             />
         </div>
      )}

      {/* 2. Animation Overlay (The "Nivo" pieces) */}
      {isAnimating && (
        <div className="absolute inset-0 w-full h-full z-20 pointer-events-none">
           {animationPieces.map((p) => (
             <div key={p.id} style={p.style} />
           ))}
        </div>
      )}

      {/* 3. Caption Layer */}
      <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-start px-8 md:px-16 lg:px-24">
         {/* We animate the caption in when not animating the slider, or keep it static. 
             Let's fade it out when animating, fade in when stable. 
         */}
         <div 
            className={`max-w-xl transition-all duration-700 transform ${
                isAnimating ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'
            }`}
         >
            {currentSlide.captionTitle && (
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-md tracking-tight">
                    {currentSlide.captionTitle}
                </h2>
            )}
            {currentSlide.captionText && (
                <p className="text-lg md:text-xl text-slate-100 mb-8 bg-black/30 p-4 rounded backdrop-blur-sm border-l-4 border-teal-500">
                    {currentSlide.captionText}
                </p>
            )}
            {currentSlide.buttonText && (
                <a 
                  href={currentSlide.buttonLink || '#'} 
                  className="pointer-events-auto inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                    {currentSlide.buttonText}
                </a>
            )}
         </div>
      </div>

      {/* 4. Navigation Controls */}
      {/* Arrows - Visible on Hover or Focus */}
      <button 
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/20 hover:bg-teal-600/90 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 backdrop-blur-sm"
        aria-label="Previous Slide"
      >
        <ChevronLeft size={24} />
      </button>

      <button 
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/20 hover:bg-teal-600/90 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 backdrop-blur-sm"
        aria-label="Next Slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-0 right-0 z-40 flex justify-center gap-3">
        {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDotClick(idx)}
              className={`w-3 h-3 rounded-full transition-all duration-300 shadow-sm ${
                  idx === currentIndex 
                  ? 'bg-teal-500 w-8' 
                  : 'bg-white/50 hover:bg-white'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
              aria-current={idx === currentIndex}
            />
        ))}
      </div>

    </div>
  );
};