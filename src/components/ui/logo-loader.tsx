import * as React from "react";
import { cn } from "@/lib/utils";

interface LogoLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
  text?: string;
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const textSizeMap = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
};

export function LogoLoader({
  size = "md",
  className,
  showText = false,
  text = "Loading...",
}: LogoLoaderProps) {
  // Generate unique gradient IDs to avoid conflicts if multiple loaders are used
  const gradientId = React.useId();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        className
      )}
    >
      <div className="relative">
        {/* Rotating ring background */}
        <div
          className={cn(
            "absolute inset-0 rounded-lg opacity-20",
            "animate-spin"
          )}
          style={{
            background: "conic-gradient(from 0deg, #3B82F6, #10B981, #3B82F6)",
            borderRadius: "8px",
            animationDuration: "3s",
          }}
        />
        
        {/* Main logo with pulsing effect */}
        <div className={cn("relative animate-[scale-pulse_2s_ease-in-out_infinite]", sizeMap[size])}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            <defs>
              <linearGradient id={`gradient-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="1">
                  <animate
                    attributeName="stop-color"
                    values="#3B82F6;#10B981;#3B82F6"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="100%" stopColor="#10B981" stopOpacity="1">
                  <animate
                    attributeName="stop-color"
                    values="#10B981;#3B82F6;#10B981"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </stop>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill={`url(#gradient-${gradientId})`} />
            <text
              x="16"
              y="22"
              fontFamily="serif"
              fontSize="18"
              fontWeight="bold"
              textAnchor="middle"
              fill="white"
            >
              स्व
            </text>
          </svg>
        </div>
      </div>

      {showText && (
        <div
          className={cn(
            "text-muted-foreground font-medium animate-pulse",
            textSizeMap[size]
          )}
        >
          {text}
        </div>
      )}

      <style>{`
        @keyframes scale-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.95;
          }
        }
      `}</style>
    </div>
  );
}

