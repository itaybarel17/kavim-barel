import React from 'react';
import { TruckColumn } from './TruckColumn';
import { getAreaColor } from '@/utils/areaColors';

interface City {
  cityid: number;
  city: string;
  area: string | null;
  day: Record<string, any> | null;
}

interface TruckGridProps {
  week: number;
  cities: City[];
  areas: Record<string, string[]>;
  onCityRemove: (cityId: number, week: number, day: string, truck: number) => void;
  onCityMove: (cityId: number, fromWeek: number, fromDay: string, fromTruck: number, toWeek: number, toDay: string, toTruck: number) => void;
  onCityAssign: (cityId: number, week: number, day: string, truck: number) => void;
  onCopyTruck: (fromWeek: number, fromDay: string, fromTruck: number, toWeek: number, toDay: string, toTruck: number) => void;
  onMoveTruck: (fromWeek: number, fromDay: string, fromTruck: number, toWeek: number, toDay: string, toTruck: number) => void;
}

export const TruckGrid: React.FC<TruckGridProps> = ({
  week,
  cities,
  areas,
  onCityRemove,
  onCityMove,
  onCityAssign,
  onCopyTruck,
  onMoveTruck
}) => {
  const days = ['א', 'ב', 'ג', 'ד', 'ה'];

  // Get cities assigned to this week, day and truck
  const getCitiesForTruck = (day: string, truck: number) => {
    return cities.filter(city => {
      if (!city.day) return false;
      const weekKey = `week${week}`;
      const dayData = city.day[weekKey];
      if (!dayData || typeof dayData !== 'object') return false;
      const truckData = dayData[day];
      return Array.isArray(truckData) && truckData.includes(truck);
    });
  };

  return (
    <div className="space-y-4">
      {/* Areas header for each day */}
      <div className="grid grid-cols-5 gap-4" dir="rtl">
        {days.map(day => (
          <div key={day} className="p-2 bg-card border border-border rounded-lg shadow-sm min-h-[80px]">
            <div className="flex flex-col gap-1.5">
              {(areas[day] || []).map((area, index) => (
                <div
                  key={index}
                  className={`${getAreaColor(area)} text-sm px-3 py-1.5 font-medium border rounded-md shadow-sm transition-all hover:shadow-md`}
                >
                  {area}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Truck columns grid */}
      <div className="grid grid-cols-5 gap-4" dir="rtl">
        {days.map(day => (
          <div key={day} className="space-y-2">
            {[1, 2, 3, 4].map(truck => (
              <TruckColumn
                key={`${day}-${truck}`}
                day={day}
                week={week}
                truckNumber={truck}
                cities={getCitiesForTruck(day, truck)}
                areas={areas[day] || []}
                onCityRemove={onCityRemove}
                onCityMove={onCityMove}
                onCityAssign={onCityAssign}
                onCopyTruck={onCopyTruck}
                onMoveTruck={onMoveTruck}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
