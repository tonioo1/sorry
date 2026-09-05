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
  // 4. isExploding: true -> explosion visual effects and screen shake
  // 5. isGivenUp: true -> webpage is completely erased, leaves ONLY "okay I give up"
  const [hasClickedMeme, setHasClickedMeme] = useState(false);
  const [noClicks, setNoClicks] = useState(0);
  const [isExploding, setIsExploding] = useState(false);
  const [isGivenUp, setIsGivenUp] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [randomMemes, setRandomMemes] = useState<RandomMeme[]>([]);

  // Particles for explosion
  const [particles, setParticles] = useState<Array<{
    id: number;
    tx: string;
    ty: string;
    size: number;
    color: string;
    delay: number;
  }>>([]);

  // Handle meme image click (toggles buttons expansion/retraction)
  const handleMemeClick = () => {
    if (isExploding || isGivenUp) return;
    sound.playPop();
    setHasClickedMeme((prev) => !prev);
  };

  // Handle button 2 ("不") click
  const handleNoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExploding || isGivenUp) return;

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
      // Trigger dramatic explosion!
      triggerExplosion();
    } else {
      sound.playGrow(nextClicks);
    }
  };

  // Handle button 1 ("是的") click
  const handleYesClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExploding || isGivenUp) return;
    sound.playPop();
    setIsAccepted(true);
  };

  // Trigger explosion animation
  const triggerExplosion = () => {
    setIsExploding(true);
    sound.playExplosion();

    // Generate 50 blast particles flying in all directions
    const newParticles = Array.from({ length: 50 }, (_, i) => {
      const angle = (i / 50) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const distance = 150 + Math.random() * 450;
      const tx = `${Math.cos(angle) * distance}px`;
      const ty = `${Math.sin(angle) * distance}px`;
      const size = 8 + Math.random() * 24;
      const colors = ['#ff2200', '#ff8800', '#ffdd00', '#111111', '#555555', '#ff4444', '#ffffff'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      return {
        id: i,
        tx,
        ty,
        size,
        color,
        delay: Math.random() * 0.1,
      };
    });
    setParticles(newParticles);

    // After explosion completes (1.1s), erase everything and leave only "okay I give up"
    setTimeout(() => {
      setIsExploding(false);
      setIsGivenUp(true);
    }, 1100);
  };

  // Reset helper
  const handleReset = () => {
    setHasClickedMeme(false);
    setNoClicks(0);
    setIsExploding(false);
    setIsGivenUp(false);
    setIsAccepted(false);
    setParticles([]);
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

  // If in the erased "okay I give up" final state:
  if (isGivenUp) {
    return (
      <main
        id="give-up-screen"
        className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-6 select-none cursor-pointer transition-opacity duration-700 ease-in"
        onClick={handleReset}
        title="Click anywhere to retry"
      >
        <h1
          id="give-up-message"
          className="text-3xl sm:text-5xl md:text-6xl font-black text-black tracking-tight text-center font-sans"
        >
          okay I give up
        </h1>
        <p className="text-xs text-stone-400 mt-6 tracking-widest uppercase hover:text-stone-600 transition-colors">
          (click anywhere to try again)
        </p>
      </main>
    );
  }

  return (
    <main
      id="main-app"
      className={`min-h-screen w-full bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none ${
        isExploding ? 'animate-screen-shake' : ''
      }`}
    >
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

      {/* Explosion Shockwave and Particles Overlay */}
      {isExploding && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
          {/* Central Blast Fireball */}
          <div className="w-48 h-48 rounded-full bg-radial from-yellow-300 via-orange-500 to-red-600 animate-explosion-flash filter blur-xs" />
          
          {/* White flash shockwave */}
          <div className="absolute inset-0 bg-white/70 animate-pulse pointer-events-none" />

          {/* Burst Particles */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full animate-particle"
              style={
                {
                  '--tx': p.tx,
                  '--ty': p.ty,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.color,
                  animationDelay: `${p.delay}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      {/* Center Stage Container */}
      <div
        className={`flex flex-col items-center justify-center transition-all duration-300 relative z-20 ${
          isExploding ? 'scale-125 opacity-20 filter blur-xs' : ''
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
              <button
                id="button-1-yes"
                onClick={handleYesClick}
                className={`px-8 py-2.5 rounded-full font-black text-base tracking-wider shadow-md transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap border-2 ${
                  isAccepted
                    ? 'bg-emerald-600 text-white border-emerald-700 ring-4 ring-emerald-200'
                    : 'bg-black text-white border-black hover:bg-neutral-800'
                }`}
              >
                {isAccepted ? '已答应 🎉' : '是的'}
              </button>
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
        {hasClickedMeme && noClicks > 0 && !isExploding && (
          <div className="mt-8 text-xs text-stone-400 font-mono tracking-wider">
            {10 - noClicks} clicks left...
          </div>
        )}
      </div>
    </main>
  );
}
