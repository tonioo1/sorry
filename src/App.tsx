import React, { useState, useEffect } from 'react';
import { sound } from './utils/audioSynth';

interface RandomMeme {
  id: number;
  top: number;
  left: number;
  size: number;
  rotate: number;
}

export default function App() {
  // State machine:
  // 1. Initial: hasClickedMeme = false -> only meme image button is visible
  // 2. hasClickedMeme = true -> 2 buttons ("是的" and "不") appear below the image
  // 3. noClicks: 0 to 10 -> "是的" gets bigger every time "不" is clicked, "不" slides to the side, and more image.png appear at random places
  // 4. isFlashbanging: true -> tactical flashbang whiteout, blinding flash, and tinnitus ringing sound
  // 5. isGivenUp: true -> webpage shows "中国人不会再飞了"
  const [hasClickedMeme, setHasClickedMeme] = useState(false);
  const [noClicks, setNoClicks] = useState(0);
  const [isFlashbanging, setIsFlashbanging] = useState(false);
  const [isGivenUp, setIsGivenUp] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [randomMemes, setRandomMemes] = useState<RandomMeme[]>([]);

  // Mobile & viewport dimensions listener
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 768,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const updateSize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const isMobile = viewport.width < 640;

  // Subtle mobile haptic feedback helper
  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  };

  // Handle meme image click (toggles buttons expansion/retraction)
  const handleMemeClick = () => {
    if (isFlashbanging || isGivenUp) return;
    sound.playPop();
    triggerHaptic(25);
    setHasClickedMeme((prev) => !prev);
  };

  // Handle button 2 ("不") click
  const handleNoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFlashbanging || isGivenUp) return;

    const nextClicks = noClicks + 1;
    setNoClicks(nextClicks);
    triggerHaptic(40);

    // Add more image.png at random places across the screen, scaled safely for mobile
    const baseMemeSize = isMobile ? 55 : 85;
    const memeVariance = isMobile ? 35 : 70;

    const newMemeList: RandomMeme[] = [
      {
        id: Date.now() + Math.random(),
        top: Math.floor(Math.random() * 70) + 12,
        left: Math.floor(Math.random() * 76) + 12,
        size: Math.floor(Math.random() * memeVariance) + baseMemeSize,
        rotate: Math.floor(Math.random() * 50) - 25,
      },
      {
        id: Date.now() + Math.random() + 1,
        top: Math.floor(Math.random() * 70) + 12,
        left: Math.floor(Math.random() * 76) + 12,
        size: Math.floor(Math.random() * memeVariance) + baseMemeSize,
        rotate: Math.floor(Math.random() * 50) - 25,
      },
    ];
    setRandomMemes((prev) => [...prev, ...newMemeList]);

    if (nextClicks >= 10) {
      // Trigger tactical flashbang!
      triggerFlashbang();
    } else {
      sound.playGrow(nextClicks);
    }
  };

  // Handle button 1 ("是的") click - redirects user to target video link
  const TARGET_VIDEO_URL = "https://www.bilibili.tv/en/video/4800495105612289?bstar_from=bstar-web.homepage.recommend.all";

  const handleYesClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFlashbanging || isGivenUp) {
      e.preventDefault();
      return;
    }
    sound.playPop();
    triggerHaptic(50);
    setIsAccepted(true);

    // Give visual and sound feedback, then redirect to the video link
    setTimeout(() => {
      window.location.href = TARGET_VIDEO_URL;
    }, 400);
  };

  // Trigger flashbang animation
  const triggerFlashbang = () => {
    setIsFlashbanging(true);
    sound.playFlashbang();
    triggerHaptic([80, 50, 180]);

    // After the initial blinding flash (900ms), transition the underlying state to "中国人不会再飞了"
    setTimeout(() => {
      setIsGivenUp(true);
    }, 900);

    // Keep flashbang blinding overlay active while it smoothly fades out (2.4s)
    setTimeout(() => {
      setIsFlashbanging(false);
    }, 2400);
  };

  // Reset helper
  const handleReset = () => {
    setHasClickedMeme(false);
    setNoClicks(0);
    setIsFlashbanging(false);
    setIsGivenUp(false);
    setIsAccepted(false);
    setRandomMemes([]);
  };

  // Calculate dynamic scaling and movement:
  // On mobile, scale grows more compactly so it never overflows narrow phone viewports.
  // On desktop, scale is larger and dramatic.
  const scaleIncrement = isMobile ? 0.16 : 0.35;
  const rawYesScale = 1 + noClicks * scaleIncrement;
  // Maximum scale bounded so "是的" never exceeds 68% of mobile viewport width
  const maxScaleLimit = isMobile ? Math.min(2.4, (viewport.width * 0.62) / 80) : 4.5;
  const yesScale = Math.min(rawYesScale, maxScaleLimit);

  // Calculate movement for Button 2 ("不"):
  // As Button 1 ("是的") swells in size, its right edge extends outward.
  const baseButtonWidth = isMobile ? 70 : 80;
  const yesExpansionRight = (baseButtonWidth * (yesScale - 1)) / 2;
  const rawTranslateX = Math.round(yesExpansionRight + noClicks * (isMobile ? 10 : 16));

  // In mobile view, clamp translateX so Button 2 stays strictly within screen padding
  const maxMobileTranslateX = Math.max(16, (viewport.width / 2) - (isMobile ? 48 : 60));
  const noButtonTranslateX = Math.min(rawTranslateX, maxMobileTranslateX);
  // On mobile, also shift slightly vertically downwards as it grows so it never gets obscured
  const noButtonTranslateY = isMobile ? Math.min(50, noClicks * 5) : 0;

  // If in the final state after 10 clicks on button 2:
  if (isGivenUp) {
    return (
      <main
        id="final-message-screen"
        className="min-h-[100dvh] w-full bg-white flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden"
      >
        {/* Flashbang lingering fade-out overlay */}
        {isFlashbanging && (
          <div
            className="fixed inset-0 z-50 pointer-events-none bg-white animate-flashbang-blinding flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-white animate-flashbang-burst filter blur-md" />
          </div>
        )}

        <h1
          id="flashbang-final-message"
          className="text-3xl sm:text-5xl md:text-7xl font-black text-black tracking-tight text-center font-sans mb-8 sm:mb-10 px-4 leading-tight animate-in fade-in zoom-in-90 duration-500"
        >
          中国人不会再飞了
        </h1>
        <div className="flex flex-col items-center gap-4 z-10 px-4">
          <button
            id="retry-button"
            onClick={handleReset}
            className="min-h-[48px] px-8 py-2.5 rounded-full border border-stone-300 text-stone-700 font-medium text-sm hover:border-black hover:text-black transition-all cursor-pointer active:scale-95 touch-manipulation inline-flex items-center justify-center text-center shadow-xs"
          >
            再试一次 (Try again)
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      id="main-app"
      className={`min-h-[100dvh] w-full bg-white flex flex-col items-center justify-center p-3 sm:p-4 relative overflow-hidden select-none ${
        isFlashbanging ? 'animate-screen-shake' : ''
      }`}
    >
      {/* Flashbang Active Blinding Whiteout Overlay */}
      {isFlashbanging && (
        <div
          className="fixed inset-0 z-50 pointer-events-none bg-white animate-flashbang-blinding flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-white animate-flashbang-burst filter blur-md" />
        </div>
      )}

      {/* Random Memes Added on Each "不" Click */}
      {randomMemes.map((m) => (
        <div
          key={m.id}
          className="absolute pointer-events-none select-none z-10 transition-all duration-300 animate-in zoom-in-75 fade-in duration-200"
          style={{
            top: `${m.top}%`,
            left: `${m.left}%`,
            width: `${m.size}px`,
            height: `${m.size}px`,
            transform: `translate(-50%, -50%) rotate(${m.rotate}deg)`,
          }}
        >
          <img
            src="/image.png"
            alt="惹不起，惹不起"
            className="w-full h-full object-contain drop-shadow-sm"
          />
        </div>
      ))}

      {/* Center Stage Container */}
      <div
        className={`flex flex-col items-center justify-center transition-all duration-300 relative z-20 w-full max-w-lg ${
          isFlashbanging ? 'scale-105 filter blur-xs opacity-60' : ''
        }`}
      >
        {/* 1. Meme Image Button */}
        <button
          id="meme-image-button"
          onClick={handleMemeClick}
          className="group relative bg-transparent border-0 p-0 m-0 cursor-pointer outline-hidden focus:outline-hidden transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation hover-meme-wiggle"
          aria-label="惹不起，惹不起 meme button"
          title="惹不起，惹不起"
        >
          {/* The Meme Image with adaptive responsive sizing for small/tall phones */}
          <div className="w-48 h-48 sm:w-72 sm:h-72 md:w-80 md:h-80 max-h-[38vh] relative flex items-center justify-center bg-white">
            <img
              src="/image.png"
              alt="惹不起，惹不起"
              onError={(e) => {
                // Fallback to image.jpg or vector meme.svg if needed
                const target = e.currentTarget as HTMLImageElement;
                if (!target.src.includes('image.jpg')) {
                  target.src = '/image.jpg';
                } else {
                  target.src = '/meme.svg';
                }
              }}
              className="w-full h-full object-contain pointer-events-none drop-shadow-xs group-hover:drop-shadow-md transition-shadow"
            />
          </div>
        </button>

        {/* 2. Smaller Buttons (Appear/Retract below the image when clicked) */}
        {hasClickedMeme && (
          <div
            id="choices-container"
            className="mt-6 sm:mt-10 flex items-center justify-center relative z-30 min-h-[140px] sm:min-h-[160px] w-full px-2 sm:px-4 animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Button 1: "是的" (gets bigger with every click on button 2) */}
            <div
              className="flex items-center justify-center transition-transform duration-300 ease-out origin-center"
              style={{
                transform: `scale(${yesScale})`,
                zIndex: 40 + noClicks,
              }}
            >
              <a
                id="button-1-yes"
                href={TARGET_VIDEO_URL}
                onClick={handleYesClick}
                className={`min-h-[44px] min-w-[50px] px-6 sm:px-8 py-2.5 rounded-full font-black text-sm sm:text-base tracking-wider shadow-md transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap border-2 inline-flex items-center justify-center text-center touch-manipulation ${
                  isAccepted
                    ? 'bg-emerald-600 text-white border-emerald-700 ring-4 ring-emerald-200'
                    : 'bg-black text-white border-black hover:bg-neutral-800'
                }`}
              >
                {isAccepted ? '已答应 🎉 跳转中...' : '是的'}
              </a>
            </div>

            {/* Button 2: "不" (moves to the side dynamically as Button 1 grows, avoiding any overlap and staying on-screen on mobile) */}
            <div
              className="flex items-center justify-center transition-transform duration-300 ease-out origin-center ml-4 sm:ml-8"
              style={{
                transform: `translate(${noButtonTranslateX}px, ${noButtonTranslateY}px) scale(${Math.max(0.65, 1 - noClicks * 0.035)})`,
                opacity: Math.max(0.5, 1 - noClicks * 0.05),
                zIndex: 45,
              }}
            >
              <button
                id="button-2-no"
                onClick={handleNoClick}
                className="min-h-[44px] min-w-[48px] px-6 sm:px-8 py-2.5 rounded-full font-black text-sm sm:text-base tracking-wider bg-white text-black border-2 border-stone-400 hover:border-black hover:bg-stone-50 shadow-md transition-all duration-150 cursor-pointer active:scale-90 select-none whitespace-nowrap touch-manipulation"
              >
                不
              </button>
            </div>
          </div>
        )}

        {/* Clicks countdown hint when "不" has been clicked */}
        {hasClickedMeme && noClicks > 0 && !isFlashbanging && (
          <div className="mt-4 sm:mt-6 text-xs text-stone-400 font-mono tracking-wider">
            {10 - noClicks} clicks left...
          </div>
        )}
      </div>
    </main>
  );
}
