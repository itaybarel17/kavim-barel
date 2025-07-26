import React from 'react';
import { useDrop } from 'react-dnd';
import { AreaTag } from './AreaTag';

interface DistributionGroup {
  groups_id: number;
  separation: string;
  days: string[] | null;
  freq: number[] | null;
}

interface WeeklyAreaKanbanProps {
  distributionGroups: DistributionGroup[];
  onAreaAssign: (area: string, day: string, isDayToDay?: boolean, groupId?: number) => void;
  onAreaRemove: (area: string, day: string) => void;
}

export const WeeklyAreaKanban: React.FC<WeeklyAreaKanbanProps> = ({
  distributionGroups,
  onAreaAssign,
  onAreaRemove
}) => {
  const days = ['א', 'ב', 'ג', 'ד', 'ה'];
  const dayNames = {
    'א': 'ראשון',
    'ב': 'שני', 
    'ג': 'שלישי',
    'ד': 'רביעי',
    'ה': 'חמישי'
  };

  // Get areas assigned to each day with their group IDs
  const getAreasForDay = (targetDay: string) => {
    const areas: { area: string; groupId: number }[] = [];
    
    distributionGroups.forEach(group => {
      if (!group.days || !group.separation) return;
      
      const mainArea = group.separation.replace(/\s+\d+$/, '').trim();
      
      group.days.forEach(dayString => {
        const daysArray = dayString.split(',').map(d => d.trim());
        if (daysArray.includes(targetDay)) {
          // Check if this exact area already exists (to avoid duplicates)
          const existingArea = areas.find(a => a.area === mainArea && a.groupId === group.groups_id);
          if (!existingArea) {
            areas.push({ area: mainArea, groupId: group.groups_id });
          }
        }
      });
    });
    
    return areas;
  };

  const DayColumn: React.FC<{ day: string }> = ({ day }) => {
    const [{ isOver }, drop] = useDrop({
      accept: ['area-from-pool', 'area-from-day'],
      drop: (item: any) => {
        if (item.type === 'area-from-pool') {
          onAreaAssign(item.area, day, false);
        } else if (item.type === 'area-from-day' && item.day !== day) {
          // Move area from one day to another - use isDayToDay flag with groupId
          onAreaAssign(item.area, day, true, item.groupId);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    });

    const areas = getAreasForDay(day);

    return (
      <div 
        ref={drop}
        className={`border border-border rounded-lg p-3 min-h-24 transition-colors ${
          isOver ? 'border-primary bg-primary/5' : 'bg-card'
        }`}
      >
        <h3 className="font-medium text-sm mb-3 text-center">
          {dayNames[day as keyof typeof dayNames]}
        </h3>
        
        <div className="space-y-2">
          {areas.map(areaItem => (
            <AreaTag
              key={`${areaItem.area}-${areaItem.groupId}-${day}`}
              area={areaItem.area}
              day={day}
              groupId={areaItem.groupId}
              onRemove={() => onAreaRemove(areaItem.area, day)}
            />
          ))}
        </div>
        
        {areas.length === 0 && (
          <div className="text-center text-muted-foreground text-xs mt-2">
            גרור אזור לכאן
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-5 gap-4" dir="rtl">
      {days.map(day => (
        <DayColumn key={day} day={day} />
      ))}
    </div>
  );
};