import React, { useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { Plus } from 'lucide-react';
import { AreaTagVisit } from './AreaTagVisit';
import { getAreaColor } from '@/utils/areaColors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DistributionGroup {
  groups_id: number;
  separation: string;
  dayvisit: string[] | null;
  freq: number[] | null;
  orderlabelinkavim: number | null;
  agentsworkarea: string | null;
  totalsupplyspots: number | null;
}

interface AreaPoolVisitProps {
  distributionGroups: DistributionGroup[];
  onAreaAssign: (area: string, day: string) => void;
}

export const AreaPoolVisit: React.FC<AreaPoolVisitProps> = ({
  distributionGroups,
  onAreaAssign
}) => {
  const [draggedAreas, setDraggedAreas] = useState<Set<string>>(new Set());

  const [{ isOver }, drop] = useDrop({
    accept: ['area-from-day-visit'],
    drop: (item: any) => {
      // Area dropped back to pool - remove from its assigned day
      setDraggedAreas(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.area);
        return newSet;
      });
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleAreaDrag = (area: string) => {
    setDraggedAreas(prev => new Set([...prev, area]));
  };

  const handleRestoreArea = (area: string) => {
    setDraggedAreas(prev => {
      const newSet = new Set(prev);
      newSet.delete(area);
      return newSet;
    });
  };

  // Get all areas from distribution groups with their order
  const areasWithOrder = distributionGroups
    .filter(group => group.separation)
    .map(group => ({
      area: group.separation!,
      orderlabelinkavim: group.orderlabelinkavim || 0,
      agentsworkarea: group.agentsworkarea,
      totalsupplyspots: group.totalsupplyspots || 0
    }))
    .sort((a, b) => a.orderlabelinkavim - b.orderlabelinkavim);

  const allAreas = areasWithOrder;

  // Check if area is assigned to any day
  const isAreaAssigned = (area: string) => {
    return distributionGroups.some(group => {
      if (!group.dayvisit || !group.separation) return false;
      if (group.separation !== area) return false;
      
      return group.dayvisit.some(dayString => {
        const daysArray = dayString.split(',').map(d => d.trim());
        return daysArray.some(day => ['א', 'ב', 'ג', 'ד', 'ה'].includes(day));
      });
    });
  };

  // Sync draggedAreas with actual assignment status
  useEffect(() => {
    setDraggedAreas(prev => {
      const newSet = new Set<string>();
      prev.forEach(area => {
        if (isAreaAssigned(area)) {
          newSet.add(area);
        }
      });
      return newSet;
    });
  }, [distributionGroups]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">מאגר אזורים (ביקורים)</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={drop}
          className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 ${
            isOver ? 'bg-muted/50 rounded-lg p-2' : ''
          }`}
        >
          {allAreas.map((areaItem, index) => {
            const isDragged = draggedAreas.has(areaItem.area);
            const isAssigned = isAreaAssigned(areaItem.area);
            
            return (
              <div key={areaItem.area} className="relative">
                <div 
                  onDragStart={() => handleAreaDrag(areaItem.area)}
                >
                  <div className={`relative flex items-center justify-between text-sm rounded px-3 py-2 cursor-move transition-all ${getAreaColor(areaItem.area)}`}>
                    <span className="truncate flex-1 font-medium">
                      {areaItem.area}
                      {(() => {
                        const getAgentNumbers = () => {
                          if (!areaItem.agentsworkarea || !Array.isArray(areaItem.agentsworkarea) || areaItem.agentsworkarea.length === 0) return '';
                          return ` (${areaItem.agentsworkarea.join(', ')})`;
                        };
                        return getAgentNumbers();
                      })()}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({areaItem.totalsupplyspots})
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};