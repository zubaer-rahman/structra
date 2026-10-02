"use client"

import React from "react";
import { cn } from "@/lib/utils";

interface RandomAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

const getInitials = (name: string): string => {
  if (!name) return 'U';
  const clean = name.trim().replace(/^[^a-zA-Z0-9]+/, '');
  if (!clean) return 'U';
  return clean
    .split(/\s+/)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 1);
};

const generateSeed = (name: string): number => {
  return name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
};

const getRandomColor = (name: string): string => {
  // Use consistent vibrant brand orange-600
  const colors = [
    "#EA580C", "#EA580C", "#EA580C", "#EA580C",
    "#EA580C", "#EA580C", "#EA580C", "#EA580C"
  ];
  const seed = generateSeed(name);
  return colors[seed % colors.length];
};

export const RandomAvatar: React.FC<RandomAvatarProps> = ({ 
  name, 
  size = 40, 
  className 
}) => {
  const initials = getInitials(name);
  const bgColor = getRandomColor(name);
  
  const sizeClasses: Record<number, string> = {
    24: "w-6 h-6",
    28: "w-7 h-7",
    32: "w-8 h-8",
    36: "w-9 h-9",
    40: "w-10 h-10",
    44: "w-11 h-11",
    48: "w-12 h-12",
    56: "w-14 h-14",
    64: "w-16 h-16",
    80: "w-20 h-20"
  };

  const fontSize = Math.max(Math.round(size * 0.42), 12);
  const isFluidWidth = className?.includes("w-full") || className?.includes("size-full");
  const isFluidHeight = className?.includes("h-full") || className?.includes("size-full");

  return (
    <div 
      className={cn(
        "relative rounded-full overflow-hidden flex items-center justify-center shrink-0 select-none",
        sizeClasses[size] || "",
        className
      )}
      style={{ 
        width: isFluidWidth ? "100%" : size, 
        height: isFluidHeight ? "100%" : size,
        backgroundColor: bgColor
      }}
    >
      <span 
        className="font-bold text-white flex items-center justify-center text-center select-none leading-none tracking-normal" 
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: 1,
          height: `${fontSize}px`
        }}
      >
        {initials}
      </span>
    </div>
  );
};

export default RandomAvatar;
