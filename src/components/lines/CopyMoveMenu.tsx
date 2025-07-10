import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Copy, Scissors, MoreHorizontal } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface CopyMoveMenuProps {
  week: number;
  day: string;
  truck: number;
  disabled?: boolean;
}

export const CopyMoveMenu: React.FC<CopyMoveMenuProps> = ({
  week,
  day,
  truck,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [{ isDraggingCopy }, dragCopy] = useDrag({
    type: 'truck-copy',
    item: { type: 'truck-copy', week, day, truck },
    collect: (monitor) => ({
      isDraggingCopy: monitor.isDragging(),
    }),
    canDrag: !disabled,
    end: () => setOpen(false),
  });

  const [{ isDraggingMove }, dragMove] = useDrag({
    type: 'truck-move',
    item: { type: 'truck-move', week, day, truck },
    collect: (monitor) => ({
      isDraggingMove: monitor.isDragging(),
    }),
    canDrag: !disabled,
    end: () => setOpen(false),
  });

  if (disabled) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 opacity-30"
        disabled
      >
        <MoreHorizontal className="h-3 w-3" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
        >
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1">
        <div className="flex flex-col gap-1">
          <Button
            ref={dragCopy}
            variant="ghost"
            className={`flex items-center gap-2 justify-start h-8 cursor-grab active:cursor-grabbing ${
              isDraggingCopy ? 'opacity-50' : ''
            }`}
            disabled={disabled}
          >
            <Copy className="h-4 w-4" />
            <span>העתק משאית</span>
          </Button>
          <Button
            ref={dragMove}
            variant="ghost"
            className={`flex items-center gap-2 justify-start h-8 cursor-grab active:cursor-grabbing ${
              isDraggingMove ? 'opacity-50' : ''
            }`}
            disabled={disabled}
          >
            <Scissors className="h-4 w-4" />
            <span>גזור משאית</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};