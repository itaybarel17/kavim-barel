import React from 'react';
import { useDrag } from 'react-dnd';
import { X } from 'lucide-react';
import { getAreaColor } from '@/utils/areaColors';
import { Button } from '@/components/ui/button';

interface AreaTagVisitProps {
  area: string;
  day: string;
  onRemove: () => void;
  isInPool?: boolean;
  groupId?: number;
  agentsWorkArea?: number[] | null;
  totalsupplyspots?: number;
}

export const AreaTagVisit: React.FC<AreaTagVisitProps> = ({
  area,
  day,
  onRemove,
  isInPool = false,
  groupId,
  agentsWorkArea,
  totalsupplyspots
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: isInPool ? 'area-from-pool-visit' : 'area-from-day-visit',
    item: { area, day, groupId, type: isInPool ? 'area-from-pool-visit' : 'area-from-day-visit' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const colorClass = getAreaColor(area);

  // Parse agent numbers from agentsworkarea
  const getAgentNumbers = () => {
    if (!agentsWorkArea || !Array.isArray(agentsWorkArea) || agentsWorkArea.length === 0) return '';
    
    return ` (${agentsWorkArea.join(', ')})`;
  };

  return (
    <div
      ref={drag}
      className={`relative flex items-center justify-between text-sm rounded px-3 py-2 cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      } ${colorClass}`}
    >
      <span className="truncate flex-1 font-medium">
        {area}{getAgentNumbers()}
        {totalsupplyspots && (
          <span className="text-xs text-muted-foreground ml-1">
            ({totalsupplyspots})
          </span>
        )}
      </span>
      
      {!isInPool && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-4 w-4 p-0 text-current hover:bg-white/20 ml-2"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};