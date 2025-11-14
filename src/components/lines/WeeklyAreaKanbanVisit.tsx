import React from 'react';
import { useDrop } from 'react-dnd';
import { AreaTagVisit } from './AreaTagVisit';

interface DistributionGroup {
  groups_id: number;
  separation: string;
  dayvisit: string[] | null;
  freq: number[] | null;
  orderlabelinkavim: number | null;
  agentsworkarea: number[] | null;
}

interface WeeklyAreaKanbanVisitProps {
  distributionGroups: DistributionGroup[];
  onAreaAssign: (area: string, day: string, isDayToDay?: boolean, groupId?: number) => void;
  onAreaRemove: (area: string, day: string) => void;
}

export const WeeklyAreaKanbanVisit: React.FC<WeeklyAreaKanbanVisitProps> = ({
  distributionGroups,
  onAreaAssign,
  onAreaRemove
}) => {
  const days = ['ה', 'ד', 'ג', 'ב', 'א'];
  const dayNames = {
    'א': 'ראשון',
    'ב': 'שני',
    'ג': 'שלישי',
    'ד': 'רביעי',
    'ה': 'חמישי'
  };

  // Get areas assigned to each day with their group IDs and agent info
  const getAreasForDay = (targetDay: string) => {
    const areas: { area: string; groupId: number; agentsworkarea: number[] | null }[] = [];
    
    distributionGroups.forEach(group => {
      if (!group.dayvisit || !group.separation) return;
      
      const mainArea = group.separation.replace(/\s+\d+$/, '').trim();
      
      // dayvisit is already an array of strings - just check if targetDay is in it
      if (group.dayvisit.includes(targetDay)) {
        // Check if this exact area already exists (to avoid duplicates)
        const existingArea = areas.find(a => a.area === mainArea && a.groupId === group.groups_id);
        if (!existingArea) {
          areas.push({
            area: mainArea, 
            groupId: group.groups_id,
            agentsworkarea: group.agentsworkarea
          });
        }
      }
    });
    
    return areas;
  };

  const DayColumn: React.FC<{ day: string; areas: { area: string; groupId: number; agentsworkarea: number[] | null }[] }> = ({ day, areas }) => {
    const [{ isOver }, drop] = useDrop({
      accept: ['area-from-pool-visit', 'area-from-day-visit'],
      drop: (item: any) => {
        if (item.type === 'area-from-pool-visit') {
          onAreaAssign(item.area, day, false);
        } else if (item.type === 'area-from-day-visit' && item.day !== day) {
          // Move area from one day to another - use isDayToDay flag with groupId
          onAreaAssign(item.area, day, true, item.groupId);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    });

    return (
      <div
        ref={drop}
        className={`bg-card rounded-lg p-4 min-h-[200px] border-2 border-dashed transition-colors ${
          isOver ? 'border-primary bg-primary/5' : 'border-border'
        }`}
      >
        <h3 className="font-medium text-center mb-3 text-sm">
          {dayNames[day as keyof typeof dayNames]}
        </h3>
        
        <div className="space-y-2">
          {areas.map(areaItem => (
            <AreaTagVisit
              key={`${areaItem.area}-${areaItem.groupId}-${day}`}
              area={areaItem.area}
              day={day}
              groupId={areaItem.groupId}
              agentsWorkArea={areaItem.agentsworkarea as unknown as number[]}
              onRemove={() => onAreaRemove(areaItem.area, day)}
            />
          ))}
        </div>
        
        {areas.length === 0 && (
          <div className="text-center text-muted-foreground text-sm mt-8">
            גרור אזור לכאן
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-background rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-right">שיוך אזורים לימים (ביקורים)</h2>
      <div className="grid grid-cols-5 gap-4">
        {days.map(day => (
          <DayColumn
            key={day}
            day={day}
            areas={getAreasForDay(day)}
          />
        ))}
      </div>
    </div>
  );
};