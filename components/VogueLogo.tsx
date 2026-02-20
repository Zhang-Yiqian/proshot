import React from 'react'

export const VogueLogo = ({ className = "", collapsed = false }: { className?: string, collapsed?: boolean }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Main Logo Text - Bodoni/Didot style */}
        <h1 className={`font-serif tracking-tighter font-bold text-black dark:text-white leading-none ${collapsed ? "text-3xl" : "text-4xl"}`}>
          {collapsed ? "P" : "PROSHOT"}
        </h1>
        
        {/* Accent Dot - Red */}
        <div className={`rounded-full bg-[#D00000] ${collapsed ? "w-2 h-2 absolute -right-1 bottom-1" : "w-2.5 h-2.5 ml-1 mb-1"}`} />
      </div>
    </div>
  )
}
