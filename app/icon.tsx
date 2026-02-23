import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 24,
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="proshot-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
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
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}
