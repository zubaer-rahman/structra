"use client"

import React from "react";
import { cn } from "@/lib/utils";

interface RandomAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

const getInitials = (name: string): string => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 1);
};

const generateSeed = (name: string): number => {
  return name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
};

const getRandomColor = (name: string): string => {
  const colors = [
    "#EA580C", "#EA580C", "#EA580C", "#EA580C", // Force orange-600 for all avatars
    "#EA580C", "#EA580C", "#EA580C", "#EA580C"  // Force orange-600 for all avatars
  ];
  const seed = generateSeed(name);
  return colors[seed % colors.length];
};

export const RandomAvatar: React.FC<RandomAvatarProps> = ({ 
  name, 
  size = 48, 
  className 
}) => {
  const initials = getInitials(name);
  const bgColor = getRandomColor(name);
  
  const sizeClasses: Record<number, string> = {
    24: "w-6 h-6",
    32: "w-8 h-8", 
    40: "w-10 h-10",
    48: "w-12 h-12",
    56: "w-14 h-14",
    64: "w-16 h-16"
  };

  return (
    <div 
      className={cn(
        "relative rounded-full overflow-hidden flex items-center justify-center",
        sizeClasses[size] || "w-12 h-12",
        className
      )}
      style={{ 
        width: size, 
        height: size,
        backgroundColor: bgColor
      }}
    >
      <span className="text-white font-semibold" style={{
        fontSize: `${Math.max(size * 0.4, 14)}px`,
        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
      }}>
        {initials}
      </span>
    </div>
  );
};

export default RandomAvatar;
