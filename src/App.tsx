import React, { useState } from 'react';
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

  // Handle meme image click (toggles buttons expansion/retraction)
  const handleMemeClick = () => {
    if (isFlashbanging || isGivenUp) return;
    sound.playPop();
    setHasClickedMeme((prev) => !prev);
  };

  // Handle button 2 ("不") click
  const handleNoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFlashbanging || isGivenUp) return;

    const nextClicks = noClicks + 1;
    setNoClicks(nextClicks);

    // Add more image.png at random places across the screen
    const newMemeList: RandomMeme[] = [
      {
        id: Date.now() + Math.random(),
        top: Math.floor(Math.random() * 75) + 10,
        left: Math.floor(Math.random() * 80) + 10,
        size: Math.floor(Math.random() * 80) + 90,
        rotate: Math.floor(Math.random() * 60) - 30,
      },
      {
        id: Date.now() + Math.random() + 1,
        top: Math.floor(Math.random() * 75) + 10,
        left: Math.floor(Math.random() * 80) + 10,
        size: Math.floor(Math.random() * 70) + 80,
        rotate: Math.floor(Math.random() * 60) - 30,
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

  // Calculate scaling for Button 1 ("是的")
  // Progressively gets bigger with each click on "不":
  const yesScale = 1 + noClicks * 0.48;

  // Calculate dynamic movement for Button 2 ("不"):
  // As Button 1 ("是的") swells in size, its right edge extends outward.
  // Base width of "是的" is ~80px. Right edge expands by (80 * (yesScale - 1)) / 2.
  // We move Button 2 to the side with an additional margin so they NEVER overlap!
  const baseButtonWidth = 80;
  const yesExpansionRight = (baseButtonWidth * (yesScale - 1)) / 2;
  const noButtonTranslateX = Math.round(yesExpansionRight + noClicks * 18);

  // If in the final state after 10 clicks on button 2:
  if (isGivenUp) {
    return (
      <main
        id="final-message-screen"
        className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-6 select-none relative overflow-hidden"
      >
        {/* Flashbang lingering fade-out overlay */}
        {isFlashbanging && (
          <div
            className="fixed inset-0 z-50 pointer-events-none bg-white animate-flashbang-blinding flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="w-96 h-96 rounded-full bg-white animate-flashbang-burst filter blur-md" />
          </div>
        )}

        <h1
          id="flashbang-final-message"
          className="text-4xl sm:text-6xl md:text-7xl font-black text-black tracking-tight text-center font-sans mb-8 animate-in fade-in zoom-in-90 duration-500"
        >
          中国人不会再飞了
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-4 z-10">
          <a
            id="give-up-video-link"
            href={TARGET_VIDEO_URL}
            className="px-8 py-3 rounded-full bg-black text-white font-bold text-base tracking-wider hover:bg-neutral-800 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            去看视频 🎬
          </a>
          <button
            id="retry-button"
            onClick={handleReset}
            className="px-6 py-2.5 rounded-full border border-stone-300 text-stone-600 font-medium text-sm hover:border-black hover:text-black transition-all cursor-pointer active:scale-95"
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
      className={`min-h-screen w-full bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none ${
        isFlashbanging ? 'animate-screen-shake' : ''
      }`}
    >
      {/* Flashbang Active Blinding Whiteout Overlay */}
      {isFlashbanging && (
        <div
          className="fixed inset-0 z-50 pointer-events-none bg-white animate-flashbang-blinding flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="w-96 h-96 rounded-full bg-white animate-flashbang-burst filter blur-md" />
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
        className={`flex flex-col items-center justify-center transition-all duration-300 relative z-20 ${
          isFlashbanging ? 'scale-105 filter blur-xs opacity-60' : ''
        }`}
      >
        {/* 1. Meme Image Button */}
        <button
          id="meme-image-button"
          onClick={handleMemeClick}
          className="group relative bg-transparent border-0 p-0 m-0 cursor-pointer outline-hidden focus:outline-hidden transition-all duration-300 hover:scale-105 active:scale-95 hover-meme-wiggle"
          aria-label="惹不起，惹不起 meme button"
          title="惹不起，惹不起"
        >
          {/* The Meme Image */}
          <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 relative flex items-center justify-center bg-white">
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
            className="mt-8 sm:mt-12 flex items-center justify-center relative z-30 min-h-[160px] w-full max-w-2xl px-4 animate-in fade-in zoom-in-95 duration-200"
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
                className={`px-8 py-2.5 rounded-full font-black text-base tracking-wider shadow-md transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap border-2 inline-flex items-center justify-center text-center ${
                  isAccepted
                    ? 'bg-emerald-600 text-white border-emerald-700 ring-4 ring-emerald-200'
                    : 'bg-black text-white border-black hover:bg-neutral-800'
                }`}
              >
                {isAccepted ? '已答应 🎉 跳转中...' : '是的'}
              </a>
            </div>

            {/* Button 2: "不" (moves to the side dynamically as Button 1 grows, avoiding any overlap) */}
            <div
              className="flex items-center justify-center transition-transform duration-300 ease-out origin-center ml-8"
              style={{
                transform: `translateX(${noButtonTranslateX}px) scale(${Math.max(0.65, 1 - noClicks * 0.035)})`,
                opacity: Math.max(0.4, 1 - noClicks * 0.05),
                zIndex: 35,
              }}
            >
              <button
                id="button-2-no"
                onClick={handleNoClick}
                className="px-8 py-2.5 rounded-full font-black text-base tracking-wider bg-white text-black border-2 border-stone-400 hover:border-black hover:bg-stone-50 shadow-sm transition-all duration-150 cursor-pointer active:scale-90 whitespace-nowrap"
              >
                不
              </button>
            </div>
          </div>
        )}

        {/* Clicks countdown hint when "不" has been clicked */}
        {hasClickedMeme && noClicks > 0 && !isFlashbanging && (
          <div className="mt-8 text-xs text-stone-400 font-mono tracking-wider">
            {10 - noClicks} clicks left...
          </div>
        )}
      </div>
    </main>
  );
}
