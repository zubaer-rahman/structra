"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "ghost" | "outline" | "default";
  showLabel?: boolean;
}

export function ThemeToggle({
  className,
  variant = "ghost",
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant={variant}
        size="sm"
        aria-label="Toggle theme"
        className={cn(
          "w-9 h-9 p-0 rounded-full border border-gray-200/50 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md text-gray-700 dark:text-gray-300",
          className
        )}
      >
        <span className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          aria-label="Select theme"
          className={cn(
            "relative w-9 h-9 p-0 rounded-full border border-gray-200/60 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 backdrop-blur-md text-gray-700 dark:text-gray-200 transition-all duration-200 shadow-sm",
            showLabel && "w-auto px-3 gap-2",
            className
          )}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100 text-orange-400" />
          {showLabel && (
            <span className="text-xs font-medium capitalize">
              {theme || "Theme"}
            </span>
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-36 p-1.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/95 dark:bg-[#161616]/95 backdrop-blur-xl shadow-xl"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={cn(
            "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors",
            theme === "light"
              ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
          )}
        >
          <div className="flex items-center gap-2">
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span>Light</span>
          </div>
          {theme === "light" && <Check className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={cn(
            "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors",
            theme === "dark"
              ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
          )}
        >
          <div className="flex items-center gap-2">
            <Moon className="h-3.5 w-3.5 text-orange-400" />
            <span>Dark</span>
          </div>
          {theme === "dark" && <Check className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={cn(
            "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors",
            theme === "system"
              ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
          )}
        >
          <div className="flex items-center gap-2">
            <Monitor className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            <span>System</span>
          </div>
          {theme === "system" && <Check className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ThemeToggle;
