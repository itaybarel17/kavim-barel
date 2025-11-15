import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { X, ChevronDown } from 'lucide-react';
import { getAreaColor } from '@/utils/areaColors';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface City {
  cityid: number;
  city: string;
  area: string | null;
  averagesupplyweek?: number | null;
}

interface CityTagProps {
  city: City;
  week: number;
  day: string;
  truck?: number;
  onRemove: () => void;
  isInPool?: boolean;
}

export const CityTag: React.FC<CityTagProps> = ({
  city,
  week,
  day,
  truck,
  onRemove,
  isInPool = false
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: isInPool ? 'city-from-pool' : 'city-from-day',
    item: { 
      cityId: city.cityid, 
      week, 
      day, 
      truck, 
      currentArea: city.area,
      type: isInPool ? 'city-from-pool' : 'city-from-day' 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const colorClass = getAreaColor(city.area || '');

  return (
    <div
      ref={drag}
      className={`relative flex items-center justify-between text-sm rounded-md px-3 py-2 cursor-move transition-all duration-200 shadow-sm ${
        isDragging ? 'opacity-50 scale-95 shadow-lg' : 'opacity-100 hover:shadow-md'
      } ${colorClass}`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="truncate font-medium">
          {city.city}
        </span>
        {city.averagesupplyweek && (
          <Badge variant="secondary" className="bg-white/90 text-gray-800 font-bold text-xs shrink-0">
            {city.averagesupplyweek}
          </Badge>
        )}
      </div>
      
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