import React, { useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { Plus } from 'lucide-react';
import { AreaTag } from './AreaTag';
import { getAreaColor } from '@/utils/areaColors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DistributionGroup {
  groups_id: number;
  separation: string;
  days: string[] | null;
  freq: number[] | null;
  orderlabelinkavim: number | null;
  totalsupplyspots: number | null;
}

interface AreaPoolProps {
  distributionGroups: DistributionGroup[];
  onAreaAssign: (area: string, day: string) => void;
}

export const AreaPool: React.FC<AreaPoolProps> = ({
  distributionGroups,
  onAreaAssign
}) => {
  const [draggedAreas, setDraggedAreas] = useState<Set<string>>(new Set());

  const [{ isOver }, drop] = useDrop({
    accept: ['area-from-day'],
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

  // Get all areas from distribution groups with their order and totalsupplyspots
  const areasWithOrder = distributionGroups
    .filter(group => group.separation)
    .map(group => ({
      area: group.separation!,
      orderlabelinkavim: group.orderlabelinkavim || 0,
      totalsupplyspots: group.totalsupplyspots || 0
    }))
    .sort((a, b) => a.orderlabelinkavim - b.orderlabelinkavim);

  // Check if area is assigned to any day
  const isAreaAssigned = (area: string) => {
    return distributionGroups.some(group => {
      if (!group.days || !group.separation) return false;
      if (group.separation !== area) return false;
      
      // days is already an array of strings - just check if any are Hebrew days
      return group.days.some(day => ['א', 'ב', 'ג', 'ד', 'ה'].includes(day));
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
        <CardTitle className="text-lg">מאגר אזורים</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={drop}
          className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 ${
            isOver ? 'bg-muted/50 rounded-lg p-2' : ''
          }`}
        >
          {areasWithOrder.map((areaItem, index) => {
            const isDragged = draggedAreas.has(areaItem.area);
            const isAssigned = isAreaAssigned(areaItem.area);
            
            return (
              <div key={areaItem.area} className="relative">
                <div 
                  onDragStart={() => handleAreaDrag(areaItem.area)}
                >
                  <AreaTag
                    area={areaItem.area}
                    day=""
                    onRemove={() => {}}
                    isInPool={true}
                    totalsupplyspots={areaItem.totalsupplyspots}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};