import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  showText?: boolean;
}

export const Logo = ({ width = 32, height = 32, className = "", showText = true }: LogoProps) => {
  return (
    <Link href="/" className={`flex items-center gap-3 group ${className}`}>
      <div className="relative overflow-hidden rounded-lg shadow-sm transition-transform duration-200 group-hover:scale-105">
        <Image 
          src="/assets/logo.png" 
          alt="ProShot Logo" 
          width={width} 
          height={height}
          className="object-cover"
        />
      </div>
      {showText && (
        <span className="font-sans font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
          ProShot
        </span>
      )}
    </Link>
  );
};
