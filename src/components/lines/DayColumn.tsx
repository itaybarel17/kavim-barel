import React from 'react';
import { useDrop } from 'react-dnd';
import { CityTag } from './CityTag';
import { getAreaColor } from '@/utils/areaColors';

interface City {
  cityid: number;
  city: string;
  area: string | null;
  day: Record<string, any> | null;
}

interface DayColumnProps {
  day: string;
  week: number;
  cities: City[];
  areas: string[];
  onCityRemove: (cityId: number, week: number, day: string) => void;
  onCityMove: (cityId: number, fromWeek: number, fromDay: string, toWeek: number, toDay: string) => void;
  onCityAssign: (cityId: number, week: number, day: string) => void;
}

export const DayColumn: React.FC<DayColumnProps> = ({
  day,
  week,
  cities,
  areas,
  onCityRemove,
  onCityMove,
  onCityAssign
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: ['city-from-pool', 'city-from-day'],
    drop: (item: any) => {
      if (item.type === 'city-from-pool') {
        onCityAssign(item.cityId, week, day);
      } else if (item.type === 'city-from-day') {
        // Move city from one day to another
        if (item.week !== week || item.day !== day) {
          onCityMove(item.cityId, item.week, item.day, week, day);
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const dayNames = {
    'א': 'ראשון',
    'ב': 'שני', 
    'ג': 'שלישי',
    'ד': 'רביעי',
    'ה': 'חמישי'
  };

  return (
    <div className="space-y-1">
      {/* Areas box for this day - always shown with fixed height */}
      <div className="p-2 bg-card border border-border rounded-lg shadow-sm h-[96px]">
        <div className="flex flex-col gap-1">
          {areas.map((area, index) => (
            <div
              key={index}
              className={`${getAreaColor(area)} text-xs px-2 py-1 font-bold border rounded-sm`}
            >
              {area}
            </div>
          ))}
        </div>
      </div>
      
      {/* Main day card */}
      <div 
        ref={drop}
        className={`min-h-32 border-2 border-dashed rounded-lg p-3 transition-colors ${
          isOver ? 'border-primary bg-primary/5' : 'border-border bg-background'
        }`}
      >
        <h3 className="font-medium text-center mb-3 text-sm">
          {dayNames[day as keyof typeof dayNames]}
        </h3>
        
        <div className="space-y-2">
          {cities.map(city => (
            <CityTag
              key={city.cityid}
              city={city}
              week={week}
              day={day}
              onRemove={() => onCityRemove(city.cityid, week, day)}
            />
          ))}
        </div>
        
        {cities.length === 0 && (
          <div className="text-center text-muted-foreground text-xs mt-4">
            גרור עיר לכאן
          </div>
        )}
      </div>
    </div>
  );
};