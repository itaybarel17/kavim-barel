import React from 'react';
import { useDrag } from 'react-dnd';
import { Copy, Scissors, MoreHorizontal } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
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
  const [{ isDraggingCopy }, dragCopy] = useDrag({
    type: 'truck-copy',
    item: { type: 'truck-copy', week, day, truck },
    collect: (monitor) => ({
      isDraggingCopy: monitor.isDragging(),
    }),
    canDrag: !disabled,
  });

  const [{ isDraggingMove }, dragMove] = useDrag({
    type: 'truck-move',
    item: { type: 'truck-move', week, day, truck },
    collect: (monitor) => ({
      isDraggingMove: monitor.isDragging(),
    }),
    canDrag: !disabled,
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
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
        >
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem asChild>
          <div
            ref={dragCopy}
            className={`flex items-center gap-2 cursor-grab active:cursor-grabbing ${
              isDraggingCopy ? 'opacity-50' : ''
            }`}
          >
            <Copy className="h-4 w-4" />
            <span>העתק משאית</span>
          </div>
        </ContextMenuItem>
        <ContextMenuItem asChild>
          <div
            ref={dragMove}
            className={`flex items-center gap-2 cursor-grab active:cursor-grabbing ${
              isDraggingMove ? 'opacity-50' : ''
            }`}
          >
            <Scissors className="h-4 w-4" />
            <span>גזור משאית</span>
          </div>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};