import React from 'react';
import { useDrop } from 'react-dnd';
import { CityTag } from './CityTag';
import { CopyMoveMenu } from './CopyMoveMenu';
import { getAreaColor } from '@/utils/areaColors';

interface City {
  cityid: number;
  city: string;
  area: string | null;
  day: Record<string, any> | null;
}

interface TruckColumnProps {
  day: string;
  week: number;
  truckNumber: number;
  cities: City[];
  areas: string[];
  onCityRemove: (cityId: number, week: number, day: string, truck: number) => void;
  onCityMove: (cityId: number, fromWeek: number, fromDay: string, fromTruck: number, toWeek: number, toDay: string, toTruck: number) => void;
  onCityAssign: (cityId: number, week: number, day: string, truck: number) => void;
  onCopyTruck: (fromWeek: number, fromDay: string, fromTruck: number, toWeek: number, toDay: string, toTruck: number) => void;
  onMoveTruck: (fromWeek: number, fromDay: string, fromTruck: number, toWeek: number, toDay: string, toTruck: number) => void;
}

export const TruckColumn: React.FC<TruckColumnProps> = ({
  day,
  week,
  truckNumber,
  cities,
  areas,
  onCityRemove,
  onCityMove,
  onCityAssign,
  onCopyTruck,
  onMoveTruck
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: ['city-from-pool', 'city-from-day', 'truck-copy', 'truck-move'],
    drop: (item: any) => {
      if (item.type === 'city-from-pool') {
        onCityAssign(item.cityId, week, day, truckNumber);
      } else if (item.type === 'city-from-day') {
        if (item.week !== week || item.day !== day || item.truck !== truckNumber) {
          onCityMove(item.cityId, item.week, item.day, item.truck, week, day, truckNumber);
        }
      } else if (item.type === 'truck-copy') {
        if (item.week !== week || item.day !== day || item.truck !== truckNumber) {
          onCopyTruck(item.week, item.day, item.truck, week, day, truckNumber);
        }
      } else if (item.type === 'truck-move') {
        if (item.week !== week || item.day !== day || item.truck !== truckNumber) {
          onMoveTruck(item.week, item.day, item.truck, week, day, truckNumber);
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Determine background color based on areas
  const getBackgroundColor = () => {
    if (areas.length === 0) return 'bg-background';
    if (areas.length === 1) {
      return truckNumber === 1 ? 'bg-primary/5' : 'bg-background';
    }
    if (areas.length <= 4) {
      const areaIndex = truckNumber - 1;
      if (areaIndex < areas.length) {
        return 'bg-primary/5';
      }
    }
    return 'bg-background';
  };

  const dayNames = {
    'א': 'ראשון',
    'ב': 'שני', 
    'ג': 'שלישי',
    'ד': 'רביעי',
    'ה': 'חמישי'
  };

  return (
    <div 
      ref={drop}
      className={`relative min-h-24 border-2 rounded-lg p-2 transition-all duration-200 ${
        isOver ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/30' : 'border-border ' + getBackgroundColor()
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-xs">
          {dayNames[day as keyof typeof dayNames]} - משאית {truckNumber}
        </h4>
        
        <CopyMoveMenu 
          week={week}
          day={day}
          truck={truckNumber}
          disabled={cities.length === 0}
        />
      </div>
      
      <div className="space-y-1">
        {cities.map(city => (
          <CityTag
            key={city.cityid}
            city={city}
            week={week}
            day={day}
            truck={truckNumber}
            onRemove={() => onCityRemove(city.cityid, week, day, truckNumber)}
          />
        ))}
      </div>
      
      {cities.length === 0 && (
        <div className="text-center text-muted-foreground text-xs mt-2">
          גרור עיר לכאן
        </div>
      )}
    </div>
  );
};