import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { X } from 'lucide-react';
import { getAreaColor } from '@/utils/areaColors';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DistributionGroup {
  groups_id: number;
  separation: string;
  days: string[] | null;
  orderlabelinkavim: number | null;
  totalsupplyspots: number | null;
}

interface DaysAreaKanbanProps {
  distributionGroups: DistributionGroup[];
  onAreaDrop: (area: string, day: string | null) => void;
}

const AreaTag: React.FC<{
  area: string;
  day: string;
  totalsupplyspots: number | null;
  onRemove: () => void;
}> = ({ area, day, totalsupplyspots, onRemove }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'area-delivery',
    item: { area, day, sourceType: 'day', type: 'area-delivery' },
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
      <span className="truncate flex-1 font-medium">
        {area}
        {totalsupplyspots !== null && totalsupplyspots > 0 && (
          <span className="text-xs opacity-75 mr-1"> ({totalsupplyspots})</span>
        )}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-4 w-4 p-0 text-current hover:bg-white/20 mr-2"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};

const DayColumn: React.FC<{
  day: string;
  dayName: string;
  areas: { area: string; totalsupplyspots: number | null }[];
  onDrop: (area: string, day: string) => void;
  onRemove: (area: string) => void;
}> = ({ day, dayName, areas, onDrop, onRemove }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'area-delivery',
    drop: (item: { area: string; day?: string; sourceType: string }) => {
      onDrop(item.area, day);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <Card className="flex-1 min-w-[200px]">
      <CardContent className="p-4">
        <div className="text-center font-bold mb-3 text-lg">{dayName}</div>
        <div
          ref={drop}
          className={`space-y-2 min-h-[120px] p-2 rounded-lg transition-colors ${
            isOver && canDrop
              ? 'bg-primary/10 ring-2 ring-primary/30'
              : 'bg-muted/20'
          }`}
        >
          {areas.length === 0 ? (
            <div className="text-muted-foreground text-sm text-center py-8">
              אין אזורים מוקצים
            </div>
          ) : (
            areas.map((item) => (
              <AreaTag
                key={item.area}
                area={item.area}
                day={day}
                totalsupplyspots={item.totalsupplyspots}
                onRemove={() => onRemove(item.area)}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const DaysAreaKanban: React.FC<DaysAreaKanbanProps> = ({
  distributionGroups,
  onAreaDrop,
}) => {
  const days = ['א', 'ב', 'ג', 'ד', 'ה'];
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];

  const getAreasForDay = (targetDay: string) => {
    return distributionGroups
      .filter(
        (group) =>
          group.days &&
          group.days.length > 0 &&
          group.days.includes(targetDay)
      )
      .map((group) => ({
        area: group.separation,
        totalsupplyspots: group.totalsupplyspots,
      }));
  };

  const handleDrop = (area: string, day: string) => {
    onAreaDrop(area, day);
  };

  const handleRemove = (area: string) => {
    onAreaDrop(area, null);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">שיוך אזורים לימי אספקה</h3>
      <div className="flex gap-4 overflow-x-auto pb-4" dir="rtl">
        {days.map((day, index) => (
          <DayColumn
            key={day}
            day={day}
            dayName={dayNames[index]}
            areas={getAreasForDay(day)}
            onDrop={handleDrop}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  );
};
