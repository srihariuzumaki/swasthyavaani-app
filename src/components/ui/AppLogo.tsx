import * as React from "react";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

export function AppLogo({ size = "md", className }: AppLogoProps) {
  // Generate unique gradient ID to avoid conflicts if multiple logos are used
  const gradientId = React.useId();
  
  return (
    <svg
      className={cn(sizeMap[size], className)}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="8" fill={`url(#app-logo-gradient-${gradientId})`} />
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
      <defs>
        <linearGradient id={`app-logo-gradient-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="1" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

