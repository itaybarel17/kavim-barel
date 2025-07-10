import React from 'react';
import { useDrag } from 'react-dnd';
import { X } from 'lucide-react';
import { getAreaColor } from '@/utils/areaColors';
import { Button } from '@/components/ui/button';

interface AreaTagProps {
  area: string;
  day: string;
  onRemove: () => void;
  isInPool?: boolean;
}

export const AreaTag: React.FC<AreaTagProps> = ({
  area,
  day,
  onRemove,
  isInPool = false
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: isInPool ? 'area-from-pool' : 'area-from-day',
    item: { area, day, type: isInPool ? 'area-from-pool' : 'area-from-day' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const colorClass = getAreaColor(area);

  return (
    <div
      ref={drag}
      className={`relative flex items-center justify-between text-sm rounded px-3 py-2 cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      } ${colorClass}`}
    >
      <span className="truncate flex-1 font-medium">{area}</span>
      
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