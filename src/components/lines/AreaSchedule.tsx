import React from 'react';
import { getAreaColor } from '@/utils/areaColors';
import { Badge } from '@/components/ui/badge';

interface AreaScheduleProps {
  areas: Record<string, string[]>;
}

export const AreaSchedule: React.FC<AreaScheduleProps> = ({ areas }) => {
  const days = ['א', 'ב', 'ג', 'ד', 'ה'];
  const dayNames = {
    'א': 'ראשון',
    'ב': 'שני', 
    'ג': 'שלישי',
    'ד': 'רביעי',
    'ה': 'חמישי'
  };

  return (
    <div className="flex flex-wrap gap-4 text-sm">
      {days.map(day => (
        <div key={day} className="flex flex-col items-center">
          <div className="font-medium mb-1 text-xs">
            {dayNames[day as keyof typeof dayNames]}
          </div>
          <div className="flex flex-wrap gap-1 justify-center">
            {areas[day]?.map((area, index) => (
              <Badge
                key={index}
                variant="secondary"
                className={`text-xs px-2 py-0.5 ${getAreaColor(area)}`}
              >
                {area}
              </Badge>
            )) || (
              <span className="text-muted-foreground text-xs">-</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};