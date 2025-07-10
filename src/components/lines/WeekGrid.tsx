import React from 'react';
import { DayColumn } from './DayColumn';

interface City {
  cityid: number;
  city: string;
  area: string | null;
  day: Record<string, any> | null;
}

interface WeekGridProps {
  week: number;
  cities: City[];
  onCityRemove: (cityId: number, week: number, day: string) => void;
  onCityMove: (cityId: number, fromWeek: number, fromDay: string, toWeek: number, toDay: string) => void;
}

export const WeekGrid: React.FC<WeekGridProps> = ({
  week,
  cities,
  onCityRemove,
  onCityMove
}) => {
  const days = ['א', 'ב', 'ג', 'ד', 'ה'];

  // Get cities assigned to this week and day
  const getCitiesForDay = (day: string) => {
    return cities.filter(city => {
      if (!city.day) return false;
      const weekKey = `week${week}`;
      return city.day[weekKey]?.includes(day);
    });
  };

  return (
    <div className="grid grid-cols-5 gap-4">
      {days.map(day => (
        <DayColumn
          key={day}
          day={day}
          week={week}
          cities={getCitiesForDay(day)}
          onCityRemove={onCityRemove}
          onCityMove={onCityMove}
        />
      ))}
    </div>
  );
};