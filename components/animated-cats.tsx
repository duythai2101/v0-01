"use client"

import { useEffect, useState } from "react"

interface Cat {
  id: number
  delay: number
  duration: number
  size: number
  yPosition: number
  color: string
  variant: number
}

const CatSVG = ({ color, size }: { color: string; size: number }) => {
  return (
    <svg
      width={size}
      height={size * 0.8}
      viewBox="0 0 100 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="cat-svg"
    >
      {/* Shadow */}
      <ellipse cx="50" cy="75" rx="30" ry="5" fill="currentColor" opacity="0.15" className="cat-shadow" />

      {/* Tail - more curved and detailed */}
      <path
        d="M 20 50 Q 8 45, 10 30 Q 12 18, 18 22 Q 20 24, 22 28"
        stroke={color}
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
        className="cat-tail"
      />
      <path
        d="M 20 50 Q 8 45, 10 30 Q 12 18, 18 22"
        stroke={color}
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Body with fur texture */}
      <ellipse cx="50" cy="50" rx="25" ry="20" fill={color} />
      <ellipse cx="50" cy="50" rx="23" ry="18" fill={color} opacity="0.9" />

      {/* Chest/belly */}
      <ellipse cx="55" cy="52" rx="12" ry="10" fill="white" opacity="0.4" />

      {/* Back leg (behind) */}
      <g className="leg-back-left">
        <rect x="35" y="60" width="7" height="16" rx="3.5" fill={color} />
        <ellipse cx="38.5" cy="75" rx="4.5" ry="3.5" fill={color} />
        <ellipse cx="38.5" cy="75" rx="3.5" ry="2.5" fill="#2C3E50" opacity="0.1" />
      </g>

      <g className="leg-back-right">
        <rect x="56" y="60" width="7" height="16" rx="3.5" fill={color} />
        <ellipse cx="59.5" cy="75" rx="4.5" ry="3.5" fill={color} />
        <ellipse cx="59.5" cy="75" rx="3.5" ry="2.5" fill="#2C3E50" opacity="0.1" />
      </g>

      {/* Head with more details */}
      <circle cx="65" cy="35" r="18" fill={color} />
      <circle cx="65" cy="35" r="16" fill={color} opacity="0.95" />

      {/* Face marking */}
      <ellipse cx="65" cy="38" rx="10" ry="8" fill="white" opacity="0.3" />

      {/* Ears with more detail */}
      <g className="ear-left">
        <path d="M 55 20 L 50 8 L 60 18 Z" fill={color} />
        <path d="M 55 20 L 52 11 L 59 18 Z" fill={color} opacity="0.8" />
        <path d="M 55 18 L 53 13 L 58 17 Z" fill="#FFB6C1" opacity="0.7" />
      </g>

      <g className="ear-right">
        <path d="M 75 20 L 80 8 L 70 18 Z" fill={color} />
        <path d="M 75 20 L 78 11 L 71 18 Z" fill={color} opacity="0.8" />
        <path d="M 75 18 L 77 13 L 72 17 Z" fill="#FFB6C1" opacity="0.7" />
      </g>

      {/* Eyes with more expression */}
      <g className="eyes">
        <ellipse cx="60" cy="33" rx="4" ry="5" fill="white" />
        <ellipse cx="70" cy="33" rx="4" ry="5" fill="white" />
        <circle cx="60" cy="33.5" r="3" fill="#2C3E50" className="cat-eye-left" />
        <circle cx="70" cy="33.5" r="3" fill="#2C3E50" className="cat-eye-right" />
        <circle cx="61" cy="32" r="1.5" fill="white" opacity="0.9" />
        <circle cx="71" cy="32" r="1.5" fill="white" opacity="0.9" />
      </g>

      {/* Nose with more detail */}
      <path d="M 65 38 L 62 41 L 68 41 Z" fill="#FF69B4" />
      <ellipse cx="65" cy="40" rx="2" ry="1" fill="#FF1493" opacity="0.3" />

      {/* Mouth with smile */}
      <path
        d="M 65 41 Q 61 44, 58 42 M 65 41 Q 69 44, 72 42"
        stroke="#2C3E50"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        className="cat-mouth"
      />

      {/* Whiskers - longer and more natural */}
      <line x1="50" y1="34" x2="38" y2="31" stroke="#2C3E50" strokeWidth="1" opacity="0.6" className="whisker" />
      <line x1="50" y1="37" x2="35" y2="37" stroke="#2C3E50" strokeWidth="1" opacity="0.6" className="whisker" />
      <line x1="50" y1="40" x2="38" y2="43" stroke="#2C3E50" strokeWidth="1" opacity="0.6" className="whisker" />
      <line x1="80" y1="34" x2="92" y2="31" stroke="#2C3E50" strokeWidth="1" opacity="0.6" className="whisker" />
      <line x1="80" y1="37" x2="95" y2="37" stroke="#2C3E50" strokeWidth="1" opacity="0.6" className="whisker" />
      <line x1="80" y1="40" x2="92" y2="43" stroke="#2C3E50" strokeWidth="1" opacity="0.6" className="whisker" />

      {/* Front legs (in front) with walking animation */}
      <g className="leg-front-left">
        <rect x="46" y="60" width="7" height="16" rx="3.5" fill={color} />
        <ellipse cx="49.5" cy="75" rx="4.5" ry="3.5" fill={color} />
        <ellipse cx="49.5" cy="75" rx="3.5" ry="2.5" fill="#2C3E50" opacity="0.1" />
        {/* Toe beans */}
        <circle cx="48" cy="75" r="0.8" fill="#FF69B4" opacity="0.5" />
        <circle cx="51" cy="75" r="0.8" fill="#FF69B4" opacity="0.5" />
      </g>

      <g className="leg-front-right">
        <rect x="67" y="60" width="7" height="16" rx="3.5" fill={color} />
        <ellipse cx="70.5" cy="75" rx="4.5" ry="3.5" fill={color} />
        <ellipse cx="70.5" cy="75" rx="3.5" ry="2.5" fill="#2C3E50" opacity="0.1" />
        {/* Toe beans */}
        <circle cx="69" cy="75" r="0.8" fill="#FF69B4" opacity="0.5" />
        <circle cx="72" cy="75" r="0.8" fill="#FF69B4" opacity="0.5" />
      </g>

      <style jsx>{`
        @keyframes wag-tail {
          0%, 100% { 
            transform: rotate(0deg) translateX(0); 
          }
          25% { 
            transform: rotate(-15deg) translateX(-2px); 
          }
          50% { 
            transform: rotate(5deg) translateX(1px); 
          }
          75% { 
            transform: rotate(-10deg) translateX(-1px); 
          }
        }
        
        @keyframes blink {
          0%, 92%, 100% { 
            transform: scaleY(1);
            opacity: 1; 
          }
          95% { 
            transform: scaleY(0.1);
            opacity: 0.5; 
          }
        }
        
        @keyframes walk-front-left {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(-5deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(1px) rotate(2deg); }
        }
        
        @keyframes walk-front-right {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(1px) rotate(2deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-3px) rotate(-5deg); }
        }
        
        @keyframes walk-back-left {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(1px); }
          50% { transform: translateY(0); }
          75% { transform: translateY(-2px); }
        }
        
        @keyframes walk-back-right {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-2px); }
          50% { transform: translateY(0); }
          75% { transform: translateY(1px); }
        }
        
        @keyframes ear-wiggle {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-3deg); }
        }
        
        @keyframes whisker-twitch {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-1px); }
        }
        
        @keyframes bounce-body {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-2px); }
          75% { transform: translateY(-1px); }
        }
        
        @keyframes shadow-pulse {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          25% { transform: scale(0.95); opacity: 0.12; }
          75% { transform: scale(0.97); opacity: 0.13; }
        }
        
        .cat-tail {
          animation: wag-tail 1.2s ease-in-out infinite;
          transform-origin: 20px 50px;
        }
        
        .cat-eye-left,
        .cat-eye-right {
          animation: blink 4s ease-in-out infinite;
          transform-origin: center;
        }
        
        .cat-eye-right {
          animation-delay: 0.1s;
        }
        
        .leg-front-left {
          animation: walk-front-left 0.6s ease-in-out infinite;
          transform-origin: 49.5px 68px;
        }
        
        .leg-front-right {
          animation: walk-front-right 0.6s ease-in-out infinite;
          transform-origin: 70.5px 68px;
        }
        
        .leg-back-left {
          animation: walk-back-left 0.6s ease-in-out infinite;
          transform-origin: 38.5px 68px;
        }
        
        .leg-back-right {
          animation: walk-back-right 0.6s ease-in-out infinite;
          transform-origin: 59.5px 68px;
        }
        
        .ear-left {
          animation: ear-wiggle 2s ease-in-out infinite;
          transform-origin: 55px 20px;
        }
        
        .ear-right {
          animation: ear-wiggle 2s ease-in-out infinite 0.5s;
          transform-origin: 75px 20px;
        }
        
        .whisker {
          animation: whisker-twitch 3s ease-in-out infinite;
        }
        
        .cat-svg {
          animation: bounce-body 0.6s ease-in-out infinite;
        }
        
        .cat-shadow {
          animation: shadow-pulse 0.6s ease-in-out infinite;
        }
        
        .cat-mouth {
          animation: mouth-smile 3s ease-in-out infinite;
        }
        
        @keyframes mouth-smile {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </svg>
  )
}

export function AnimatedCats() {
  const [cats, setCats] = useState<Cat[]>([])

  const catColors = [
    "#FFB6C1", // Light pink
    "#FFD700", // Gold
    "#87CEEB", // Sky blue
    "#DDA0DD", // Plum
    "#F0E68C", // Khaki
    "#FFB347", // Pastel orange
    "#B19CD9", // Light purple
    "#77DD77", // Pastel green
    "#FF6961", // Pastel red
    "#AEC6CF", // Pastel blue
  ]

  useEffect(() => {
    const generateCats = () => {
      const newCats: Cat[] = []
      for (let i = 0; i < 10; i++) {
        newCats.push({
          id: i,
          delay: Math.random() * 20,
          duration: 18 + Math.random() * 12,
          size: 45 + Math.random() * 35,
          yPosition: Math.random() * 65,
          color: catColors[i % catColors.length],
          variant: Math.floor(Math.random() * 3),
        })
      }
      setCats(newCats)
    }

    generateCats()
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 dark:opacity-20">
      {cats.map((cat) => (
        <div
          key={cat.id}
          className="absolute animate-walk-cat"
          style={{
            left: "-120px",
            top: `${cat.yPosition}%`,
            animationDelay: `${cat.delay}s`,
            animationDuration: `${cat.duration}s`,
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))",
          }}
        >
          <CatSVG color={cat.color} size={cat.size} />
        </div>
      ))}
      <style jsx>{`
        @keyframes walk-cat {
          0% {
            transform: translateX(0) translateY(0) scaleX(1);
          }
          20% {
            transform: translateX(calc(20vw)) translateY(-8px) scaleX(1);
          }
          45% {
            transform: translateX(calc(90vw)) translateY(-3px) scaleX(1);
          }
          48% {
            transform: translateX(calc(100vw + 120px)) translateY(0) scaleX(1);
          }
          52% {
            transform: translateX(calc(100vw + 120px)) translateY(0) scaleX(-1);
          }
          70% {
            transform: translateX(calc(60vw)) translateY(-6px) scaleX(-1);
          }
          90% {
            transform: translateX(calc(15vw)) translateY(-4px) scaleX(-1);
          }
          100% {
            transform: translateX(-120px) translateY(0) scaleX(-1);
          }
        }

        .animate-walk-cat {
          animation-name: walk-cat;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  )
}
