"use client";

import { useState } from "react";
import { PanelLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface SidebarControlMenuProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function SidebarControlMenu({
  isCollapsed,
  onToggleCollapse,
}: SidebarControlMenuProps) {
  const [value, setValue] = useState(isCollapsed ? "collapsed" : "expanded");

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    
    if (newValue === "expanded" && isCollapsed) {
      onToggleCollapse();
    } else if (newValue === "collapsed" && !isCollapsed) {
      onToggleCollapse();
    }
    // Hover mode logic can be implemented here
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center justify-center w-8 h-8 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex-shrink-0"
        >
          <PanelLeft className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="start"
        className="w-48 p-3"
        side="top"
        sideOffset={8}
      >
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Sidebar control</div>
          
          <RadioGroup value={value} onValueChange={handleValueChange}>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expanded" id="expanded" />
                <Label htmlFor="expanded" className="text-xs text-gray-600 cursor-pointer">
                  Expanded
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="collapsed" id="collapsed" />
                <Label htmlFor="collapsed" className="text-xs text-gray-600 cursor-pointer">
                  Collapsed
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hover" id="hover" />
                <Label htmlFor="hover" className="text-xs text-gray-600 cursor-pointer">
                  Expand on hover
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
