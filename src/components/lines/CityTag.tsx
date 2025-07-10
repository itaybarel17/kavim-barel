import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { X, ChevronDown } from 'lucide-react';
import { getAreaColor } from '@/utils/areaColors';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface City {
  cityid: number;
  city: string;
  area: string | null;
}

interface CityTagProps {
  city: City;
  week: number;
  day: string;
  onRemove: () => void;
  isInPool?: boolean;
}

export const CityTag: React.FC<CityTagProps> = ({
  city,
  week,
  day,
  onRemove,
  isInPool = false
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: isInPool ? 'city-from-pool' : 'city-from-day',
    item: { cityId: city.cityid, week, day, type: isInPool ? 'city-from-pool' : 'city-from-day' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const colorClass = getAreaColor(city.area || '');

  return (
    <div
      ref={drag}
      className={`relative flex items-center justify-between text-xs rounded px-2 py-1 cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      } ${colorClass}`}
    >
      <span className="truncate flex-1">{city.city}</span>
      
      <div className="flex items-center gap-1 ml-1">
        {/* Future dropdown for customers */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 text-current hover:bg-white/20"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <div className="p-2 text-sm text-muted-foreground">
              רשימת לקוחות תתווסף בהמשך
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {!isInPool && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-4 w-4 p-0 text-current hover:bg-white/20"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};