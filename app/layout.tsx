import type { Metadata } from "next"
import { Playfair_Display, Inter } from "next/font/google"
import "./globals.css"

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
})

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ProShot Vogue - High Fashion AI Studio",
  description: "Transform your product photos into editorial masterpieces.",
  keywords: ["Fashion", "Editorial", "AI", "Photography", "Vogue"],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={`${playfair.variable} ${inter.variable}`} style={{ colorScheme: 'light' }}>
      <body className="font-sans antialiased bg-background text-foreground selection:bg-black selection:text-white">
        {/* Editorial Grid Lines - subtle */}
        <div className="fixed inset-0 pointer-events-none z-50 flex justify-between px-4 sm:px-8 md:px-12 opacity-10">
           <div className="w-px h-full bg-black"></div>
           <div className="w-px h-full bg-black hidden sm:block"></div>
           <div className="w-px h-full bg-black hidden md:block"></div>
           <div className="w-px h-full bg-black"></div>
        </div>
        
        {/* Main Content */}
        <div className="relative min-h-screen border-t-4 border-black">
          {children}
        </div>
      </body>
    </html>
  )
}
