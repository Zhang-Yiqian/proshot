import React from 'react';

export const ProShotIcon = ({ className = "", size = 32 }: { className?: string; size?: number }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="proshot-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(250, 80%, 60%)" />
          <stop offset="100%" stopColor="hsl(195, 85%, 50%)" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Background Shape - Soft Rounded Square with Gradient */}
      <rect x="0" y="0" width="32" height="32" rx="8" fill="url(#proshot-grad)" />
      
      {/* Lens Ring */}
      <circle cx="16" cy="16" r="8" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
      
      {/* Inner Lens */}
      <circle cx="16" cy="16" r="4" fill="white" fillOpacity="0.9" />
      
      {/* Shutter Blades Suggestion (Abstract) */}
      <path d="M16 8 L16 11" stroke="white" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
      <path d="M16 21 L16 24" stroke="white" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
      <path d="M8 16 L11 16" stroke="white" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
      <path d="M21 16 L24 16" stroke="white" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />

      {/* Magic Sparkle (AI Element) - Top Right */}
      <path 
        d="M24 4L25.5 7.5L29 8L26 10.5L26.5 14L23.5 12L20.5 14L21 10.5L18 8L21.5 7.5L24 4Z" 
        fill="white" 
        fillOpacity="0.9"
        transform="scale(0.8) translate(8, 0)"
      />
    </svg>
  );
};
