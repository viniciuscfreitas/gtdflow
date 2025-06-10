import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedCheckProps {
  isVisible: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AnimatedCheck({ isVisible, size = 'md', className }: AnimatedCheckProps) {
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShowCheck(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowCheck(false);
    }
  }, [isVisible]);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  if (!isVisible) return null;

  return (
    <div className={cn(
      "absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-lg backdrop-blur-sm",
      "transition-all duration-300 ease-out",
      showCheck ? "opacity-100 scale-100" : "opacity-0 scale-95",
      className
    )}>
      <div className={cn(
        "bg-green-500 rounded-full p-2 shadow-lg",
        "animate-bounce"
      )}>
        <CheckCircle2 className={cn(
          sizeClasses[size],
          "text-white"
        )} />
      </div>
    </div>
  );
} 